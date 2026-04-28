import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/onboarding'

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=no_code`)
  }

  const supabase = await createClient()
  const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

  if (sessionError || !sessionData.user) {
    console.error('Auth callback error:', sessionError)
    return NextResponse.redirect(`${origin}/auth?error=auth_failed`)
  }

  const userId = sessionData.user.id
  const email = sessionData.user.email ?? ''

  try {
    const admin = await createAdminClient()

    // Check if profile already exists (trigger may have already created it)
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('onboarding_completed, username')
      .eq('id', userId)
      .single()

    if (!existingProfile) {
      // Trigger didn't fire or was too slow — create profile manually
      // Use a unique username based on email + UUID suffix to avoid conflicts
      const emailBase = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 10) || 'user'
      const username = `${emailBase}_${userId.slice(0, 6)}`
      const referralCode = `REF_${userId.slice(0, 8).toUpperCase()}`

      const { error: insertError } = await admin
        .from('profiles')
        .insert({
          id: userId,
          email,
          username,
          full_name: sessionData.user.user_metadata?.full_name
            || sessionData.user.user_metadata?.name
            || null,
          scans: 3,
          plan: 'free',
          role: 'user',
          country: 'US',
          language: 'en',
          currency: 'USD',
          referral_code: referralCode,
          onboarding_completed: false,
          onboarding_step: 0,
          experience_level: 'mid',
          professional_track: 'general',
        })

      if (insertError) {
        // 23505 = duplicate key — trigger created it between our check and insert (safe to ignore)
        // Other errors are real problems
        if (insertError.code !== '23505') {
          console.error('CRITICAL - Profile creation failed:', insertError)
          // Don't block login — redirect to onboarding which has fallback profile creation
          console.warn('Blocking on profile create failure - will redirect to onboarding')
        }
      }
    }

    // Fetch final profile state (may have been just created)
    const { data: finalProfile } = await admin
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .single()

    // Determine redirect: if onboarding complete, go to dashboard, else to onboarding
    const redirectTo = finalProfile?.onboarding_completed === true ? '/dashboard' : '/onboarding'

    // Handle referral cookie
    const refCookie = request.headers.get('cookie')
      ?.split(';')
      .find(c => c.trim().startsWith('craftly_ref='))
      ?.split('=')[1]
      ?.trim()

    if (refCookie && existingProfile?.onboarding_completed !== true) {
      try {
        const { data: referrer } = await admin
          .from('profiles')
          .select('id')
          .eq('referral_code', refCookie)
          .single()

        if (referrer && referrer.id !== userId) {
          // Update referrer's scan count (award 1 scan)
          try {
            await admin.rpc('add_scans', { p_user_id: referrer.id, p_amount: 1, p_action: 'referral' })
          } catch { /* non-blocking */ }

          // Record referral
          try {
            await admin.from('referrals').insert({
              referrer_id: referrer.id,
              referred_id: userId,
            })
          } catch { /* non-blocking */ }

          // Mark referred user
          try {
            await admin
              .from('profiles')
              .update({ referred_by: referrer.id })
              .eq('id', userId)
          } catch { /* non-blocking */ }
        }
      } catch (refErr) {
        // Non-blocking — don't fail the auth callback
        console.warn('Referral apply failed (non-blocking):', refErr)
      }
    }

    return NextResponse.redirect(`${origin}${redirectTo}`)

  } catch (err) {
    console.error('Auth callback exception:', err)
    // On any error, redirect to onboarding as safe fallback
    return NextResponse.redirect(`${origin}/onboarding`)
  }
}