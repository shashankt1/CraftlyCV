import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'
import { aiRouter } from '@/lib/ai-router'

const JOBS_SCAN_COST = 1

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  if (file.type === 'application/pdf') return (await import('pdf-parse').then(m => m.default(buffer))).text
  const mammoth = await import('mammoth')
  return (await mammoth.extractRawText({ buffer })).value
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string

    if (!file || !userId) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File too large. Maximum 10MB.' }, { status: 400 })
    }

    // ─── RATE LIMITING ─────────────────────────────────────────────────────────
    const rateLimit = await checkRateLimit(userId, 'jobs', 10, 60)
    if (!rateLimit?.success) return rateLimitExceededResponse(rateLimit?.retryAfter || 60)

    const supabase = await createAdminClient()

    // ─── ATOMIC SCAN DEDUCTION ─────────────────────────────────────────────────
    const { data: deductResult, error: deductError } = await supabase
      .rpc('deduct_scan', { p_user_id: userId, p_amount: JOBS_SCAN_COST })

    if (deductError) return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 })

    const parsedResult = typeof deductResult === 'string' ? JSON.parse(deductResult) : deductResult
    if (!parsedResult.success) {
      return NextResponse.json({ success: false, error: parsedResult.error || 'Insufficient scans' }, { status: 402 })
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
      return NextResponse.json({ success: false, error: aiResult.error }, { status: 500 })
    }

    // ─── LOG USAGE ───────────────────────────────────────────────────────────
    await supabase.from('scan_logs').insert({
      user_id: userId, action_type: 'job_suggester', scans_used: JOBS_SCAN_COST, created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      data: aiResult.data,
    })

  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed' }, { status: 500 })
  }
}
