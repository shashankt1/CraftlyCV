import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { PLANS } from '@/lib/plans'

// Server-side plan prices (INR paisa) - must match frontend
const PLAN_PRICES: Record<string, number> = {
  starter_monthly: 4900,  // ₹49
  starter_yearly: 49900,  // ₹499
  pro_monthly: 14900,     // ₹149
  pro_yearly: 149900,     // ₹1499
  lifetime: 39900,        // ₹399 one-time
  enterprise_monthly: 359900, // ₹3599
  enterprise_yearly: 3599000, // ₹35990
}

export async function POST(request: NextRequest) {
  try {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      return NextResponse.json({ success: false, error: 'Razorpay not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { amount, userId, planId } = body

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
    }

    // ─── SERVER-SIDE PRICE VALIDATION ─────────────────────────────────────────
    let finalAmount: number

    if (planId && PLAN_PRICES[planId] !== undefined) {
      // Validate amount matches expected price for plan
      finalAmount = PLAN_PRICES[planId]

      // If client sent a different amount, reject it
      if (amount && Math.abs(Number(amount) - finalAmount) > 1) {
        console.error(`Price mismatch for plan ${planId}: expected ${finalAmount}, got ${amount}`)
        return NextResponse.json({
          success: false,
          error: 'Price validation failed. Please refresh and try again.',
        }, { status: 400 })
      }
    } else if (amount) {
      // Custom amount - validate minimum
      finalAmount = Number(amount)
      if (finalAmount < 100) {
        return NextResponse.json({ success: false, error: 'Minimum amount is ₹1' }, { status: 400 })
      }
      if (finalAmount > 10000000) { // ₹10L max
        return NextResponse.json({ success: false, error: 'Amount exceeds maximum' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ success: false, error: 'Amount or planId required' }, { status: 400 })
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })

    const order = await razorpay.orders.create({
      amount: finalAmount,
      currency: 'INR',
      receipt: `rcpt_${userId}_${Date.now()}`.substring(0, 40),
      notes: {
        userId,
        planId: planId || 'custom',
      },
    })

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId,
    })

  } catch (error) {
    console.error('Razorpay create-order error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    )
  }
}
