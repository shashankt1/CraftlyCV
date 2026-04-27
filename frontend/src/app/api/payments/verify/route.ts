/**
 * POST /api/payments/verify
 * Strict Razorpay payment verification with idempotency
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'

// Server-side plan → price mapping (paisa)
const PLAN_PRICES: Record<string, number> = {
  career_launch: 4900,  // ₹49
  niche_pro: 7900,      // ₹79
  concierge: 14900,     // ₹149
}

// Server-side plan → scans mapping
const PLAN_SCANS: Record<string, number> = {
  career_launch: 50,
  niche_pro: 100,
  concierge: 200,
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      userId,
    } = body

    // ─── Input Validation ─────────────────────────────────────────────────────
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({
        error: 'MISSING_FIELDS',
        message: 'Payment information incomplete'
      }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({
        error: 'USER_REQUIRED',
        message: 'User ID required'
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

    // Verify signature
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

    // Check if already processed
    const { data: existing } = await admin
      .from('processed_payments')
      .select('id')
      .eq('payment_id', razorpay_payment_id)
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
      .insert({ payment_id: razorpay_payment_id, user_id: userId })

    if (processedError) {
      // Duplicate - already processed
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        alreadyProcessed: true,
      })
    }

    // ─── Record Transaction + Update User ──────────────────────────────────────
    const scansToAdd = PLAN_SCANS[planId] ?? 0
    const planPrice = PLAN_PRICES[planId]
    const planName = planId.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())

    // Insert transaction record
    await admin
      .from('payment_transactions')
      .insert({
        user_id: userId,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        plan_id: planId,
        plan_name: planName,
        scans_added: scansToAdd,
        amount: planPrice,
        currency: 'INR',
        status: 'completed',
      })

    // Update user profile - get current scans first
    const { data: currentProfile } = await admin
      .from('profiles')
      .select('scans')
      .eq('id', userId)
      .single()

    const newScanTotal = (currentProfile?.scans ?? 0) + scansToAdd

    await admin
      .from('profiles')
      .update({
        scans: newScanTotal,
        plan: planId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    return NextResponse.json({
      success: true,
      data: {
        scansAdded: scansToAdd,
        totalScans: newScanTotal,
        planId,
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
