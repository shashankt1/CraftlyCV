// CraftlyCV Plans Configuration
// One-time pricing aligned with database schema

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic resume analysis',
    price: 0,
    scansIncluded: 10,
    features: [
      '10 free scans on signup',
      'Basic match scoring',
      '1 tailored version (watermarked)',
    ],
    limitations: [
      'Limited PDF exports',
      'No premium visual mode',
      'No cover letters',
    ],
    color: 'slate',
  },
  career_launch: {
    id: 'career_launch',
    name: 'Career Launch',
    description: 'Everything you need for your job search',
    price: 49,
    scansIncluded: -1, // unlimited with plan
    popular: true,
    features: [
      '5 tailored versions',
      'Full ATS scan',
      'Match score + improvements',
      'PDF export (ATS-safe)',
      'Cover letter generator (1)',
      'Short answer helper (3 uses)',
      '30-day access',
    ],
    limitations: [],
    color: 'blue',
  },
  niche_pro: {
    id: 'niche_pro',
    name: 'Niche Pro Pack',
    description: 'Full power for specialized professionals',
    price: 79,
    scansIncluded: -1,
    features: [
      'Everything in Career Launch',
      'Unlimited tailored versions (12 months)',
      'Premium Visual Export Pack',
      'Full Cover Letter Generator',
      'Short Answer Helper (unlimited)',
      'Application Tracker',
      'All Niche Packs unlocked',
      'Priority AI processing',
      '12-month access',
    ],
    limitations: [],
    color: 'purple',
  },
  concierge: {
    id: 'concierge',
    name: 'Concierge Rewrite',
    description: 'Human-AI hybrid resume rewrite',
    price: 149,
    scansIncluded: -1,
    features: [
      'Premium ghost-write',
      '1:1 intake call (30 min)',
      '3 tailored versions',
      '60-day revisions',
      'Priority support',
    ],
    limitations: [],
    color: 'amber',
  },
} as const

export type PlanId = keyof typeof PLANS

// Scan costs for different actions
export const SCAN_COSTS = {
  ats_analysis: 1,
  tailor_to_job: 1,
  interview_prep: 2,
  mock_interview: 2,
  linkedin_optimizer: 1,
  resume_builder: 0,
} as const

export type ScanAction = keyof typeof SCAN_COSTS

// Plan limits
export const PLAN_LIMITS = {
  free: {
    maxVersions: 1,
    canUseTailor: true,
    canUseMockInterview: false,
    canUseLinkedin: false,
    canDownloadPDF: false,
    watermarkOnResume: true,
  },
  career_launch: {
    maxVersions: 5,
    canUseTailor: true,
    canUseMockInterview: false,
    canUseLinkedin: false,
    canDownloadPDF: true,
    watermarkOnResume: false,
  },
  niche_pro: {
    maxVersions: -1, // unlimited
    canUseTailor: true,
    canUseMockInterview: true,
    canUseLinkedin: true,
    canDownloadPDF: true,
    watermarkOnResume: false,
  },
  concierge: {
    maxVersions: 3,
    canUseTailor: true,
    canUseMockInterview: true,
    canUseLinkedin: true,
    canDownloadPDF: true,
    watermarkOnResume: false,
  },
} as const

// Payment providers
export const PAYMENT_PROVIDERS = {
  india: 'razorpay',
  global: 'stripe',
} as const

// Currency symbols
export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
} as const

// Helper functions
export function getPlan(planId: PlanId) {
  return PLANS[planId]
}

export function getScanCost(action: ScanAction): number {
  return SCAN_COSTS[action]
}

export function canUseFeature(planId: PlanId, feature: keyof typeof PLAN_LIMITS['free']): boolean {
  const limits = PLAN_LIMITS[planId]
  const value = limits[feature]
  if (typeof value === 'boolean') return value
  return value !== -1
}

export function formatPrice(amount: number, currency: string = 'USD'): string {
  const symbol = currency === 'USD' ? '$' : currency === 'INR' ? '₹' : currency
  return `${symbol}${amount}`
}
