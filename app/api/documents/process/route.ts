import { type NextRequest, NextResponse } from "next/server"
import { validateInput, documentProcessSchema, type DocumentProcessData } from "@/lib/validation"
import { rateLimit, getRateLimitIdentifier, RATE_LIMITS } from "@/lib/rate-limit"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { checkUsageLimits } from "@/lib/billing"

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL
const FASTAPI_TIMEOUT = Number.parseInt(process.env.FASTAPI_TIMEOUT!)

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const limitsData = await checkUsageLimits(user.id)
    if (limitsData.documentsAtLimit) {
      return NextResponse.json(
        {
          success: false,
          error: "Document quota reached",
          reason: `You have reached your ${limitsData.currentUsage?.plan_name || "plan"} limit of ${limitsData.currentUsage?.document_limit} documents`,
        },
        { status: 429 },
      )
    }

    const rateLimitId = getRateLimitIdentifier(request)
    const rateLimitResult = await rateLimit(rateLimitId, RATE_LIMITS.API_DEFAULT)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
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

    const body = await request.json()
    if (body.style) body.style = body.style.toLowerCase()

    const validation = validateInput(documentProcessSchema, body)

    if (!validation.success) {
      return NextResponse.json({ success: false, error: "Invalid input", details: validation.error }, { status: 400 })
    }

    const validatedData = validation.data as DocumentProcessData

    const {
      data: { session },
    } = await supabase.auth.getSession()
    const authHeader = session?.access_token ? `Bearer ${session.access_token}` : ""

    const fastApiResponse = await fetch(`${FASTAPI_BASE_URL}/api/documents/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        ...validatedData,
        user_id: user.id,
      }),
      signal: AbortSignal.timeout(FASTAPI_TIMEOUT),
    })

    if (!fastApiResponse.ok) {
      console.error("[v0] FastAPI processing failed:", fastApiResponse.status, fastApiResponse.statusText)
      return NextResponse.json(
        { success: false, error: `Processing service unavailable: ${fastApiResponse.statusText}` },
        { status: fastApiResponse.status },
      )
    }

    const result = await fastApiResponse.json()

    const response = NextResponse.json(result)
    response.headers.set("Cache-Control", "no-store, must-revalidate")

    return response
  } catch (error) {
    console.error("Processing endpoint error:", error)

    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json({ success: false, error: "Processing service timeout" }, { status: 504 })
    }

    return NextResponse.json({ success: false, error: "Processing service unavailable" }, { status: 503 })
  }
}
