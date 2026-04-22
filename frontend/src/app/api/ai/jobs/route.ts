import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'
import { aiRouter } from '@/lib/ai-router'

const JOBS_SCAN_COST = 1

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  if (file.type === 'application/pdf') return (await require('pdf-parse')(buffer)).text
  return (await require('mammoth').extractRawText({ buffer })).value
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string

    if (!file || !userId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 10MB.' }, { status: 400 })
    }

    // ─── RATE LIMITING ─────────────────────────────────────────────────────────
    const rateLimit = await checkRateLimit(userId, 'jobs', 10, 60)
    if (!rateLimit?.success) return rateLimitExceededResponse(rateLimit.retryAfter || 60)

    const supabase = await createAdminClient()

    // ─── ATOMIC SCAN DEDUCTION ─────────────────────────────────────────────────
    const { data: deductResult, error: deductError } = await supabase
      .rpc('deduct_scan', { p_user_id: userId, p_amount: JOBS_SCAN_COST })

    if (deductError) return NextResponse.json({ error: 'Database error' }, { status: 500 })

    const parsedResult = typeof deductResult === 'string' ? JSON.parse(deductResult) : deductResult
    if (!parsedResult.success) {
      const err = parsedResult.error || ''
      if (err === 'Insufficient scans') return NextResponse.json({ error: 'Need 1 scan' }, { status: 402 })
      return NextResponse.json({ error: err }, { status: 400 })
    }

    const resumeText = await extractText(file)

    // ─── Call AI Brain ──────────────────────────────────────────────────────────
    const aiResult = await aiRouter({
      mode: 'career',
      userId,
      resumeText,
    })

    if (!aiResult.success) {
      await supabase.rpc('add_scans', { p_user_id: userId, p_amount: JOBS_SCAN_COST })
      return NextResponse.json({ error: aiResult.error }, { status: 500 })
    }

    // ─── LOG USAGE ───────────────────────────────────────────────────────────
    await supabase.from('scan_logs').insert({
      user_id: userId, action_type: 'job_suggester', scans_used: JOBS_SCAN_COST, created_at: new Date().toISOString(),
    })

    return NextResponse.json(aiResult.data)

  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed' }, { status: 500 })
  }
}