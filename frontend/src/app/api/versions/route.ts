import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const { data, error } = await supabase
      .from('resume_versions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data: data ?? [] })
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
    const { masterResumeId, versionName, targetCompany, targetRole, jobDescription, inputLanguage, outputLanguage } = body

    const { data, error } = await supabase.from('resume_versions').insert({
      user_id: user.id,
      master_resume_id: masterResumeId || null,
      version_name: versionName || 'Untitled Version',
      tailored_for_company: targetCompany || null,
      tailored_for_role: targetRole || null,
      job_description: jobDescription || null,
      status: 'draft',
      input_language: inputLanguage || 'en',
      output_language: outputLanguage || 'en',
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
