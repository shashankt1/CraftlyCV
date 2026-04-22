import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// SECURE ADMIN CHECK - Server-side only, uses session cookies
export async function POST(request: NextRequest) {
  try {
    // Use the user's session cookie to verify identity (NOT client-sent email)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized - no valid session' }, { status: 401 })
    }

    // Check if user has admin role in database
    const supabaseAdmin = await createClient()
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Unauthorized - profile not found' }, { status: 403 })
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - admin access required' }, { status: 403 })
    }

    return NextResponse.json({
      authorized: true,
      adminId: user.id,
      email: profile.email || user.email,
    })

  } catch (error) {
    return NextResponse.json({ error: 'Authorization check failed' }, { status: 401 })
  }
}
