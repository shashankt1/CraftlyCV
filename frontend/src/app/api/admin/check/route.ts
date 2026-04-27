import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// SECURE ADMIN CHECK - Server-side only, uses session cookies
export async function POST(request: NextRequest) {
  try {
    // Use the user's session cookie to verify identity
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Use admin client to check role
    const supabaseAdmin = await createAdminClient()
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 403 })
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: {
        authorized: true,
        adminId: user.id,
        email: profile.email || user.email,
      },
    })

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Authorization check failed' }, { status: 500 })
  }
}
