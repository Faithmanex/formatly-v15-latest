interface RateLimitEntry {
  count: number
  resetAt: number
}

class InMemoryRateLimiter {
  private store: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key)
      }
    }
  }

  async limit(
    identifier: string,
    maxRequests: number,
    windowMs: number,
  ): Promise<{
    success: boolean
    limit: number
    remaining: number
    reset: number
  }> {
    const now = Date.now()
    const entry = this.store.get(identifier)

    if (!entry || entry.resetAt < now) {
      // Create new entry
      this.store.set(identifier, {
        count: 1,
        resetAt: now + windowMs,
      })
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - 1,
        reset: now + windowMs,
      }
    }

    if (entry.count >= maxRequests) {
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: entry.resetAt,
      }
    }

    entry.count++
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - entry.count,
      reset: entry.resetAt,
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store.clear()
  }
}

// Singleton instance
const rateLimiter = new InMemoryRateLimiter()

// Rate limit configurations
export const RATE_LIMITS = {
  // API endpoints
  API_DEFAULT: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
  API_UPLOAD: { maxRequests: 10, windowMs: 60000 }, // 10 uploads per minute
  API_DOWNLOAD: { maxRequests: 30, windowMs: 60000 }, // 30 downloads per minute

  // Auth endpoints
  AUTH_LOGIN: { maxRequests: 5, windowMs: 300000 }, // 5 attempts per 5 minutes
  AUTH_SIGNUP: { maxRequests: 3, windowMs: 3600000 }, // 3 signups per hour
  AUTH_PASSWORD_RESET: { maxRequests: 3, windowMs: 3600000 }, // 3 resets per hour
}

export async function rateLimit(
  identifier: string,
  config: { maxRequests: number; windowMs: number } = RATE_LIMITS.API_DEFAULT,
) {
  return rateLimiter.limit(identifier, config.maxRequests, config.windowMs)
}

// Helper to get identifier from request
export function getRateLimitIdentifier(request: Request, userId?: string): string {
  // Prefer user ID for authenticated requests
  if (userId) {
    return `user:${userId}`
  }

  // Fall back to IP address
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown"
  return `ip:${ip}`
}

// WARNING: This is an in-memory implementation suitable for development only.
// For production, use Upstash Redis rate limiting for distributed systems.
console.warn(
  "[Rate Limit] Using in-memory rate limiter. For production, integrate Upstash Redis for distributed rate limiting.",
)

export default rateLimiter
