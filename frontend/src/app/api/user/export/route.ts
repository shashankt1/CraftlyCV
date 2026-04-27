import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit - one export per 24 hours
    const { data: profile } = await supabase
      .from('profiles')
      .select('last_export')
      .eq('id', user.id)
      .single()

    if (profile?.last_export) {
      const lastExport = new Date(profile.last_export)
      const hoursSinceLastExport = (Date.now() - lastExport.getTime()) / (1000 * 60 * 60)
      if (hoursSinceLastExport < 24) {
        return NextResponse.json(
          { error: 'Export already requested. Please wait 24 hours between exports.' },
          { status: 429 }
        )
      }
    }

    // Compile all user data
    const [profileData, vaultData, versionsData, analysesData, applicationsData, paymentsData] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('vault').select('*').eq('user_id', user.id),
        supabase.from('resume_versions').select('*').eq('user_id', user.id),
        supabase.from('resume_analyses').select('*').eq('user_id', user.id),
        supabase.from('job_applications').select('*').eq('user_id', user.id),
        supabase.from('payment_transactions').select('*').eq('user_id', user.id),
      ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      userId: user.id,
      profile: profileData.data,
      vault: vaultData.data || [],
      resumeVersions: versionsData.data || [],
      analyses: analysesData.data || [],
      jobApplications: applicationsData.data || [],
      paymentHistory: paymentsData.data || [],
    }

    // Update last_export timestamp
    await supabase
      .from('profiles')
      .update({ last_export: new Date().toISOString() })
      .eq('id', user.id)

    const jsonString = JSON.stringify(exportData, null, 2)

    return new NextResponse(jsonString, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="craftlycv-data-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (err) {
    console.error('Export route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
