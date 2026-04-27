import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'
import { aiRouter } from '@/lib/ai-router'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { task, userId } = body

    if (!task) return NextResponse.json({ success: false, error: 'Missing task' }, { status: 400 })

    // ─── RATE LIMITING ─────────────────────────────────────────────────────────
    if (userId) {
      const rateLimit = await checkRateLimit(userId, 'build_resume', 15, 60)
      if (!rateLimit?.success) return rateLimitExceededResponse(rateLimit?.retryAfter || 60)
    }

    if (task === 'summary') {
      const { data } = body
      const result = await aiRouter({
        mode: 'general',
        userId: userId || 'anonymous',
        query: `Write a professional summary: Name: ${data?.name || ''}, Role: ${data?.workExp?.[0]?.role || ''}, Companies: ${data?.workExp?.map((w: any) => w.company).join(', ') || ''}, Skills: ${data?.skills?.join(', ') || ''}`,
      })
      return NextResponse.json({ success: true, data: { result: result.success ? result.data?.response : 'Professional summary generation unavailable' } })
    }

    if (task === 'bullets') {
      const { company, role, bullets } = body
      const result = await aiRouter({
        mode: 'resume',
        userId: userId || 'anonymous',
        resumeText: `Company: ${company}, Role: ${role}\nBullets: ${(bullets || []).join('\n')}`,
      })
      return NextResponse.json({ success: true, data: { result: result.success ? result.data : bullets } })
    }

    return NextResponse.json({ success: false, error: 'Unknown task' }, { status: 400 })

  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed' }, { status: 500 })
  }
}
