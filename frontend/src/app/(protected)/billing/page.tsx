'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const PLANS = [
  {
    id: 'career_launch',
    name: 'Career Launch',
    price: 49,
    tagline: 'Everything you need for your job search',
    features: ['5 tailored versions', 'Match score analysis', 'ATS risk scan', 'PDF export', 'Cover letter generator', '30-day access'],
    color: 'blue',
  },
  {
    id: 'niche_pro',
    name: 'Niche Pro Pack',
    price: 79,
    tagline: 'Full power for serious applicants',
    popular: true,
    features: ['Unlimited tailored versions', 'All niche packs', 'Premium visual export', 'Priority AI processing', 'Application tracker', '12-month access'],
    color: 'purple',
  },
  {
    id: 'concierge',
    name: 'Concierge Rewrite',
    price: 149,
    tagline: 'Human-AI hybrid resume rewrite',
    features: ['Premium ghost-write', '1:1 intake call', '3 tailored versions', '60-day revisions', 'Priority support'],
    color: 'amber',
  },
]

export default function BillingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [router, supabase])

  const handlePurchase = async (planId: string) => {
    setPurchasing(planId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please log in again')
        router.push('/auth')
        return
      }

      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, userId: user.id }),
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.message || 'Failed to create order')
        setPurchasing(null)
        return
      }

      const { orderId, amount, razorpayKey } = json.data

      // @ts-ignore
      if (!window.Razorpay) {
        toast.error('Payment system not loaded. Please refresh.')
        setPurchasing(null)
        return
      }

      // @ts-ignore
      const rzp = new window.Razorpay({
        key: razorpayKey,
        amount,
        currency: 'INR',
        name: 'CraftlyCV',
        description: `CraftlyCV ${planId.replace('_', ' ')} plan`,
        order_id: orderId,
        handler: async (response: any) => {
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              planId,
              userId: user.id,
            }),
          })
          const verifyJson = await verifyRes.json()

          if (verifyJson.success) {
            toast.success('Purchase successful!')
            router.push('/dashboard')
          } else {
            toast.error(verifyJson.message || 'Payment verification failed')
            setPurchasing(null)
          }
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled')
            setPurchasing(null)
          }
        }
      })

      // @ts-ignore
      rzp.on('payment.failed', (response: any) => {
        toast.error(`Payment failed: ${response.error?.description || 'Unknown error'}`)
        setPurchasing(null)
      })

      // @ts-ignore
      rzp.open()
    } catch (err) {
      console.error('Purchase error:', err)
      toast.error('Purchase failed. Please try again.')
      setPurchasing(null)
    }
  }

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-96" /></div>
  }

  const colorMap: Record<string, string> = {
    blue: 'border-blue-200 dark:border-blue-800',
    purple: 'border-purple-200 dark:border-purple-800',
    amber: 'border-amber-200 dark:border-amber-800',
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-sm text-muted-foreground">One-time pricing. No subscriptions.</p>
      </div>

      {profile?.plan !== 'free' && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-4 flex items-center gap-3">
            <Check className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                You have the {PLANS.find(p => p.id === profile?.plan)?.name} plan
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                {profile?.scans} scans remaining
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map(plan => {
          const isCurrent = profile?.plan === plan.id
          const isPopular = 'popular' in plan && plan.popular

          return (
            <Card key={plan.id} className={`relative ${colorMap[plan.color]} ${isPopular ? 'ring-2 ring-purple-500' : ''}`}>
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white">Most Popular</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>{plan.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">
                  ₹{plan.price}
                  <span className="text-sm font-normal text-muted-foreground"> one-time</span>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={isCurrent ? 'outline' : 'default'}
                  disabled={isCurrent || purchasing !== null}
                  onClick={() => handlePurchase(plan.id)}
                >
                  {purchasing === plan.id ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : (
                    'Purchase'
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>30-day money-back guarantee. No questions asked.</p>
        <p className="mt-1">
          Need help? <a href="mailto:support@craftlycv.com" className="text-blue-600 hover:underline">Contact us</a>
        </p>
      </div>
    </div>
  )
}
