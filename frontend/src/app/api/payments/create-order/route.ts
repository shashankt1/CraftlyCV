import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { PLANS } from '@/lib/plans'

// Server-side plan prices (INR paisa) - STRICT mapping, no custom amounts
const PLAN_PRICES: Record<string, number> = {
  career_launch: 4900,  // ₹49 one-time
  niche_pro: 7900,     // ₹79 one-time
  concierge: 14900,    // ₹149 one-time
}

// Scan bonuses per plan
const PLAN_SCANS: Record<string, number> = {
  career_launch: 50,
  niche_pro: 100,
  concierge: 200,
}

export async function POST(request: NextRequest) {
  try {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      return NextResponse.json({
        success: false,
        error: 'PAYMENT_NOT_CONFIGURED',
        message: 'Payment system is not configured. Please contact support.'
      }, { status: 503 })
    }

    const body = await request.json()
    const { planId, userId } = body

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'USER_REQUIRED',
        message: 'User ID is required'
      }, { status: 400 })
    }

    // ─── PLAN VALIDATION (MANDATORY) ──────────────────────────────────────────
    if (!planId || !PLAN_PRICES[planId]) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_PLAN',
        message: 'Please select a valid plan'
      }, { status: 400 })
    }

    // Server-side price lookup - NEVER trust client amount
    const finalAmount = PLAN_PRICES[planId]
    const scansIncluded = PLAN_SCANS[planId]

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })

    const order = await razorpay.orders.create({
      amount: finalAmount,
      currency: 'INR',
      receipt: `craftly_${planId}_${userId.slice(0, 8)}_${Date.now()}`.slice(0, 50),
      notes: {
        userId,
        planId,
        scans: String(scansIncluded),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        razorpayKey: keyId,
      },
    })

  } catch (error: any) {
    console.error('[/api/payments/create-order]', error?.message || error)
    return NextResponse.json({
      success: false,
      error: 'ORDER_FAILED',
      message: 'Failed to create order. Please try again.'
    }, { status: 500 })
  }
}
