'use client'

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { PLANS } from '@/lib/plans'

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ''

export function useRazorpay() {
  const loadAndOpen = useCallback(async (planId: string) => {
    // Load Razorpay script dynamically
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true

    await new Promise<void>((resolve, reject) => {
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Razorpay script'))
      document.body.appendChild(script)
    })

    // Get user email from supabase profile
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let userEmail = ''
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single()
      userEmail = profile?.email || user.email || ''
    }

    // Create order
    try {
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.message || 'Failed to create order')
        return
      }

      const data = await response.json()
      const plan = PLANS.find(p => p.id === planId)

      // @ts-expect-error Razorpay is loaded via script
      const razorpay = new window.Razorpay({
        key: RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: 'INR',
        name: 'CraftlyCV',
        description: plan?.name || 'CraftlyCV Plan',
        prefill: {
          email: userEmail,
        },
        theme: {
          color: '#6366f1',
        },
        order_id: data.orderId,
      })

      razorpay.on('payment.success', async (paymentResponse: {
        razorpay_payment_id: string
        razorpay_order_id: string
        razorpay_signature: string
      }) => {
        try {
          const verifyResponse = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            }),
          })

          if (verifyResponse.ok) {
            // Reload profile from supabase
            await supabase.auth.refreshSession()
            toast.success('Payment successful! Your plan has been upgraded.')
          } else {
            toast.error('Payment verification failed')
          }
        } catch {
          toast.error('Payment verification failed')
        }
      })

      razorpay.on('payment.error', () => {
        toast.error('Payment failed. Please try again.')
      })

      razorpay.open()
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Something went wrong. Please try again.')
    }
  }, [])

  return { loadAndOpen }
}
