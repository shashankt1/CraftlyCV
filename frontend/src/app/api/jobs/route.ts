import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const { data } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

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
    const { company, role, status = 'wishlist', applied_date, resume_version_id, salary, job_url, notes, interview_date } = body

    if (!company?.trim()) return NextResponse.json({ error: 'Company is required' }, { status: 400 })
    if (!role?.trim()) return NextResponse.json({ error: 'Role is required' }, { status: 400 })

    const { data, error } = await supabase
      .from('job_applications')
      .insert({
        user_id: user.id,
        company,
        role,
        status,
        applied_date: applied_date || null,
        resume_version_id: resume_version_id || null,
        salary: salary || null,
        job_url: job_url || null,
        notes: notes || null,
        interview_date: interview_date || null,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}