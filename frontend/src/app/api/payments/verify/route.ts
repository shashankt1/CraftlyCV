import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'

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
      return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 })
    }

    if (!userId || !scans) {
      return NextResponse.json({ error: 'Missing userId or scans' }, { status: 400 })
    }

    // ─── Server-side Signature Verification ────────────────────────────────────
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      return NextResponse.json({ error: 'Payment verification not configured' }, { status: 500 })
    }

    const signatureBody = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signatureBody)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // ─── Idempotent Payment Recording using Supabase RPC ────────────────────────
    const supabase = await createAdminClient()

    const { data: result, error: rpcError } = await supabase.rpc('record_payment', {
      p_payment_id: razorpay_payment_id,
      p_user_id: userId,
      p_order_id: razorpay_order_id,
      p_plan_id: planId || 'free',
      p_scans_added: scans,
      p_amount: amount || 0,
      p_currency: currency,
    })

    if (rpcError) {
      console.error('Payment RPC error:', rpcError)
      return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 })
    }

    const parsedResult = typeof result === 'string' ? JSON.parse(result) : result

    if (!parsedResult.success && parsedResult.already_processed) {
      // Payment was already processed - return success without processing again
      return NextResponse.json({
        success: true,
        message: 'Payment already processed',
        alreadyProcessed: true,
      })
    }

    if (!parsedResult.success) {
      return NextResponse.json({ error: parsedResult.error || 'Payment recording failed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and scans added',
      paymentId: razorpay_payment_id,
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment verification failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
