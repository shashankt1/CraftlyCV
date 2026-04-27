import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Razorpay from 'razorpay'
import { PLANS } from '@/lib/plans'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
})

export async function GET() {
  // Return available plans without auth
  const plans = PLANS.map(plan => ({
    id: plan.id,
    name: plan.name,
    price: plan.price,
    priceLabel: plan.priceLabel,
    badge: plan.badge,
    features: plan.features,
  }))

  return NextResponse.json({ plans })
}

export async function POST(request: NextRequest) {
  try {
    // Require auth
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { planId } = body

    // Validate planId
    const plan = PLANS.find(p => p.id === planId)
    if (!plan) {
      return NextResponse.json(
        { message: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    if (plan.price === 0) {
      return NextResponse.json(
        { message: 'Cannot create order for free plan' },
        { status: 400 }
      )
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: plan.price * 100, // Razorpay uses paise (smallest currency unit)
      currency: 'INR',
      receipt: `plan_${plan.id}_${user.id}_${Date.now()}`,
      notes: {
        planId: plan.id,
        userId: user.id,
      },
    })

    // Store in payment_transactions table (if table exists)
    try {
      await supabase.from('payment_transactions').insert({
        user_id: user.id,
        razorpay_order_id: razorpayOrder.id,
        amount: plan.price,
        currency: 'INR',
        plan_id: plan.id,
        status: 'pending',
      })
    } catch (dbError) {
      console.error('Failed to store transaction:', dbError)
      // Continue anyway - we'll verify payment on callback
    }

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: plan.price * 100,
      currency: 'INR',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { message: 'Failed to create order. Please try again.' },
      { status: 500 }
    )
  }
}
