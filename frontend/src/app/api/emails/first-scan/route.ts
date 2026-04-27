import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { score, topSuggestions } = body

    if (typeof score !== 'number') {
      return NextResponse.json({ error: 'Score is required' }, { status: 400 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, email')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const { sendEmail } = await import('@/lib/email')
    const { FirstScanEmail } = await import('@/emails/first-scan')

    const emailHtml = FirstScanEmail({
      firstName: profile.first_name || 'there',
      score,
      topSuggestions: topSuggestions || [],
    })

    const result = await sendEmail(profile.email, 'Your First Scan Results are Ready', emailHtml)

    if (!result.success) {
      console.error('Failed to send first scan email:', result.error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('First scan email route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
