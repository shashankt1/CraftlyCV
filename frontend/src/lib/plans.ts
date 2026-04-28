// Plan permission checks for CraftlyCV

export const canAnalyze = (profile: { plan: string; scans: number }) =>
  profile.plan !== 'free' || profile.scans > 0

export const canTailor = (profile: { plan: string; scans: number }) =>
  ['pro', 'lifetime', 'starter'].includes(profile.plan) || profile.scans > 1

export const canExportClean = (profile: { plan: string }) =>
  profile.plan !== 'free'

export const canUseMockInterview = (profile: { plan: string }) =>
  ['pro', 'lifetime'].includes(profile.plan)

export const canUseLinkedIn = (profile: { plan: string }) =>
  ['pro', 'lifetime'].includes(profile.plan)

export const canUseCareerHub = (profile: { plan: string }) =>
  ['pro', 'lifetime'].includes(profile.plan)

export const hasWatermark = (profile: { plan: string }) =>
  profile.plan === 'free'

export const isPro = (profile: { plan: string } | null | undefined) =>
  profile !== null && ['pro', 'lifetime'].includes(profile?.plan ?? '')

export type PlanId = 'free' | 'starter' | 'pro' | 'lifetime'

export interface PlanConfig {
  id: PlanId
  name: string
  price: number
  priceLabel: string
  badge?: string
  popular?: boolean
  description: string
  features: string[]
}

// Typed as Record so PLANS['free'] works in onboarding page
export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: 'Free',
    description: 'Diagnose your resume for free',
    features: ['3 lifetime scans', 'Basic ATS analysis', 'Watermarked exports'],
  },
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    price: 199,
    priceLabel: '₹199 one-time',
    badge: 'One-time',
    description: 'For active job seekers',
    features: ['10 scan credits', 'Tailored exports', 'ATS-safe PDF', 'No watermark'],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 499,
    priceLabel: '₹499/month',
    badge: 'Popular',
    popular: true,
    description: 'For serious career movers',
    features: ['Unlimited scans', 'Unlimited tailoring', 'All modules', 'No watermark', 'Language support'],
  },
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime',
    price: 2999,
    priceLabel: '₹2999 one-time',
    badge: 'Founding Member',
    description: 'Pay once. Use forever.',
    features: ['Everything in Pro', 'Forever access', 'Founding Member badge'],
  },
}

// Helper to get ordered array when you need to iterate
export const PLANS_LIST: PlanConfig[] = Object.values(PLANS)