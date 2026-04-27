import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const body = await request.json()
    const { question, answer, interview_type } = body

    if (!question || !answer) return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 })

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `You are an expert interview coach. Score this interview answer honestly.

Interview type: ${interview_type}

Question: ${question}

Answer: ${answer}

Return ONLY valid JSON with this exact structure — no markdown, no explanation:
{
  "clarity": 0-100,
  "relevance": 0-100,
  "star_structure": 0-100,
  "confidence_indicators": 0-100,
  "feedback": "2-3 sentence constructive feedback",
  "improved_version": "A concise improved answer in 3-5 sentences"
}`

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-7',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })

    const rawText = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const scores = JSON.parse(rawText.trim())

    // Deduct scan
    await supabase.rpc('deduct_scan', { user_id: user.id })

    return NextResponse.json({ success: true, data: scores })
  } catch (err) {
    console.error('mock-interview score error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}