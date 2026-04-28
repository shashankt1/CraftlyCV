import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const admin = await createAdminClient()
    const { id } = await params
    const { data } = await admin
      .from('resume_versions')
      .select('*, master_resumes(content)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!data) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

    const { data: history } = await admin
      .from('version_history')
      .select('*')
      .eq('version_id', id)
      .order('created_at', { ascending: true })

    return NextResponse.json({ success: true, data: { ...data, history: history ?? [] } })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const body = await request.json()
    const { status, tailored_content, version_name, ats_score } = body
    const { id } = await params

    const admin = await createAdminClient()

    // Snapshot current content before overwriting
    if (tailored_content) {
      const { data: current } = await admin
        .from('resume_versions')
        .select('tailored_content')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (current?.tailored_content) {
        await admin.from('version_history').insert({
          version_id: id,
          content_snapshot: current.tailored_content,
        })
      }
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (status !== undefined) updates.status = status
    if (tailored_content !== undefined) updates.tailored_content = tailored_content
    if (version_name !== undefined) updates.version_name = version_name
    if (ats_score !== undefined) updates.ats_score = ats_score

    const { data, error } = await admin.from('resume_versions')
      .update(updates)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const { id } = await params
    const admin = await createAdminClient()
    const { error } = await admin
      .from('resume_versions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
