import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount, actionType } = body

    // ─── INPUT VALIDATION ─────────────────────────────────────────────────────
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'INVALID_INPUT',
        message: 'Invalid user ID'
      }, { status: 400 })
    }

    if (!amount || typeof amount !== 'number' || amount <= 0 || !Number.isInteger(amount)) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_AMOUNT',
        message: 'Invalid scan amount'
      }, { status: 400 })
    }

    if (!actionType || typeof actionType !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'INVALID_ACTION',
        message: 'Invalid action type'
      }, { status: 400 })
    }

    // ─── RATE LIMITING ────────────────────────────────────────────────────────
    const rateLimit = await checkRateLimit(userId, 'scan_deduct', 30, 60)
    if (!rateLimit?.success) {
      return rateLimitExceededResponse(rateLimit?.retryAfter ?? 60)
    }

    const supabase = await createAdminClient()

    // ─── FIRST: Check user exists and has enough scans ────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('scans')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      }, { status: 404 })
    }

    if (profile.scans < amount) {
      return NextResponse.json({
        success: false,
        error: 'INSUFFICIENT_SCANS',
        message: 'Not enough scans',
        currentScans: profile.scans,
        requiredScans: amount,
      }, { status: 402 })
    }

    // ─── ATOMIC SCAN DEDUCTION using RPC ────────────────────────────────────
    const { data: deductResult, error: deductError } = await supabase
      .rpc('deduct_scan', { p_user_id: userId, p_amount: amount })

    let newScanCount = profile.scans - amount

    // If RPC fails, fall back to direct update
    if (deductError) {
      console.error('Scan RPC failed, using fallback:', deductError?.message)

      // Direct update as fallback
      const { data: updateResult, error: updateError } = await supabase
        .from('profiles')
        .update({ scans: newScanCount })
        .eq('id', userId)
        .eq('scans', profile.scans) // Optimistic lock
        .select('scans')
        .single()

      if (updateError) {
        console.error('Scan deduct fallback failed:', updateError)
        return NextResponse.json({
          success: false,
          error: 'DEDUCTION_FAILED',
          message: 'Failed to deduct scans. Please try again.'
        }, { status: 500 })
      }

      newScanCount = updateResult?.scans ?? newScanCount
    } else {
      // Parse RPC result
      if (deductResult) {
        const parsed = typeof deductResult === 'string'
          ? JSON.parse(deductResult)
          : deductResult

        if (parsed?.success && typeof parsed.new_scans === 'number') {
          newScanCount = parsed.new_scans
        }
      }
    }

    // ─── LOG THE ACTION ──────────────────────────────────────────────────────
    await supabase.from('scan_logs').insert({
      user_id: userId,
      action_type: actionType,
      scans_used: amount,
      credits_remaining: newScanCount,
    }).then(({ error }) => {
      if (error) console.error('Failed to log scan:', error)
    })

    return NextResponse.json({
      success: true,
      data: {
        remainingScans: newScanCount,
        scansUsed: amount,
      },
    })

  } catch (error) {
    console.error('[/api/scans/deduct]', error)
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to process scan deduction'
    }, { status: 500 })
  }
}
