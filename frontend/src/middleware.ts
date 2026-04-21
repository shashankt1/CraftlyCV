import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Country to region mapping
const SOUTH_ASIA = ['IN', 'BD', 'PK', 'NP', 'LK']
const SOUTHEAST_ASIA = ['PH', 'ID', 'VN', 'MY', 'TH', 'SG']
const EAST_ASIA = ['JP', 'KR', 'TW', 'HK']

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Get country from headers (set by Vercel/hosting) or IP
  const country = request.geo?.country ||
                  request.headers.get('x-vercel-ip-country') ||
                  request.headers.get('cf-ipcountry') ||
                  'IN'

  // Determine region
  let region = 'global'
  let currency = 'USD'
  let language = 'en'

  if (SOUTH_ASIA.includes(country)) {
    region = 'india'
    currency = 'INR'
    language = 'en'
  } else if (SOUTHEAST_ASIA.includes(country)) {
    region = 'southeast_asia'
    currency = 'USD'
    language = 'en'
  } else if (EAST_ASIA.includes(country)) {
    region = 'east_asia'
    currency = country === 'JP' ? 'JPY' : country === 'KR' ? 'KRW' : 'USD'
    language = country === 'JP' ? 'ja' : country === 'KR' ? 'ko' : 'en'
  }

  // Set custom headers for downstream use
  response.headers.set('x-user-country', country)
  response.headers.set('x-user-region', region)
  response.headers.set('x-user-currency', currency)
  response.headers.set('x-user-language', language)

  // Handle authentication redirects
  const { pathname } = request.nextUrl

  // Protected routes that require auth
  const protectedRoutes = ['/dashboard', '/build', '/analyze', '/tailor', '/interview', '/mock-interview', '/jobs', '/income', '/pricing', '/linkedin', '/career']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Check for Supabase auth cookie
  const supabaseAuthCookie = request.cookies.get('sb-access-token') ||
                             request.cookies.get('supabase-auth-token') ||
                             request.cookies.getAll().find(c => c.name.includes('auth-token'))

  // If accessing protected route without auth, redirect to auth
  if (isProtectedRoute && !supabaseAuthCookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (they handle their own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}
