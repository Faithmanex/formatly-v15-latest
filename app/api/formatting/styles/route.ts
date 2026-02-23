import { type NextRequest, NextResponse } from "next/server"
import { rateLimit, getRateLimitIdentifier, RATE_LIMITS } from "@/lib/rate-limit"

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const FASTAPI_TIMEOUT = Number.parseInt(process.env.FASTAPI_TIMEOUT || "5000")

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
      return NextResponse.json(
        { error: "Failed to fetch formatting styles from the backend service." },
        { status: fastApiResponse.status }
      )
    }

    const result = await fastApiResponse.json()

    const response = NextResponse.json(result)
    response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400")
    return response
  } catch (error) {
    console.error("Styles endpoint error:", error)
    return NextResponse.json(
      { error: "Internal Server Error fetching formatting styles." },
      { status: 500 }
    )
  }
}
