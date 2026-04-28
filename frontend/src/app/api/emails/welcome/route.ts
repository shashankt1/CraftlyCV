import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { render } from '@react-email/render'

export async function POST() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, email, referral_code')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const { sendEmail } = await import('@/lib/email')
    const { WelcomeEmail } = await import('@/emails/welcome')

    const emailHtml = await render(WelcomeEmail({
      firstName: profile.first_name || 'there',
      referralCode: profile.referral_code || undefined,
    }))

    const result = await sendEmail(profile.email, 'Welcome to CraftlyCV', emailHtml)

    if (!result.success) {
      console.error('Failed to send welcome email:', result.error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Welcome email route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
