export const CacheHeaders = {
  // No caching - for dynamic, user-specific data
  noCache: {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  },

  // Short cache - for frequently changing data (5 minutes)
  shortCache: {
    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
  },

  // Medium cache - for semi-static data (1 hour)
  mediumCache: {
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
  },

  // Long cache - for static data (24 hours)
  longCache: {
    "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800",
  },

  // Immutable - for versioned static assets
  immutable: {
    "Cache-Control": "public, max-age=31536000, immutable",
  },
} as const

export function applyCacheHeaders(response: Response, cacheType: keyof typeof CacheHeaders): Response {
  const headers = CacheHeaders[cacheType]
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

export function getCacheHeaders(cacheType: keyof typeof CacheHeaders): Record<string, string> {
  return { ...CacheHeaders[cacheType] }
}
