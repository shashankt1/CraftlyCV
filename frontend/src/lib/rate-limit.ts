import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Rate limiting middleware for API routes
 * Uses Supabase RPC to check and increment rate limits atomically
 *
 * @param userId - The user's UUID
 * @param endpoint - The API endpoint name for rate limiting
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowSeconds - Time window in seconds
 * @returns Response with rate limit headers if exceeded, or null if allowed
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string,
  maxRequests: number = 10,
  windowSeconds: number = 60
): Promise<{ success: boolean; remaining: number; retryAfter?: number } | null> {
  try {
    const supabase = await createAdminClient()

    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_user_id: userId,
      p_endpoint: endpoint,
      p_max_requests: maxRequests,
      p_window_seconds: windowSeconds,
    })

    if (error) {
      console.error('Rate limit RPC error:', error)
      // Fail open - allow the request if rate limiting fails
      return { success: true, remaining: maxRequests }
    }

    const result = typeof data === 'string' ? JSON.parse(data) : data

    if (!result.allowed) {
      return {
        success: false,
        remaining: 0,
        retryAfter: result.retry_after || windowSeconds,
      }
    }

    return {
      success: true,
      remaining: result.remaining ?? maxRequests - 1,
    }
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // Fail open
    return { success: true, remaining: maxRequests }
  }
}

/**
 * Creates rate limit headers for responses
 */
export function rateLimitHeaders(remaining: number, limit: number) {
  return {
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Limit': String(limit),
  }
}

/**
 * Error response for rate limit exceeded
 */
export function rateLimitExceededResponse(retryAfter: number) {
  return new NextResponse(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Remaining': '0',
      },
    }
  )
}
