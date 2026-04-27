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

export const isPro = (profile: { plan: string }) =>
  ['pro', 'lifetime'].includes(profile.plan)

export type PlanId = 'free' | 'starter' | 'pro' | 'lifetime'

export interface PlanConfig {
  id: PlanId
  name: string
  price: number
  priceLabel: string
  badge?: string
  features: string[]
}

export const PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: 'Free',
    features: ['3 lifetime scans', 'Basic ATS analysis', 'Watermarked exports'],
  },
  {
    id: 'starter',
    name: 'Starter Pack',
    price: 199,
    priceLabel: '₹199 one-time',
    badge: 'One-time',
    features: ['10 scan credits', 'Tailored exports', 'ATS-safe PDF', 'No watermark'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 499,
    priceLabel: '₹499/month',
    badge: 'Popular',
    features: ['Unlimited scans', 'Unlimited tailoring', 'All modules', 'No watermark', 'Language support'],
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: 2999,
    priceLabel: '₹2999 one-time',
    badge: 'Founding Member',
    features: ['Everything in Pro', 'Forever access', 'Founding Member badge'],
  },
]
