'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRazorpay } from '@/hooks/useRazorpay'
import { PLANS_LIST, isPro } from '@/lib/plans'
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
  Shield,
  RefreshCw,
  Sparkles,
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

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Star className="w-5 h-5" />,
  starter: <Zap className="w-5 h-5" />,
  pro: <Sparkles className="w-5 h-5" />,
  lifetime: <Crown className="w-5 h-5" />,
}

const PLAN_GRADIENTS: Record<string, string> = {
  free: 'from-slate-600/20 to-slate-700/10',
  starter: 'from-amber-600/20 to-orange-700/10',
  pro: 'from-indigo-600/20 to-violet-700/10',
  lifetime: 'from-amber-500/20 to-orange-600/10',
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
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'lifetime'>('monthly')

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

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileData) {
          setProfile(profileData)
        }

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
      toast.success('Subscription cancelled. You can continue using Pro until your billing period ends.')
      setCancelDialogOpen(false)
    } catch (error) {
      toast.error('Failed to cancel subscription')
    } finally {
      setCancelling(false)
    }
  }

  const getPlanName = (planId: string) => {
    return PLANS_LIST.find(p => p.id === planId)?.name || planId
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Completed</Badge>
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pending</Badge>
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Build displayed plans based on billing cycle preference
  const displayedPlans = PLANS_LIST.filter(p => {
    if (billingCycle === 'lifetime') return p.id !== 'pro'
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <div className="container max-w-6xl py-10 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-9 w-48 bg-zinc-800" />
              <Skeleton className="h-4 w-64 mt-2 bg-zinc-800" />
            </div>
          </div>
          <Skeleton className="h-48 w-full bg-zinc-900 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-80 w-full bg-zinc-900 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const currentPlan = PLANS_LIST.find(p => p.id === profile?.plan) || PLANS_LIST[0]
  const isLifetime = profile?.plan === 'lifetime'
  const isActivePro = isPro(profile)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-indigo-600/5" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-amber-500/5" />
      </div>

      <div className="relative container max-w-6xl py-10 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Subscription</h1>
            <p className="text-zinc-400 mt-1">Manage your plan and billing</p>
          </div>
          {isActivePro && !isLifetime && (
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 px-4 py-2 text-sm">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Pro Member
            </Badge>
          )}
          {isLifetime && (
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 px-4 py-2 text-sm">
              <Crown className="w-3.5 h-3.5 mr-1.5" />
              Lifetime Access
            </Badge>
          )}
        </div>

        {/* Current Plan Hero Card */}
        <Card className={cn(
          'relative overflow-hidden border',
          isActivePro ? 'border-indigo-500/30 bg-gradient-to-br from-indigo-600/10 to-violet-600/5' : 'border-zinc-800 bg-zinc-900/50'
        )}>
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50" />
          <CardContent className="relative p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start gap-5">
                <div className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0',
                  isActivePro ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-700/50 text-zinc-400'
                )}>
                  {PLAN_ICONS[currentPlan.id] || <Star className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold">{currentPlan.name}</h2>
                    {currentPlan.badge && (
                      <Badge className={cn(
                        'text-xs',
                        currentPlan.id === 'pro' ? 'bg-indigo-600 text-white' :
                        currentPlan.id === 'lifetime' ? 'bg-amber-600 text-white' :
                        'bg-zinc-700 text-zinc-200'
                      )}>
                        {currentPlan.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-zinc-400 mt-1">{currentPlan.description}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm">
                    <span className={cn(
                      'font-medium',
                      profile?.scans !== undefined && profile.scans > 0 ? 'text-emerald-400' : 'text-zinc-500'
                    )}>
                      {profile?.scans ?? 0} scan credits
                    </span>
                    {profile?.plan_expires_at && !isLifetime && (
                      <span className="text-zinc-500">
                        Renews {new Date(profile.plan_expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                    {isLifetime && (
                      <span className="text-amber-400 font-medium">Never expires</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 lg:shrink-0">
                {isActivePro || profile?.plan === 'free' ? (
                  profile?.plan === 'free' ? (
                    <Button
                      size="lg"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white"
                      onClick={() => handleUpgrade('pro')}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Upgrade to Pro
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                      onClick={() => setCancelDialogOpen(true)}
                    >
                      Cancel Subscription
                    </Button>
                  )
                ) : (
                  <Button
                    size="lg"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
                    onClick={() => handleUpgrade('pro')}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Upgrade Now
                  </Button>
                )}
              </div>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-zinc-800">
              {currentPlan.features.slice(0, 4).map((feature, i) => (
                <div key={i} className="flex items-center gap-1.5 text-sm text-zinc-300 bg-zinc-800/50 px-3 py-1.5 rounded-full">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  {feature}
                </div>
              ))}
              {currentPlan.features.length > 4 && (
                <div className="text-sm text-zinc-500 px-3 py-1.5">
                  +{currentPlan.features.length - 4} more
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Plan Comparison Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Available Plans</h2>
              <p className="text-zinc-400 text-sm mt-1">Choose the plan that fits your career goals</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {displayedPlans.map((plan) => {
              const isCurrentPlan = profile?.plan === plan.id
              const isProPlan = plan.id === 'pro'
              const isLifetimePlan = plan.id === 'lifetime'

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    'relative overflow-hidden transition-all duration-300',
                    isCurrentPlan
                      ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                      : 'border-zinc-800 hover:border-zinc-700',
                    isProPlan && !isCurrentPlan && 'hover:ring-2 hover:ring-indigo-500/30'
                  )}
                >
                  {/* Gradient background for highlighted plans */}
                  <div className={cn(
                    'absolute inset-0 bg-gradient-to-br opacity-50',
                    PLAN_GRADIENTS[plan.id] || 'from-zinc-700/20 to-zinc-800/10'
                  )} />

                  {isProPlan && !isCurrentPlan && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />
                  )}

                  <CardContent className="relative p-6 flex flex-col">
                    {/* Badge */}
                    {plan.badge && (
                      <div className="absolute -top-2 left-4">
                        <Badge className={cn(
                          'shadow-lg',
                          plan.id === 'pro' ? 'bg-indigo-600 text-white' :
                          plan.id === 'lifetime' ? 'bg-amber-600 text-white' :
                          plan.id === 'starter' ? 'bg-zinc-700 text-zinc-200' :
                          'bg-zinc-600 text-zinc-200'
                        )}>
                          {plan.badge}
                        </Badge>
                      </div>
                    )}

                    {/* Plan Icon & Name */}
                    <div className="flex items-center gap-3 mb-4 mt-2">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        plan.id === 'free' ? 'bg-zinc-700/50 text-zinc-400' :
                        plan.id === 'starter' ? 'bg-amber-500/20 text-amber-400' :
                        plan.id === 'pro' ? 'bg-indigo-500/20 text-indigo-400' :
                        'bg-amber-500/20 text-amber-400'
                      )}>
                        {PLAN_ICONS[plan.id] || <Star className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-100">{plan.name}</h3>
                        <p className="text-xs text-zinc-500">{plan.description}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-zinc-100">
                          {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                        </span>
                        {plan.price > 0 && !isLifetimePlan && (
                          <span className="text-zinc-500 text-sm">/month</span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">{plan.priceLabel}</p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                          <Check className={cn(
                            'w-4 h-4 mt-0.5 flex-shrink-0',
                            isLifetimePlan ? 'text-amber-400' : 'text-emerald-400'
                          )} />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    {isCurrentPlan ? (
                      <Button
                        variant="outline"
                        className="w-full border-indigo-500/50 text-indigo-300 bg-indigo-500/10"
                        disabled
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Current Plan
                      </Button>
                    ) : plan.price === 0 ? (
                      <Button
                        variant="outline"
                        className="w-full border-zinc-700 text-zinc-400"
                        disabled
                      >
                        Free Forever
                      </Button>
                    ) : (
                      <Button
                        className={cn(
                          'w-full font-semibold transition-all',
                          isProPlan
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30'
                            : isLifetimePlan
                            ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-500/20'
                            : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100'
                        )}
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        {isLifetimePlan ? (
                          <>
                            <Crown className="w-4 h-4 mr-2 text-amber-300" />
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

                    {/* Urgency indicator for lifetime */}
                    {isLifetimePlan && (
                      <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-amber-500/80">
                        <Sparkles className="w-3 h-3" />
                        Limited time founding price
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 py-4 text-zinc-500">
          <div className="flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Secure payments via Razorpay</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4 text-emerald-500" />
            <span>7-day refund guarantee</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-emerald-500" />
            <span>Instant access after payment</span>
          </div>
        </div>

        {/* Payment History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Payment History</h2>
              <p className="text-zinc-400 text-sm mt-1">Your recent transactions</p>
            </div>
          </div>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-zinc-600" />
                  </div>
                  <p className="text-zinc-400 font-medium">No transactions yet</p>
                  <p className="text-zinc-600 text-sm mt-1">
                    Your payment history will appear here after your first purchase
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-400 font-medium">Date</TableHead>
                      <TableHead className="text-zinc-400 font-medium">Plan</TableHead>
                      <TableHead className="text-zinc-400 font-medium">Amount</TableHead>
                      <TableHead className="text-zinc-400 font-medium">Status</TableHead>
                      <TableHead className="text-zinc-400 font-medium text-right">Invoice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id} className="border-zinc-800/50 hover:bg-zinc-800/30">
                        <TableCell className="text-zinc-300">
                          {new Date(tx.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="text-zinc-300 font-medium">
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
                            onClick={() => toast.info('Invoice download coming soon')}
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
                Are you sure you want to cancel your Pro subscription?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <p className="text-sm text-zinc-300">You will lose access to:</p>
              <div className="space-y-2">
                {['Unlimited ATS scans', 'Unlimited resume tailoring', 'AI mock interviews', 'All premium templates'].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-zinc-400">
                    <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-500 pt-2">
                Your access will continue until the end of your current billing period.
              </p>
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
    </div>
  )
}