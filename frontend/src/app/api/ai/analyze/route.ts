import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'
import { aiRouter } from '@/lib/ai-router'

const SCAN_COST = 1

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  if (file.type === 'application/pdf') {
    const pdfParse = await import('pdf-parse')
    const parsed = await pdfParse.default(buffer)
    return parsed.text
  }
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string

    if (!file || !userId) {
      return NextResponse.json({ success: false, error: 'Missing file or userId' }, { status: 400 })
    }

    // ─── RATE LIMITING ───────────────────────────────────────────────────────────
    const rateLimit = await checkRateLimit(userId, 'analyze', 10, 60)
    if (!rateLimit?.success) {
      return rateLimitExceededResponse(rateLimit?.retryAfter || 60)
    }

    const supabase = await createAdminClient()

    // ─── ATOMIC SCAN DEDUCTION using RPC ─────────────────────────────────────────
    const { data: deductResult, error: deductError } = await supabase
      .rpc('deduct_scan', { p_user_id: userId, p_amount: SCAN_COST })

    if (deductError) {
      return NextResponse.json({ success: false, error: 'Database error during scan deduction' }, { status: 500 })
    }

    const parsedResult = typeof deductResult === 'string' ? JSON.parse(deductResult) : deductResult

    if (!parsedResult.success) {
      const errorMsg = parsedResult.error || 'Unknown error'
      if (errorMsg === 'Insufficient scans') {
        return NextResponse.json({ success: false, error: 'Not enough scans' }, { status: 402 })
      }
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 })
    }

    // ─── Extract resume text ─────────────────────────────────────────────────────
    const resumeText = await extractTextFromFile(file)

    // ─── Call AI Brain ──────────────────────────────────────────────────────────
    const aiResult = await aiRouter({
      mode: 'resume',
      userId,
      resumeText,
    })

    if (!aiResult.success) {
      // Refund scan on AI failure
      await supabase.rpc('add_scans', { p_user_id: userId, p_amount: SCAN_COST })
      return NextResponse.json({ success: false, error: aiResult.error }, { status: 500 })
    }

    // ─── Log the scan usage ───────────────────────────────────────────────────
    await supabase.from('scan_logs').insert({
      user_id: userId,
      action_type: 'ats_analysis',
      scans_used: SCAN_COST,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      data: aiResult.data,
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analysis failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
