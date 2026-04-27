import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, actionType } = body

    if (!userId || !amount || !actionType) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // ─── RATE LIMITING ─────────────────────────────────────────────────────────
    const rateLimit = await checkRateLimit(userId, 'scan_deduct', 20, 60)
    if (!rateLimit?.success) {
      return rateLimitExceededResponse(rateLimit?.retryAfter ?? 60)
    }

    const supabase = await createAdminClient()

    // ─── ATOMIC SCAN DEDUCTION using RPC ───────────────────────────────────────
    const { data: deductResult, error: deductError } = await supabase
      .rpc('deduct_scan', { p_user_id: userId, p_amount: amount })

    if (deductError) {
      return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 })
    }

    const parsedResult = typeof deductResult === 'string' ? JSON.parse(deductResult) : deductResult

    if (!parsedResult.success) {
      const errorMsg = parsedResult.error || 'Insufficient scans'
      return NextResponse.json({
        success: false,
        error: errorMsg,
        currentScans: parsedResult.current_scans || 0
      }, { status: 402 })
    }

    // ─── Log the action ─────────────────────────────────────────────────────────
    await supabase.from('scan_logs').insert({
      user_id: userId,
      action_type: actionType,
      scans_used: amount,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      data: {
        remainingScans: parsedResult.new_scans,
      },
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to deduct scans'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
