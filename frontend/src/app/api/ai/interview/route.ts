import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'
import { aiRouter } from '@/lib/ai-router'

export async function POST(request: NextRequest) {
  try {
    const { question, answer, jobTitle, userId } = await request.json()
    if (!question || !answer) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // ─── RATE LIMITING ─────────────────────────────────────────────────────────
    if (userId) {
      const rateLimit = await checkRateLimit(userId, 'interview_grade', 20, 60)
      if (!rateLimit?.success) return rateLimitExceededResponse(rateLimit?.retryAfter || 60)
    }

    // ─── Call AI Brain ─────────────────────────────────────────────────────────
    const aiResult = await aiRouter({
      mode: 'interview',
      userId: userId || 'anonymous',
      interviewAction: 'continue',
      conversationHistory: [],
      jobTitle: jobTitle || 'Professional',
      context: { question, answer },
    })

    if (!aiResult.success) {
      return NextResponse.json({ error: aiResult.error }, { status: 500 })
    }

    return NextResponse.json(aiResult.data)

  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 })
  }
}