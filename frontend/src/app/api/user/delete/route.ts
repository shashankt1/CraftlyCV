import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    if (body.confirm !== 'DELETE') {
      return NextResponse.json(
        { error: 'Confirmation string "DELETE" is required' },
        { status: 400 }
      )
    }

    const userId = user.id

    // Soft delete: anonymize profile
    const anonymizedEmail = `deleted_${Date.now()}@craftlycv.in`
    const anonymizedName = 'Deleted User'

    await supabase
      .from('profiles')
      .update({
        email: anonymizedEmail,
        first_name: anonymizedName,
        last_name: null,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', userId)

    // Hard delete: resume data and applications
    await Promise.all([
      supabase.from('resume_versions').delete().eq('user_id', userId),
      supabase.from('master_resumes').delete().eq('user_id', userId),
      supabase.from('resume_analyses').delete().eq('user_id', userId),
      supabase.from('job_applications').delete().eq('user_id', userId),
      supabase.from('vault').delete().eq('user_id', userId),
    ])

    // Keep payment_transactions but remove user_id for accounting
    await supabase
      .from('payment_transactions')
      .update({ user_id: null })
      .eq('user_id', userId)

    // Sign out all sessions
    await supabase.auth.signOut({ scope: 'global' })

    // Send deletion confirmation email (to the anonymized email won't work, so we skip this step)
    // In production, you might want to send this before anonymizing

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete account route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
