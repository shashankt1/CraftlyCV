import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const profile = await supabase.from('profiles').select('plan, scans').eq('id', user.id).single()
    if (!['pro', 'lifetime'].includes(profile.data?.plan)) {
      return NextResponse.json({ error: 'PRO_REQUIRED' }, { status: 403 })
    }

    const body = await request.json()
    const { role, niche, interview_type, num_questions, job_description } = body

    if (!role) return NextResponse.json({ error: 'Role is required' }, { status: 400 })

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `You are an interview coach. Generate exactly ${num_questions} interview questions for a ${interview_type} interview for the role of "${role}" in the ${niche} niche${job_description ? `. The job description is: ${job_description}` : ''}.

Return ONLY valid JSON with this exact structure:
{
  "questions": ["question 1", "question 2", ...]
}

Do not include any explanation, markdown, or anything outside the JSON.`

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-7',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })

    const rawText = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const parsed = JSON.parse(rawText.trim())

    return NextResponse.json({ success: true, data: { role, niche, interview_type, num_questions: parseInt(num_questions), questions: parsed.questions.map((t: string) => ({ text: t })) } })
  } catch (err) {
    console.error('mock-interview generate error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}