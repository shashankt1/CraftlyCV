import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { event, properties } = await request.json()

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const userId = user?.id ?? null

    const { error } = await supabase
      .from('analytics_events')
      .insert({
        user_id: userId,
        event,
        properties,
        created_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Analytics event error:', error)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Analytics error:', err)
    return NextResponse.json({ success: true })
  }
}
