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
      .select('id')
      .eq('id', userId)
      .single()

    if (!existingProfile) {
      // Trigger didn't fire or was too slow — create profile manually
      const baseUsername = email
        .split('@')[0]
        .replace(/[^a-z0-9]/gi, '')
        .toLowerCase()
        .slice(0, 12) || 'user'

      const username = `${baseUsername}_${userId.slice(0, 6)}`
      const referral_code = `${baseUsername.slice(0, 8)}_${userId.slice(0, 6)}`

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
          country: 'IN',
          language: 'en',
          currency: 'INR',
          input_language: 'en',
          output_language: 'en',
          referral_code,
          onboarding_completed: false,
          onboarding_step: 0,
          experience_level: 'mid',
          professional_track: 'general',
        })

      if (insertError) {
        // 23505 = duplicate key — trigger created it between our check and insert
        if (insertError.code === '23505') {
          console.log('Profile already created by trigger — continuing')
        } else {
          console.error('CRITICAL - Profile creation failed:', insertError)
          return NextResponse.redirect(`${origin}/auth?error=profile_create_failed`)
        }
      }
    }

    // Handle referral cookie
    const refCookie = request.headers.get('cookie')
      ?.split(';')
      .find(c => c.trim().startsWith('craftly_ref='))
      ?.split('=')[1]
      ?.trim()

    if (refCookie) {
      try {
        const { data: referrer } = await admin
          .from('profiles')
          .select('id')
          .eq('referral_code', refCookie)
          .single()

        if (referrer && referrer.id !== userId) {
          await admin
            .from('profiles')
            .update({ referred_by_code: refCookie })
            .eq('id', userId)

          await admin.from('referrals').insert({
            referrer_id: referrer.id,
            referred_id: userId,
            referral_code: refCookie,
            status: 'pending',
          })
        }
      } catch (refErr) {
        console.warn('Referral apply failed (non-blocking):', refErr)
      }
    }

    return NextResponse.redirect(`${origin}${next}`)

  } catch (err) {
    console.error('Auth callback exception:', err)
    return NextResponse.redirect(`${origin}/auth?error=auth_exception`)
  }
}