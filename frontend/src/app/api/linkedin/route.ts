import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const profile = await supabase.from('profiles').select('plan').eq('id', user.id).single()
    if (!['pro', 'lifetime'].includes(profile.data?.plan)) {
      return NextResponse.json({ error: 'PRO_REQUIRED' }, { status: 403 })
    }

    const body = await request.json()
    const { headline, about, skills, target_role, job_description } = body

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `You are a LinkedIn profile optimization expert. Optimize the user's LinkedIn profile for maximum recruiter visibility and ATS compatibility.

Current Profile:
- Headline: "${headline || 'Not provided'}"
- About/Summary: "${about || 'Not provided'}"
- Skills: "${skills || 'Not provided'}"
- Target Role: "${target_role || 'General'}"
${job_description ? `- Target Job Description: "${job_description}"` : ''}

Return ONLY valid JSON with this exact structure — no markdown, no explanation:
{
  "optimized_headline": "improved headline under 220 chars",
  "headline_explanation": "brief explanation of the change",
  "optimized_summary": "improved summary paragraph",
  "summary_explanation": "brief explanation of the change",
  "skills_to_add": ["skill 1", "skill 2"],
  "skills_to_remove": ["skill 1"],
  "keyword_density_score": 0-100,
  "recruiter_visibility_tips": ["tip 1", "tip 2", "tip 3"],
  "open_to_work_advice": "advice on open to work settings",
  "estimated_visibility_improvement": "e.g. 'High impact — 40% more recruiter views expected'"
}`

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-7',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    })

    const rawText = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const data = JSON.parse(rawText.trim())

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('linkedin optimize error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}