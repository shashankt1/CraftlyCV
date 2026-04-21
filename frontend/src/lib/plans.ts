// CraftlyCV Plans Configuration
// Career Operating System - Pricing Plans

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic resume analysis',
    monthlyPrice: 0,
    yearlyPrice: 0,
    scansPerMonth: 10,
    features: [
      '10 free scans on signup',
      'ATS Resume Analyzer',
      '3 resume templates',
      'Public profile page',
      'Basic support',
    ],
    limitations: [
      'No Tailor to Job feature',
      'No Interview Prep',
      'No LinkedIn Optimizer',
    ],
    color: 'slate',
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'For active job seekers who need quick fixes',
    monthlyPrice: 49,
    yearlyPrice: 499,
    dailyPrice: 49,
    scansPerMonth: 30,
    features: [
      '30 scans',
      'ATS Resume Analyzer',
      'Tailor to Job (1/day)',
      '5 resume templates',
      'PDF Download',
      'Email support',
    ],
    limitations: [
      'No Mock Interview',
      'No LinkedIn Optimizer',
    ],
    color: 'blue',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Full power for serious job hunters',
    monthlyPrice: 149,
    yearlyPrice: 1499,
    scansPerMonth: 200,
    popular: true,
    features: [
      '200 scans per month',
      'ATS Resume Analyzer',
      'Tailor to Job (unlimited)',
      'AI Mock Interview (LIVE)',
      'LinkedIn Optimizer',
      '20 resume templates',
      'Priority support',
      'No watermark on downloads',
    ],
    limitations: [],
    color: 'blue',
  },
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime Pro',
    description: 'One-time payment, Pro forever',
    monthlyPrice: 0,
    yearlyPrice: 0,
    oneTimePrice: 399,
    scansPerMonth: 200,
    features: [
      'All Pro features — forever',
      'Never pay monthly again',
      'All future features included',
      'Priority email support',
      'Founding member badge',
      'Early access to new features',
    ],
    limitations: [],
    color: 'orange',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For teams and recruiters',
    monthlyPrice: 3599,
    yearlyPrice: 35990,
    scansPerMonth: -1, // unlimited
    features: [
      'Unlimited scans',
      'All Pro features',
      'Team seats (up to 10)',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
      'API access',
    ],
    limitations: [],
    color: 'purple',
  },
} as const

export type PlanId = keyof typeof PLANS

// Global pricing (USD) - for non-INR countries
export const GLOBAL_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    scansPerMonth: 10,
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 2,
    scansPerMonth: 30,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 5,
    scansPerMonth: 200,
    popular: true,
  },
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime Pro',
    oneTimePrice: 10,
    scansPerMonth: 200,
  },
} as const

// Scan costs for different actions
export const SCAN_COSTS = {
  ats_analysis: 1,
  tailor_to_job: 3,
  interview_prep: 5,
  mock_interview: 5,
  linkedin_optimizer: 2,
  career_suggester: 2,
  resume_builder: 0, // free
} as const

export type ScanAction = keyof typeof SCAN_COSTS

// Plan limits
export const PLAN_LIMITS = {
  free: {
    maxScansPerAction: 1,
    canUseTailor: false,
    canUseMockInterview: false,
    canUseLinkedin: false,
    canDownloadPDF: false,
    watermarkOnResume: true,
  },
  starter: {
    maxScansPerAction: 1,
    canUseTailor: true,
    canUseMockInterview: false,
    canUseLinkedin: false,
    canDownloadPDF: true,
    watermarkOnResume: false,
  },
  pro: {
    maxScansPerAction: -1, // unlimited
    canUseTailor: true,
    canUseMockInterview: true,
    canUseLinkedin: true,
    canDownloadPDF: true,
    watermarkOnResume: false,
  },
  lifetime: {
    maxScansPerAction: -1,
    canUseTailor: true,
    canUseMockInterview: true,
    canUseLinkedin: true,
    canDownloadPDF: true,
    watermarkOnResume: false,
  },
  enterprise: {
    maxScansPerAction: -1,
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
  JPY: '¥',
  KRW: '₩',
  BDT: '৳',
  PKR: '₨',
} as const

// Helper functions
export function getPlan(planId: PlanId) {
  return PLANS[planId]
}

export function getGlobalPlan(planId: keyof typeof GLOBAL_PLANS) {
  return GLOBAL_PLANS[planId]
}

export function getScanCost(action: ScanAction): number {
  return SCAN_COSTS[action]
}

export function canUseFeature(planId: PlanId, feature: keyof typeof PLAN_LIMITS['free']): boolean {
  const limits = PLAN_LIMITS[planId]
  const value = limits[feature]
  if (typeof value === 'boolean') return value
  return value !== 0
}

export function formatPrice(amount: number, currency: string = 'INR'): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency
  if (currency === 'JPY' || currency === 'KRW') {
    return `${symbol}${amount.toLocaleString()}`
  }
  return `${symbol}${amount.toLocaleString()}`
}
