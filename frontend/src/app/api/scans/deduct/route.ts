import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, actionType } = body

    // ─── INPUT VALIDATION ─────────────────────────────────────────────────────────
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 })
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }

    if (!actionType || typeof actionType !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing action type' }, { status: 400 })
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

    // Handle RPC error
    if (deductError) {
      console.error('Scan deduction RPC error:', deductError)
      return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 })
    }

    // Parse RPC result
    const parsedResult = typeof deductResult === 'string' ? JSON.parse(deductResult) : deductResult

    // Check for specific error codes
    if (!parsedResult.success) {
      const errorCode = parsedResult.code || 'UNKNOWN_ERROR'
      const errorMsg = parsedResult.error || 'Deduction failed'

      // Return appropriate HTTP status based on error type
      if (errorCode === 'INSUFFICIENT_SCANS') {
        return NextResponse.json({
          success: false,
          error: errorMsg,
          code: errorCode,
          currentScans: parsedResult.current_scans ?? 0,
        }, { status: 402 }) // Payment required / Insufficient resources
      }

      if (errorCode === 'USER_NOT_FOUND') {
        return NextResponse.json({
          success: false,
          error: 'User not found',
          code: errorCode,
        }, { status: 404 })
      }

      if (errorCode === 'INVALID_AMOUNT') {
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          code: errorCode,
        }, { status: 400 })
      }

      // Generic deduction failure
      return NextResponse.json({
        success: false,
        error: errorMsg,
        code: errorCode,
      }, { status: 400 })
    }

    // ─── LOG THE ACTION ─────────────────────────────────────────────────────────
    const { error: logError } = await supabase.from('scan_logs').insert({
      user_id: userId,
      action_type: actionType,
      scans_used: amount,
      created_at: new Date().toISOString(),
    })

    if (logError) {
      // Log failure is not critical - don't block the response
      console.error('Failed to log scan usage:', logError)
    }

    return NextResponse.json({
      success: true,
      data: {
        remainingScans: parsedResult.new_scans ?? 0,
        scansUsed: amount,
      },
    })

  } catch (error) {
    console.error('Scan deduction error:', error)
    const message = error instanceof Error ? error.message : 'Failed to deduct scans'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
