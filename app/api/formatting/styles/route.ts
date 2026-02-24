import { type NextRequest, NextResponse } from "next/server"
import { rateLimit, getRateLimitIdentifier, RATE_LIMITS } from "@/lib/rate-limit"

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL
const FASTAPI_TIMEOUT = Number.parseInt(process.env.FASTAPI_TIMEOUT!)

const defaultStyles = [
  { id: "apa", name: "APA Style", description: "American Psychological Association" },
  { id: "mla", name: "MLA Style", description: "Modern Language Association" },
  { id: "chicago", name: "Chicago Style", description: "Chicago Manual of Style" },
  { id: "ieee", name: "IEEE Style", description: "Institute of Electrical and Electronics Engineers" },
]

export async function GET(request: NextRequest) {
  const rateLimitId = getRateLimitIdentifier(request)
  const rateLimitResult = await rateLimit(rateLimitId, RATE_LIMITS.API_DEFAULT)

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.reset.toString(),
        },
      },
    )
  }

  if (process.env.NODE_ENV === "production" && !process.env.FASTAPI_BASE_URL) {
    const response = NextResponse.json(defaultStyles)
    response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400")
    return response
  }

  try {

    const fastApiResponse = await fetch(`${FASTAPI_BASE_URL}/api/formatting/styles`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(FASTAPI_TIMEOUT),
    })

    if (!fastApiResponse.ok) {
      console.error("FastAPI styles fetch failed:", fastApiResponse.status, fastApiResponse.statusText)
      const response = NextResponse.json(defaultStyles)
      response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400")
      return response
    }

    const result = await fastApiResponse.json()

    const response = NextResponse.json(result)
    response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400")
    return response
  } catch (error) {
    console.error("Styles endpoint error:", error)
    const response = NextResponse.json(defaultStyles)
    response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400")
    return response
  }
}
