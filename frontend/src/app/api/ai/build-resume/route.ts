import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'
import { aiRouter, buildSummary, buildBullets } from '@/lib/ai-router'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { task, userId } = body

    if (!task) return NextResponse.json({ error: 'Missing task' }, { status: 400 })

    // ─── RATE LIMITING ─────────────────────────────────────────────────────────
    if (userId) {
      const rateLimit = await checkRateLimit(userId, 'build_resume', 15, 60)
      if (!rateLimit?.success) return rateLimitExceededResponse(rateLimit.retryAfter || 60)
    }

    if (task === 'summary') {
      const { data } = body
      const result = await buildSummary({
        name: data?.name,
        workExp: data?.workExp,
        skills: data?.skills,
        education: data?.education,
      })
      return NextResponse.json({ result })
    }

    if (task === 'bullets') {
      const { company, role, bullets } = body
      const result = await buildBullets(company || '', role || '', bullets || [])
      return NextResponse.json({ result })
    }

    return NextResponse.json({ error: 'Unknown task' }, { status: 400 })

  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 })
  }
}