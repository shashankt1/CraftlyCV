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
    // Ensure profile exists using admin client
    const admin = await createAdminClient()

    // Check if profile already exists
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (!existingProfile) {
      // Create profile - this MUST succeed
      const username = email
        .split('@')[0]
        .replace(/[^a-z0-9]/gi, '')
        .toLowerCase()
        .slice(0, 20) || `user_${userId.slice(0, 8)}`

      const { error: insertError } = await admin
        .from('profiles')
        .insert({
          id: userId,
          email,
          username,
          scans: 10,
          plan: 'free',
          country: 'US',
          language: 'en',
          currency: 'USD',
          referral_code: `${username}_${userId.slice(0, 4)}`,
          onboarding_completed: false,
          onboarding_step: 0,
          experience_level: 'mid',
          professional_track: 'general',
        })

      if (insertError) {
        // CRITICAL: If profile insert fails, we cannot proceed
        console.error('CRITICAL - Profile creation failed:', insertError)
        return NextResponse.redirect(`${origin}/auth?error=profile_create_failed`)
      }
    }

    // Success - redirect to intended page
    return NextResponse.redirect(`${origin}${next}`)

  } catch (err) {
    console.error('Auth callback exception:', err)
    return NextResponse.redirect(`${origin}/auth?error=auth_exception`)
  }
}
