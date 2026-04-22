import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'
import { aiRouter } from '@/lib/ai-router'

const ROADMAP_SCAN_COST = 2

export async function POST(request: NextRequest) {
  try {
    const { userId, detectedField, targetGoal, score } = await request.json()

    if (!userId || !targetGoal) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // ─── RATE LIMITING ─────────────────────────────────────────────────────────
    const rateLimit = await checkRateLimit(userId, 'roadmap', 10, 60)
    if (!rateLimit?.success) return rateLimitExceededResponse(rateLimit.retryAfter || 60)

    const supabase = await createAdminClient()

    // ─── ATOMIC SCAN DEDUCTION ─────────────────────────────────────────────────
    const { data: deductResult, error: deductError } = await supabase
      .rpc('deduct_scan', { p_user_id: userId, p_amount: ROADMAP_SCAN_COST })

    if (deductError) return NextResponse.json({ error: 'Database error' }, { status: 500 })

    const parsedResult = typeof deductResult === 'string' ? JSON.parse(deductResult) : deductResult
    if (!parsedResult.success) {
      const err = parsedResult.error || ''
      if (err === 'Insufficient scans') return NextResponse.json({ error: 'Need 2 scans' }, { status: 402 })
      return NextResponse.json({ error: err }, { status: 400 })
    }

    // ─── Call AI Brain ──────────────────────────────────────────────────────────
    const aiResult = await aiRouter({
      mode: 'career',
      userId,
      context: { detectedField, targetGoal, score },
    })

    if (!aiResult.success) {
      await supabase.rpc('add_scans', { p_user_id: userId, p_amount: ROADMAP_SCAN_COST })
      return NextResponse.json({ error: aiResult.error }, { status: 500 })
    }

    // ─── LOG USAGE ───────────────────────────────────────────────────────────
    await supabase.from('scan_logs').insert({
      user_id: userId, action_type: 'career_suggester', scans_used: ROADMAP_SCAN_COST, created_at: new Date().toISOString(),
    })

    return NextResponse.json(aiResult.data)

  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Roadmap generation failed' }, { status: 500 })
  }
}