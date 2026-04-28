import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

const SOUTH_ASIA = ['IN', 'BD', 'PK', 'NP', 'LK']
const SOUTHEAST_ASIA = ['PH', 'ID', 'VN', 'MY', 'TH', 'SG']
const EAST_ASIA = ['JP', 'KR', 'TW', 'HK']

const PROTECTED_ROUTES = [
  '/dashboard',
  '/build',
  '/analyze',
  '/tailor',
  '/vault',
  '/versions',
  '/export',
  '/billing',
  '/settings',
  '/interview',
  '/mock-interview',
  '/jobs',
  '/linkedin',
  '/career',
  '/income',
]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  // STEP A — Supabase session refresh (must be first)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // FIX: Use the actual Supabase user instead of manually sniffing cookies.
  // getUser() validates the session server-side — reliable after login AND logout.
  const { data: { user } } = await supabase.auth.getUser()
  const isAuthenticated = !!user

  // STEP B — Geo-detection
  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    'IN'

  let region = 'global'
  let currency = 'USD'
  let language = 'en'

  if (SOUTH_ASIA.includes(country)) {
    region = 'india'
    currency = 'INR'
  } else if (SOUTHEAST_ASIA.includes(country)) {
    region = 'southeast_asia'
    currency = 'USD'
  } else if (EAST_ASIA.includes(country)) {
    region = 'east_asia'
    currency = country === 'JP' ? 'JPY' : country === 'KR' ? 'KRW' : 'USD'
    language = country === 'JP' ? 'ja' : country === 'KR' ? 'ko' : 'en'
  }

  response.headers.set('x-user-country', country)
  response.headers.set('x-user-region', region)
  response.headers.set('x-user-currency', currency)
  response.headers.set('x-user-language', language)

  response.cookies.set('craftly_currency', currency, {
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
  })

  // STEP C — Auth redirect (uses real session, not cookie names)
  const { pathname } = request.nextUrl
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))

  // Not logged in → trying to access protected route → send to /auth
  if (isProtectedRoute && !isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Already logged in → trying to access /auth → send to /dashboard
  if (pathname === '/auth' && isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}