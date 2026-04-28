import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      )
    }

    const sanitized = username.toLowerCase().replace(/[^a-z0-9]/g, '')

    if (sanitized.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Username must be at least 3 characters' },
        { status: 400 }
      )
    }

    if (sanitized.length > 20) {
      return NextResponse.json(
        { success: false, error: 'Username must be 20 characters or less' },
        { status: 400 }
      )
    }

    if (!/^[a-z0-9]+$/.test(sanitized)) {
      return NextResponse.json(
        { success: false, error: 'Only letters and numbers allowed' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    const { data: existing, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', sanitized)
      .maybeSingle()

    if (error !== null && error.code !== 'PGRST116') {
      console.error('Username check error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to check username availability' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        available: !existing,
        username: sanitized,
      },
    })
  } catch (err) {
    console.error('Username check exception:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
