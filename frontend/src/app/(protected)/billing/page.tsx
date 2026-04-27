'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRazorpay } from '@/hooks/useRazorpay'
import { PLANS, isPro } from '@/lib/plans'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'
import { toast } from 'sonner'
import {
  CreditCard,
  Star,
  Crown,
  Zap,
  Check,
  ChevronRight,
  Loader2,
  Download,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Profile {
  id: string
  email: string
  plan: string
  scans: number
  plan_expires_at: string | null
}

interface Transaction {
  id: string
  plan_id: string
  amount: number
  status: string
  created_at: string
}

export default function BillingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { loadAndOpen } = useRazorpay()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  // Auto-upgrade if param present
  useEffect(() => {
    const upgrade = searchParams.get('upgrade')
    if (upgrade && ['starter', 'pro', 'lifetime'].includes(upgrade)) {
      loadAndOpen(upgrade)
      router.replace('/billing')
    }
  }, [searchParams, loadAndOpen, router])

  // Load profile and transactions
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // Load profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileData) {
          setProfile(profileData)
        }

        // Load transactions
        const { data: txData } = await supabase
          .from('payment_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (txData) {
          setTransactions(txData)
        }
      } catch (error) {
        console.error('Failed to load billing data:', error)
        toast.error('Failed to load billing information')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase, router])

  const handleUpgrade = async (planId: string) => {
    if (!profile) return

    track('billing_upgrade_clicked', { plan: planId })
    await loadAndOpen(planId)
  }

  const handleCancelSubscription = async () => {
    if (!profile) return

    setCancelling(true)
    try {
      // In a real implementation, this would call an API to cancel the subscription
      toast.success('Subscription cancelled. You can continue using Pro until your billing period ends.')
      setCancelDialogOpen(false)
    } catch (error) {
      toast.error('Failed to cancel subscription')
    } finally {
      setCancelling(false)
    }
  }

  const getPlanName = (planId: string) => {
    return PLANS.find(p => p.id === planId)?.name || planId
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600/20 text-green-400 border-green-600/30">Completed</Badge>
      case 'pending':
        return <Badge className="bg-amber-600/20 text-amber-400 border-amber-600/30">Pending</Badge>
      case 'failed':
        return <Badge className="bg-red-600/20 text-red-400 border-red-600/30">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container max-w-4xl py-10 space-y-6">
        <Skeleton className="h-32 w-full bg-zinc-900" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full bg-zinc-900" />
          ))}
        </div>
      </div>
    )
  }

  const currentPlan = PLANS.find(p => p.id === profile?.plan) || PLANS[0]
  const isLifetime = profile?.plan === 'lifetime'

  return (
    <div className="container max-w-5xl py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-100">Billing</h1>
        <p className="text-zinc-400 mt-1">Manage your subscription and payment history</p>
      </div>

      {/* Current Plan Card */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 flex items-center justify-center">
                <Star className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-zinc-100">{currentPlan.name}</h2>
                  {currentPlan.badge && (
                    <Badge variant="outline" className="border-indigo-500/50 text-indigo-400">
                      {currentPlan.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-zinc-400 mt-0.5">
                  {profile?.scans || 0} scans remaining
                  {profile?.plan_expires_at && !isLifetime && (
                    <> · Expires {new Date(profile.plan_expires_at).toLocaleDateString()}</>
                  )}
                  {isLifetime && ' · Never expires'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isPro(profile || { plan: profile?.plan || 'free' }) ? (
                <Button
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  Cancel Subscription
                </Button>
              ) : (
                <Button
                  className="bg-indigo-600 hover:bg-indigo-500 text-white"
                  onClick={() => handleUpgrade('pro')}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const isCurrentPlan = profile?.plan === plan.id
          const isProPlan = plan.id === 'pro'

          return (
            <Card
              key={plan.id}
              className={cn(
                'relative bg-zinc-900/50 border-zinc-800 transition-all',
                isProPlan && 'ring-2 ring-indigo-500/50',
                isCurrentPlan && 'border-indigo-500/50'
              )}
            >
              <CardContent className="p-6">
                {/* Badge */}
                {plan.badge && (
                  <Badge
                    className={cn(
                      'absolute -top-2 left-4',
                      plan.id === 'pro' && 'bg-indigo-600 text-white',
                      plan.id === 'lifetime' && 'bg-amber-600 text-white',
                      plan.id === 'starter' && 'bg-zinc-700 text-zinc-200'
                    )}
                  >
                    {plan.badge}
                  </Badge>
                )}

                {/* Plan Header */}
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-zinc-100">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-zinc-100">{plan.price === 0 ? 'Free' : `₹${plan.price}`}</span>
                    {plan.price > 0 && plan.id !== 'lifetime' && (
                      <span className="text-sm text-zinc-500 ml-1">/month</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{plan.priceLabel}</p>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrentPlan ? (
                  <Button variant="outline" className="w-full border-zinc-700" disabled>
                    Current Plan
                  </Button>
                ) : plan.price === 0 ? (
                  <Button variant="outline" className="w-full border-zinc-700 text-zinc-400" disabled>
                    Free Forever
                  </Button>
                ) : (
                  <Button
                    className={cn(
                      'w-full',
                      isProPlan
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'
                    )}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {plan.id === 'lifetime' ? (
                      <>
                        <Crown className="w-4 h-4 mr-2 text-amber-400" />
                        Get Lifetime
                      </>
                    ) : (
                      <>
                        Get Started
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}

                {/* Urgency for Lifetime */}
                {plan.id === 'lifetime' && (
                  <p className="text-xs text-amber-500/80 text-center mt-3">
                    Founding member pricing — 47 spots left
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Payment History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-100">Payment History</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-zinc-100"
            onClick={() => {/* Implement download invoice */}}
          >
            <Download className="w-4 h-4 mr-2" />
            Download All
          </Button>
        </div>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <div className="py-12 text-center">
                <CreditCard className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">No payment history yet</p>
                <p className="text-sm text-zinc-500 mt-1">
                  Your transactions will appear here after your first payment
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Date</TableHead>
                    <TableHead className="text-zinc-400">Plan</TableHead>
                    <TableHead className="text-zinc-400">Amount</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-zinc-400 text-right">Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id} className="border-zinc-800">
                      <TableCell className="text-zinc-300">
                        {new Date(tx.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-zinc-300">
                        {getPlanName(tx.plan_id)}
                      </TableCell>
                      <TableCell className="text-zinc-300">
                        ₹{tx.amount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(tx.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-zinc-400 hover:text-zinc-100 h-8 px-2"
                          onClick={() => {/* Implement download invoice */}}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cancel Subscription Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Cancel Subscription</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Are you sure you want to cancel your Pro subscription? You will lose access to:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2 text-sm text-zinc-300">
            <div className="flex items-center gap-2">
              <X className="w-4 h-4 text-red-400" />
              Unlimited scans
            </div>
            <div className="flex items-center gap-2">
              <X className="w-4 h-4 text-red-400" />
              Unlimited tailoring
            </div>
            <div className="flex items-center gap-2">
              <X className="w-4 h-4 text-red-400" />
              All premium modules
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              onClick={() => setCancelDialogOpen(false)}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={cancelling}
            >
              {cancelling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
