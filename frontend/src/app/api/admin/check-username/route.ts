import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// SECURE: Check username uniqueness using admin client to bypass RLS
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json({ success: false, error: 'Missing username' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .single()

    return NextResponse.json({
      success: true,
      data: {
        available: !existing,
        username: username.toLowerCase(),
      },
    })

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Check failed' }, { status: 500 })
  }
}
