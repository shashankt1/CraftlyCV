'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Zap, Crown, Star, Clock, Flame, Globe, Shield, RefreshCw, IndianRupee, DollarSign } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { toast } from 'sonner'

// ── Currency Toggle ────────────────────────────────────────────────────────────
type Currency = 'INR' | 'USD'

function CurrencyToggle({ currency, onChange }: { currency: Currency; onChange: (c: Currency) => void }) {
  return (
    <div className="inline-flex items-center gap-1 bg-white/10 border border-white/10 rounded-full p-1">
      <button
        onClick={() => onChange('INR')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${currency === 'INR' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'}`}
      >
        <IndianRupee className="h-3.5 w-3.5" /> INR
      </button>
      <button
        onClick={() => onChange('USD')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${currency === 'USD' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'}`}
      >
        <DollarSign className="h-3.5 w-3.5" /> USD
      </button>
    </div>
  )
}

// ── Background ─────────────────────────────────────────────────────────────────
function PageBg() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#060c1a]" />
      <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.09]"
        style={{ background: 'radial-gradient(circle, #1E6FD9 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, #FF6B35 0%, transparent 70%)' }} />
      <div className="absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
    </div>
  )
}

// ── Countdown Timer ────────────────────────────────────────────────────────────
function useCountdown(targetDate: Date) {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0, expired: false })
  useEffect(() => {
    const iv = setInterval(() => {
      const now = new Date()
      const diff = targetDate.getTime() - now.getTime()
      if (diff <= 0) { setTime({ h: 0, m: 0, s: 0, expired: true }); clearInterval(iv); return }
      const h = Math.floor(diff / (1000 * 60 * 60))
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const s = Math.floor((diff % (1000 * 60)) / 1000)
      setTime({ h, m, s, expired: false })
    }, 1000)
    return () => clearInterval(iv)
  }, [targetDate])
  return time
}

function pad(n: number) { return String(n).padStart(2, '0') }

// ── Pricing Data ───────────────────────────────────────────────────────────────
interface Plan {
  id: string
  name: string
  priceINR: number
  priceUSD: number
  period?: string
  scansLabel: string
  highlight: boolean
  badge?: string
  features: string[]
  cta: string
  color: string
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    priceINR: 0,
    priceUSD: 0,
    scansLabel: '10 scans to start',
    highlight: false,
    features: [
      'ATS Resume Analyzer',
      'Basic Resume Templates',
      'Career Roadmap',
      'Score Share Card',
      'Public profile page',
    ],
    cta: 'Get Started Free',
    color: 'slate',
  },
  {
    id: 'starter',
    name: 'Starter',
    priceINR: 49,
    priceUSD: 2,
    period: '/ day',
    scansLabel: '30 scans · 24hr access',
    highlight: false,
    badge: 'Quick Win',
    features: [
      'Everything in Free',
      'Tailor to Job (AI rewrite)',
      '5 Resume Templates',
      'PDF Download',
      'Email support',
    ],
    cta: 'Start Starter',
    color: 'blue',
  },
  {
    id: 'pro',
    name: 'Pro',
    priceINR: 149,
    priceUSD: 5,
    period: '/month',
    scansLabel: '200 scans per month',
    highlight: true,
    badge: 'Most Popular',
    features: [
      'Everything in Starter',
      'Unlimited Tailor to Job',
      'AI Mock Interview (LIVE)',
      'All 20+ Templates',
      'Priority Support',
      'No watermark on downloads',
    ],
    cta: 'Start Pro',
    color: 'blue',
  },
]

// Founding Member - limited time offer
const FOUNDING: Plan = {
  id: 'founding',
  name: 'Lifetime Pro',
  priceINR: 399,
  priceUSD: 10,
  period: ' one-time',
  scansLabel: 'All Pro features · Forever',
  highlight: false,
  badge: 'Best Value',
  features: [
    'Everything in Pro — forever',
    'Never pay monthly again',
    'All future features included',
    'Priority email support',
    'Founding member badge',
    'Early access to new features',
  ],
  cta: 'Claim Lifetime Deal',
  color: 'orange',
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [currency, setCurrency] = useState<Currency>('INR')
  const router = useRouter()
  const supabase = createClient()

  // Auto-detect currency from middleware headers
  useEffect(() => {
    const detectedCurrency = document.documentElement.getAttribute('data-currency') || 'INR'
    if (detectedCurrency === 'USD' || detectedCurrency === 'INR') {
      setCurrency(detectedCurrency)
    }
  }, [])

  // Founders deadline: 30 days from now
  const foundingDeadline = new Date()
  foundingDeadline.setDate(foundingDeadline.getDate() + 30)
  const countdown = useCountdown(foundingDeadline)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    if (!document.getElementById('razorpay-script')) {
      const script = document.createElement('script')
      script.id = 'razorpay-script'
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  const handlePurchase = async (planId: string) => {
    if (!user) { router.push('/auth?redirect=/pricing'); return }
    if (currency === 'USD') {
      toast.error('USD payments coming soon. Please select INR for now.')
      return
    }
    setLoading(planId)
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, userId: user.id }),
      })
      const order = await res.json()
      if (!order.success) throw new Error(order.message || order.error)

      const win = window as any
      if (!win.Razorpay) { toast.error('Payment gateway not loaded. Please refresh.'); setLoading(null); return }
      const rzp = new win.Razorpay({
        key: order.data.razorpayKey,
        amount: order.data.amount,
        currency: order.data.currency || 'INR',
        order_id: order.data.orderId,
        name: 'CraftlyCV',
        description: `${planId.replace(/_/g, ' ')} Plan`,
        handler: async (response: any) => {
          const verify = await fetch('/api/payments/verify', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, userId: user.id, planId }),
          })
          const verifyData = await verify.json()
          if (verifyData.success) { toast.success('Payment successful!'); router.push('/dashboard') }
          else toast.error(verifyData.message || 'Verification failed')
        },
        prefill: { email: user.email },
        theme: { color: '#1E6FD9' },
      })
      rzp.open()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Payment failed')
    } finally { setLoading(null) }
  }

  const handleFormatPrice = (plan: Plan) => {
    const price = currency === 'INR' ? plan.priceINR : plan.priceUSD
    return currency === 'INR' ? `₹${price}` : `$${price}`
  }

  const getPlanId = (plan: Plan) => plan.id

  return (
    <div className="min-h-screen relative text-white">
      <PageBg />
      <div className="relative z-10">

        {/* Nav */}
        <nav className="border-b border-white/6 bg-[#060c1a]/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Logo href="/" size="sm" />
            <div className="flex items-center gap-3">
              <CurrencyToggle currency={currency} onChange={setCurrency} />
              <ThemeToggle />
              {user
                ? <Link href="/dashboard" className="px-4 py-2 rounded-xl bg-white/8 border border-white/10 text-white/70 hover:text-white text-sm font-medium transition-all">Dashboard</Link>
                : <Link href="/auth" className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all">Get Started Free</Link>
              }
            </div>
          </div>
        </nav>

        {/* Header */}
        <section className="pt-16 pb-8 px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Zap className="h-4 w-4" />
            {currency === 'INR' ? 'India pricing' : 'Global pricing'} · Launch offer
          </div>
          <h1 className="text-5xl font-black mb-4">
            The last resume tool<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400">you'll ever need.</span>
          </h1>
          <p className="text-white/40 text-lg max-w-lg mx-auto">
            Get hired or start earning. One subscription. Every tool you need to land interviews and income.
          </p>
        </section>

        {/* Pricing Cards */}
        <section className="pb-16 px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-5">

            {/* FREE */}
            <div className={`rounded-2xl p-6 border border-white/8 bg-white/3 flex flex-col ${PLANS[0].highlight ? 'lg:col-span-1' : ''}`}>
              <div className="mb-5">
                <p className="text-white/50 text-sm font-semibold mb-1">{PLANS[0].name}</p>
                <div className="text-4xl font-black text-white">{handleFormatPrice(PLANS[0])}</div>
                <p className="text-blue-400 text-sm font-bold mt-1">{PLANS[0].scansLabel}</p>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {PLANS[0].features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/65">
                    <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/auth"
                className="block text-center py-3 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 text-white font-bold text-sm transition-all">
                {PLANS[0].cta}
              </Link>
            </div>

            {/* STARTER */}
            <div className="rounded-2xl p-6 border border-white/8 bg-white/3 flex flex-col">
              {PLANS[1].badge && (
                <div className="inline-flex items-center gap-1 text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full mb-3 w-fit">
                  <Zap className="h-3 w-3" />{PLANS[1].badge}
                </div>
              )}
              <div className="mb-5">
                <p className="text-white/50 text-sm font-semibold mb-1">{PLANS[1].name}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-black text-white">{handleFormatPrice(PLANS[1])}</span>
                  {PLANS[1].period && <span className="text-white/40 text-sm">{PLANS[1].period}</span>}
                </div>
                <p className="text-blue-400 text-sm font-bold mt-1">{PLANS[1].scansLabel}</p>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {PLANS[1].features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/65">
                    <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handlePurchase(getPlanId(PLANS[1]))}
                disabled={loading === PLANS[1].id}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading === PLANS[1].id ? 'Processing...' : <><Zap className="h-4 w-4" />{PLANS[1].cta}</>}
              </button>
            </div>

            {/* PRO */}
            <div className="rounded-2xl border border-blue-500/40 bg-blue-600/8 flex flex-col relative overflow-hidden">
              {PLANS[2].badge && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
              )}
              <div className="absolute top-3 right-3">
                <span className="text-xs font-black bg-blue-600 text-white px-3 py-1 rounded-full">{PLANS[2].badge}</span>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="mb-5">
                  <p className="text-white/50 text-sm font-semibold mb-1">{PLANS[2].name}</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-black text-white">{handleFormatPrice(PLANS[2])}</span>
                    {PLANS[2].period && <span className="text-white/40 text-sm">{PLANS[2].period}</span>}
                  </div>
                  <p className="text-blue-400 text-sm font-bold mt-1">{PLANS[2].scansLabel}</p>
                </div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {PLANS[2].features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/75">
                      <CheckCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePurchase(getPlanId(PLANS[2]))}
                  disabled={loading === PLANS[2].id}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm transition-all shadow-xl shadow-blue-500/20 hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading === PLANS[2].id ? 'Processing...' : <><Zap className="h-4 w-4" />{PLANS[2].cta}</>}
                </button>
              </div>
            </div>

            {/* LIFETIME PRO */}
            {!countdown.expired && (
              <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-b from-orange-500/8 to-orange-600/4 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent" />
                {FOUNDING.badge && (
                  <div className="absolute top-3 right-3">
                    <span className="text-xs font-black bg-orange-500 text-white px-3 py-1 rounded-full">{FOUNDING.badge}</span>
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                  <div className="mb-4">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold bg-orange-500/15 text-orange-400 border border-orange-500/25 px-2.5 py-1 rounded-full mb-3 w-fit">
                      <Flame className="h-3.5 w-3.5" />Limited spots
                    </div>
                    <p className="text-white/50 text-sm font-semibold mb-1">{FOUNDING.name}</p>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-4xl font-black text-white">{handleFormatPrice(FOUNDING)}</span>
                      {FOUNDING.period && <span className="text-white/40 text-sm">{FOUNDING.period}</span>}
                    </div>
                    <p className="text-orange-400 text-sm font-black mt-1">{FOUNDING.scansLabel}</p>
                  </div>

                  {/* Countdown */}
                  {!countdown.expired && (
                    <div className="bg-orange-500/8 border border-orange-500/15 rounded-xl p-2.5 mb-4 text-center">
                      <p className="text-xs text-orange-400/70 mb-1">Offer ends in</p>
                      <p className="text-xl font-black text-orange-300 tabular-nums">
                        {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
                      </p>
                    </div>
                  )}

                  <ul className="space-y-2.5 mb-4 flex-1">
                    {FOUNDING.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/75">
                        <CheckCircle className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />{f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePurchase(FOUNDING.id)}
                    disabled={loading === FOUNDING.id}
                    className="w-full py-3.5 rounded-xl font-black text-sm transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2 text-white"
                    style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)', boxShadow: '0 4px 20px rgba(234,88,12,0.25)' }}>
                    {loading === FOUNDING.id ? 'Processing...' : <><Crown className="h-4 w-4" />{FOUNDING.cta}</>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Social proof strip */}
          <div className="max-w-5xl mx-auto mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/30">
            <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-400" />No hidden fees</span>
            <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-emerald-400" />7-day refund guarantee</span>
            <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-emerald-400" />Secure payment via Razorpay</span>
            <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-400" />Instant access after payment</span>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="py-16 px-4 border-t border-white/6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-black text-center mb-12">Why CraftlyCV?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: '🎯',
                  title: 'Not just a resume builder',
                  desc: 'We analyze, score, and fix your resume using real ATS logic — not guesswork.'
                },
                {
                  icon: '🤖',
                  title: 'AI Interview Simulator',
                  desc: 'Practice with a live AI that asks real questions and gives STAR method feedback.'
                },
                {
                  icon: '💰',
                  title: 'Income if jobs fail',
                  desc: 'If interviews don\'t convert, we show you freelance gigs and side income options.'
                },
              ].map((item, i) => (
                <div key={i} className="rounded-xl p-5 bg-white/3 border border-white/6 text-center">
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <p className="font-bold text-white mb-2">{item.title}</p>
                  <p className="text-white/50 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4 border-t border-white/6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-center mb-10">Common questions</h2>
            <div className="space-y-4">
              {[
                { q: 'What happens after my 10 free scans?', a: "You can still use the basic Resume Builder. To run more ATS analyses, tailor to jobs, or practice interviews, you'll need to upgrade." },
                { q: "What's the difference between Pro and Lifetime?", a: "Pro is ₹149/month — cancel anytime. Lifetime is ₹399 one-time — gives you Pro access forever with no subscriptions." },
                { q: 'Is there a refund policy?', a: 'Yes. If CraftlyCV does not work for you within 7 days, email us and we will refund you. No questions asked.' },
                { q: 'Can I switch plans?', a: 'Yes. Upgrade or downgrade anytime. Lifetime purchasers never need to pay again.' },
              ].map((item, i) => (
                <div key={i} className="rounded-2xl p-6 border border-white/8 bg-white/3">
                  <p className="font-bold text-white mb-2">{item.q}</p>
                  <p className="text-white/50 text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 text-center">
          <h2 className="text-4xl font-black mb-4">One job offer. That's all it takes.</h2>
          <p className="text-white/40 mb-8 max-w-md mx-auto">
            The average salary bump from a job switch in India is ₹3–6L. CraftlyCV costs less than a week's coffee.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => handlePurchase(FOUNDING.id)}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-black text-lg transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)', boxShadow: '0 8px 32px rgba(234,88,12,0.25)' }}>
              <Crown className="h-5 w-5" />Claim ₹399 Lifetime Deal
            </button>
            <Link href="/auth"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/8 border border-white/10 text-white font-bold text-lg transition-all hover:bg-white/12">
              Start Free First →
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/6 py-8 px-4 text-center">
          <p className="text-white/20 text-sm">© {new Date().getFullYear()} CraftlyCV · Built for job seekers worldwide</p>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-white/20">
            <Link href="/privacy" className="hover:text-white/40 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white/40 transition-colors">Terms</Link>
            <Link href="/refund" className="hover:text-white/40 transition-colors">Refund Policy</Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
