import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// SECURE: Check username uniqueness using admin client to bypass RLS
// This is needed because RLS filters out other users' profiles,
// causing false negatives in username availability checks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json({ error: 'Missing username' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .single()

    return NextResponse.json({
      available: !existing,
      username: username.toLowerCase(),
    })

  } catch (error) {
    return NextResponse.json({ error: 'Check failed' }, { status: 500 })
  }
}
