// Location Detection Utility
// IP-based country/currency/language detection

export interface LocationData {
  country: string
  countryCode: string
  currency: 'INR' | 'USD' | 'EUR' | 'JPY' | 'KRW'
  language: 'en' | 'hi' | 'ja' | 'ko' | 'bn' | 'ta' | 'te' | 'vi' | 'id' | 'th' | 'fil'
  region: 'india' | 'southeast_asia' | 'east_asia' | 'global'
  timezone: string
}

// Country to region/currency/language mapping
const COUNTRY_MAP: Record<string, Omit<LocationData, 'country' | 'countryCode' | 'timezone'>> = {
  // South Asia
  IN: { currency: 'INR', language: 'hi', region: 'india' },
  BD: { currency: 'INR', language: 'bn', region: 'india' },
  PK: { currency: 'INR', language: 'en', region: 'india' },
  NP: { currency: 'INR', language: 'en', region: 'india' },
  LK: { currency: 'INR', language: 'en', region: 'india' },
  // Southeast Asia
  PH: { currency: 'USD', language: 'fil', region: 'southeast_asia' },
  ID: { currency: 'USD', language: 'id', region: 'southeast_asia' },
  VN: { currency: 'USD', language: 'vi', region: 'southeast_asia' },
  TH: { currency: 'USD', language: 'th', region: 'southeast_asia' },
  MY: { currency: 'USD', language: 'en', region: 'southeast_asia' },
  SG: { currency: 'USD', language: 'en', region: 'southeast_asia' },
  // East Asia
  JP: { currency: 'JPY', language: 'ja', region: 'east_asia' },
  KR: { currency: 'KRW', language: 'ko', region: 'east_asia' },
  TW: { currency: 'USD', language: 'en', region: 'east_asia' },
  HK: { currency: 'USD', language: 'en', region: 'east_asia' },
  // Default - global (USD)
  US: { currency: 'USD', language: 'en', region: 'global' },
  GB: { currency: 'USD', language: 'en', region: 'global' },
  AU: { currency: 'USD', language: 'en', region: 'global' },
  CA: { currency: 'USD', language: 'en', region: 'global' },
  DE: { currency: 'EUR', language: 'en', region: 'global' },
  FR: { currency: 'EUR', language: 'en', region: 'global' },
}

const TIMEZONE_MAP: Record<string, string> = {
  IN: 'Asia/Kolkata',
  BD: 'Asia/Dhaka',
  PK: 'Asia/Karachi',
  NP: 'Asia/Kathmandu',
  LK: 'Asia/Colombo',
  PH: 'Asia/Manila',
  ID: 'Asia/Jakarta',
  VN: 'Asia/Ho_Chi_Minh',
  TH: 'Asia/Bangkok',
  MY: 'Asia/Kuala_Lumpur',
  SG: 'Asia/Singapore',
  JP: 'Asia/Tokyo',
  KR: 'Asia/Seoul',
  TW: 'Asia/Taipei',
  HK: 'Asia/Hong_Kong',
  US: 'America/New_York',
  GB: 'Europe/London',
  AU: 'Australia/Sydney',
  CA: 'America/Toronto',
  DE: 'Europe/Berlin',
  FR: 'Europe/Paris',
}

// Cache for location data
let cachedLocation: LocationData | null = null

/**
 * Detect user location based on IP using ipapi.co
 */
export async function detectLocation(): Promise<LocationData> {
  // Return cached if available
  if (cachedLocation) return cachedLocation

  try {
    const res = await fetch('https://ipapi.co/json/', {
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error('Location detection failed')
    }

    const data = await res.json()
    const countryCode = data.country_code || 'IN'

    const mapped = COUNTRY_MAP[countryCode] || {
      currency: 'USD' as const,
      language: 'en' as const,
      region: 'global' as const,
    }

    cachedLocation = {
      country: data.country_name || 'India',
      countryCode,
      currency: mapped.currency,
      language: mapped.language,
      region: mapped.region,
      timezone: TIMEZONE_MAP[countryCode] || 'UTC',
    }

    return cachedLocation
  } catch (error) {
    // Default to India on error
    return {
      country: 'India',
      countryCode: 'IN',
      currency: 'INR',
      language: 'hi',
      region: 'india',
      timezone: 'Asia/Kolkata',
    }
  }
}

/**
 * Get location from request headers (set by middleware)
 */
export function getLocationFromHeaders(headers: Headers): LocationData | null {
  const country = headers.get('x-user-country')
  if (!country) return null

  const mapped = COUNTRY_MAP[country]
  if (!mapped) return null

  return {
    country,
    countryCode: country,
    currency: mapped.currency,
    language: mapped.language,
    region: mapped.region,
    timezone: TIMEZONE_MAP[country] || 'UTC',
  }
}

/**
 * Format currency based on location
 */
export function formatCurrency(amount: number, currency: LocationData['currency']): string {
  const formatters: Record<string, Intl.NumberFormat> = {
    INR: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }),
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
    EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
    JPY: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }),
    KRW: new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }),
  }

  return formatters[currency]?.format(amount) || `$${amount}`
}

/**
 * Get pricing for a plan based on location
 */
export function getLocalizedPrice(
  basePriceINR: number,
  currency: LocationData['currency']
): { price: number; currency: string; suffix: string } {
  const rates: Record<string, number> = {
    INR: 1,
    USD: 0.012, // ~83 INR per USD
    EUR: 0.011,
    JPY: 1.8,
    KRW: 16,
  }

  const rate = rates[currency] || rates.USD
  const converted = Math.round(basePriceINR * rate)

  const suffixes: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    JPY: '¥',
    KRW: '₩',
  }

  return {
    price: converted,
    currency,
    suffix: suffixes[currency] || '$',
  }
}

/**
 * Store location preference in localStorage
 */
export function saveLocationPreference(loc: LocationData): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('craftly_location', JSON.stringify({
    country: loc.countryCode,
    currency: loc.currency,
    language: loc.language,
    region: loc.region,
  }))
  // Also set cookie for SSR
  document.cookie = `craftly_location=${loc.countryCode}; max-age=${60 * 60 * 24 * 30}; path=/`
}

/**
 * Get stored location preference
 */
export function getStoredLocation(): LocationData | null {
  if (typeof window === 'undefined') return null

  const stored = localStorage.getItem('craftly_location')
  if (!stored) return null

  try {
    const data = JSON.parse(stored)
    return {
      country: data.country || 'Unknown',
      countryCode: data.country || 'XX',
      currency: data.currency || 'USD',
      language: data.language || 'en',
      region: data.region || 'global',
      timezone: 'UTC',
    }
  } catch {
    return null
  }
}
