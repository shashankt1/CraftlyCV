import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

const SECTIONS = ['experience', 'education', 'projects', 'certifications', 'skills', 'achievements', 'languages', 'niche_tags']

function calculateCompleteness(content: Record<string, unknown>): number {
  let filled = 0
  for (const section of SECTIONS) {
    const data = content[section]
    if (data && (Array.isArray(data) ? data.length > 0 : Object.keys(data as object).length > 0)) filled++
  }
  return Math.round((filled / SECTIONS.length) * 100)
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const admin = await createAdminClient()
    const { data } = await admin.from('master_resumes').select('*').eq('user_id', user.id).single()

    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const body = await request.json()
    const content = body.content || {}
    const completeness_score = calculateCompleteness(content)

    const admin = await createAdminClient()
    const { data, error } = await admin.from('master_resumes').insert({
      user_id: user.id,
      content,
      completeness_score,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const body = await request.json()
    const { id, content } = body
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const completeness_score = calculateCompleteness(content || {})

    const admin = await createAdminClient()
    const { data, error } = await admin.from('master_resumes')
      .update({ content, completeness_score, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
