/**
 * POST /api/payments/verify
 * Strict Razorpay payment verification with idempotency + referral rewards
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { track } from '@/lib/analytics'

// Server-side plan → price mapping (in paisa for Razorpay)
const PLAN_PRICES: Record<string, number> = {
  starter: 19900,    // ₹199
  pro: 49900,        // ₹499/month
  lifetime: 299900,  // ₹2999
}

// Server-side plan → scans mapping
const PLAN_SCANS: Record<string, number> = {
  starter: 10,
  pro: -1, // unlimited — represented as -1
  lifetime: -1,
}

export async function POST(request: NextRequest) {
  try {
    // ─── Session Auth ───────────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Login required' }, { status: 401 })
    }

    const body = await request.json()
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
    } = body
    const userId = user.id
    // Map to schema column names
    const orderId = razorpay_order_id
    const paymentId = razorpay_payment_id

    // ─── Input Validation ─────────────────────────────────────────────────────
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({
        error: 'MISSING_FIELDS',
        message: 'Payment information incomplete'
      }, { status: 400 })
    }

    if (!planId || !PLAN_PRICES[planId]) {
      return NextResponse.json({
        error: 'INVALID_PLAN',
        message: 'Invalid plan selected'
      }, { status: 400 })
    }

    // ─── Signature Verification (STRICT) ─────────────────────────────────────
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      console.error('Razorpay secret not configured')
      return NextResponse.json({
        error: 'CONFIG_ERROR',
        message: 'Payment system misconfigured'
      }, { status: 500 })
    }

    // Verify signature: order_id|payment_id
    const signatureBody = `${razorpay_order_id}|${razorpay_payment_id}`
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(signatureBody)
      .digest('hex')

    if (expectedSig !== razorpay_signature) {
      console.error('Signature mismatch')
      return NextResponse.json({
        error: 'INVALID_SIGNATURE',
        message: 'Payment verification failed'
      }, { status: 400 })
    }

    // ─── Idempotent Payment Recording ──────────────────────────────────────────
    const admin = await createAdminClient()

    // Check if already processed (idempotency)
    const { data: existing } = await admin
      .from('processed_payments')
      .select('id')
      .eq('razorpay_payment_id', razorpay_payment_id)
      .single()

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        alreadyProcessed: true,
      })
    }

    // Mark as processed FIRST (idempotency key)
    const { error: processedError } = await admin
      .from('processed_payments')
      .insert({
        razorpay_payment_id: paymentId,
        user_id: userId,
        amount: PLAN_PRICES[planId] / 100,
        plan_id: planId,
      })

    if (processedError) {
      // Duplicate - already processed
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        alreadyProcessed: true,
      })
    }

    // ─── Record Transaction + Update User ──────────────────────────────────────
    const planScans = PLAN_SCANS[planId] ?? 0
    const planPrice = PLAN_PRICES[planId] / 100 // convert to rupees

    // Insert transaction record
    await admin
      .from('payment_transactions')
      .insert({
        user_id: userId,
        order_id: orderId,
        payment_id: paymentId,
        plan_id: planId,
        amount: planPrice,
        currency: 'INR',
        status: 'completed',
      })

    // Update user profile
    const planExpiresAt = planId === 'lifetime' ? null : (
      planId === 'pro' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null
    )

    const newScans = planScans === -1 ? 999999 : planScans // -1 = unlimited

    await admin
      .from('profiles')
      .update({
        plan: planId,
        scans: newScans,
        plan_expires_at: planExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    // ─── Referral Purchase Reward ─────────────────────────────────────────────
    const { data: profile } = await admin
      .from('profiles')
      .select('referred_by')
      .eq('id', userId)
      .single()

    if (profile?.referred_by) {
      // Find referrer
      const { data: referrer } = await admin
        .from('profiles')
        .select('id')
        .eq('referral_code', profile.referred_by)
        .single()

      if (referrer) {
        // Award +3 scans to referrer
        await admin.rpc('add_scans', { p_user_id: referrer.id, p_amount: 3, p_action: 'referral_purchase' })

        // Insert referral event
        await admin
          .from('referral_events')
          .insert({
            referrer_id: referrer.id,
            referred_id: userId,
            event_type: 'purchase',
            scans_awarded: 3,
          })
      }
    }

    // ─── Analytics ───────────────────────────────────────────────────────────
    track('payment_completed', { plan: planId, amount: planPrice })

    return NextResponse.json({
      success: true,
      data: {
        plan: planId,
        scans: planScans,
        paymentId: razorpay_payment_id,
      },
      message: 'Payment verified successfully',
    })

  } catch (err) {
    console.error('[/api/payments/verify]', err)
    return NextResponse.json({
      error: 'VERIFICATION_FAILED',
      message: 'Payment verification failed'
    }, { status: 500 })
  }
}