import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/plans'

// Server-side plan prices for validation
const PLAN_PRICES: Record<string, number> = {
  starter_monthly: 4900,
  starter_yearly: 49900,
  pro_monthly: 14900,
  pro_yearly: 149900,
  lifetime: 39900,
  enterprise_monthly: 359900,
  enterprise_yearly: 3599000,
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      planId,
      scans,
      amount,
      currency = 'INR',
    } = body

    // ─── Input Validation ──────────────────────────────────────────────────────
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, error: 'Missing payment fields' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 })
    }

    // ─── Server-side Signature Verification ────────────────────────────────────
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      return NextResponse.json({ success: false, error: 'Payment verification not configured' }, { status: 500 })
    }

    const signatureBody = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signatureBody)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 })
    }

    // ─── Server-side Amount Validation ─────────────────────────────────────────
    if (planId && PLAN_PRICES[planId] !== undefined) {
      const expectedAmount = PLAN_PRICES[planId]
      if (amount && Math.abs(Number(amount) - expectedAmount) > 1) {
        console.error(`Payment amount mismatch: expected ${expectedAmount}, got ${amount}`)
        return NextResponse.json({
          success: false,
          error: 'Payment amount verification failed',
        }, { status: 400 })
      }
    }

    // ─── Idempotent Payment Recording using Supabase RPC ────────────────────────
    const supabase = await createAdminClient()

    const { data: result, error: rpcError } = await supabase.rpc('record_payment', {
      p_payment_id: razorpay_payment_id,
      p_user_id: userId,
      p_order_id: razorpay_order_id,
      p_plan_id: planId || 'free',
      p_scans_added: scans || 0,
      p_amount: amount || 0,
      p_currency: currency,
    })

    if (rpcError) {
      console.error('Payment RPC error:', rpcError)
      return NextResponse.json({ success: false, error: 'Payment processing failed' }, { status: 500 })
    }

    const parsedResult = typeof result === 'string' ? JSON.parse(result) : result

    if (!parsedResult.success && parsedResult.already_processed) {
      // Idempotent - already processed
      return NextResponse.json({
        success: true,
        message: 'Payment already processed',
        alreadyProcessed: true,
      })
    }

    if (!parsedResult.success) {
      return NextResponse.json({ success: false, error: parsedResult.error || 'Payment recording failed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentId: razorpay_payment_id,
        scansAdded: scans || 0,
      },
      message: 'Payment verified and scans added',
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment verification failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
