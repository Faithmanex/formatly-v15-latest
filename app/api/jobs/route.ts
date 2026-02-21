import { type NextRequest, NextResponse } from "next/server"
import { rateLimit, getRateLimitIdentifier, RATE_LIMITS } from "@/lib/rate-limit"
import { createSupabaseServerClient } from "@/lib/supabase-server"

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const FASTAPI_TIMEOUT = Number.parseInt(process.env.FASTAPI_TIMEOUT || "30000")

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const rateLimitId = getRateLimitIdentifier(request)
    const rateLimitResult = await rateLimit(rateLimitId, RATE_LIMITS.API_DEFAULT)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many requests. Please try again later.",
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

    console.log("[v0] Listing jobs for user:", user.id)

    const {
      data: { session },
    } = await supabase.auth.getSession()
    const authHeader = session?.access_token ? `Bearer ${session.access_token}` : ""

    const fastApiResponse = await fetch(`${FASTAPI_BASE_URL}/api/jobs`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      signal: AbortSignal.timeout(FASTAPI_TIMEOUT),
    })

    if (!fastApiResponse.ok) {
      console.error("[v0] FastAPI list jobs failed:", fastApiResponse.status, fastApiResponse.statusText)
      return NextResponse.json(
        { success: false, error: `Jobs service unavailable: ${fastApiResponse.statusText}` },
        { status: fastApiResponse.status },
      )
    }

    const result = await fastApiResponse.json()
    console.log("[v0] FastAPI list jobs successful")

    const response = NextResponse.json(result)
    response.headers.set("Cache-Control", "no-store, must-revalidate")

    return response
  } catch (error) {
    console.error("[v0] Jobs endpoint error:", error)

    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json({ success: false, error: "Jobs service timeout" }, { status: 504 })
    }

    return NextResponse.json({ success: false, error: "Jobs service unavailable" }, { status: 503 })
  }
}
