import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Razorpay from 'razorpay'
import { PLANS_LIST } from '@/lib/plans'

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || ''
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || ''

function getRazorpay() {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured')
  }
  return new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
}

export async function GET() {
  const plans = PLANS_LIST.map(plan => ({
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
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planId } = body

    const plan = PLANS_LIST.find(p => p.id === planId)
    if (!plan) {
      return NextResponse.json({ message: 'Invalid plan selected' }, { status: 400 })
    }

    if (plan.price === 0) {
      return NextResponse.json({ message: 'Cannot create order for free plan' }, { status: 400 })
    }

    const razorpay = getRazorpay()
    const razorpayOrder = await razorpay.orders.create({
      amount: plan.price * 100,
      currency: 'INR',
      receipt: `plan_${plan.id}_${user.id}_${Date.now()}`,
      notes: { planId: plan.id, userId: user.id },
    })

    try {
      await supabase.from('payment_transactions').insert({
        user_id: user.id,
        order_id: razorpayOrder.id,
        payment_id: null, // set on verify
        amount: plan.price,
        currency: 'INR',
        plan_id: plan.id,
        status: 'pending',
      })
    } catch (dbError) {
      console.error('Failed to store transaction:', dbError)
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
