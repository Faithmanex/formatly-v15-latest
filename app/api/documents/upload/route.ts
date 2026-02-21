import { type NextRequest, NextResponse } from "next/server"
import { validateInput, fileUploadSchema, type FileUploadData } from "@/lib/validation"
import { rateLimit, getRateLimitIdentifier, RATE_LIMITS } from "@/lib/rate-limit"
import { createSupabaseServerClient } from "@/lib/supabase-server"

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const FASTAPI_TIMEOUT = Number.parseInt(process.env.FASTAPI_TIMEOUT || "30000")

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

    const rateLimitId = getRateLimitIdentifier(request)
    const rateLimitResult = await rateLimit(rateLimitId, RATE_LIMITS.API_UPLOAD)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many upload requests. Please try again later.",
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
            "Retry-After": Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          },
        },
      )
    }

    const formData = await request.formData()
    const filename = formData.get("filename") as string
    const fileSize = formData.get("file_size") as string
    const style = (formData.get("style") as string || "APA").toLowerCase()
    const englishVariant = formData.get("englishVariant") as string
    const reportOnly = formData.get("reportOnly") as string
    const includeComments = formData.get("includeComments") as string
    const preserveFormatting = formData.get("preserveFormatting") as string

    const validation = validateInput(fileUploadSchema, {
      filename,
      file_size: Number.parseInt(fileSize || "0"),
      style: style || "APA",
      englishVariant: englishVariant || "us",
      reportOnly: reportOnly === "true",
      includeComments: includeComments !== "false",
      preserveFormatting: preserveFormatting !== "false",
      trackedChanges: formData.get("trackedChanges") === "true",
    })

    if (!validation.success) {
      return NextResponse.json({ success: false, error: "Invalid input", details: validation.error }, { status: 400 })
    }

    const validatedData = validation.data as FileUploadData

    const fastApiFormData = new FormData()
    fastApiFormData.append("filename", validatedData.filename)
    fastApiFormData.append("style", validatedData.style)
    fastApiFormData.append("englishVariant", validatedData.englishVariant)
    fastApiFormData.append("reportOnly", validatedData.reportOnly.toString())
    fastApiFormData.append("includeComments", validatedData.includeComments.toString())
    fastApiFormData.append("preserveFormatting", validatedData.preserveFormatting.toString())
    fastApiFormData.append("trackedChanges", (validatedData.trackedChanges || false).toString())
    fastApiFormData.append("user_id", user.id)

    const {
      data: { session },
    } = await supabase.auth.getSession()
    const authHeader = session?.access_token ? `Bearer ${session.access_token}` : ""

    const fastApiResponse = await fetch(`${FASTAPI_BASE_URL}/api/documents/upload`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
      },
      body: fastApiFormData,
      signal: AbortSignal.timeout(FASTAPI_TIMEOUT),
    })

    if (!fastApiResponse.ok) {
      console.error("[v0] FastAPI upload failed:", fastApiResponse.status, fastApiResponse.statusText)
      return NextResponse.json(
        { success: false, error: `Upload service unavailable: ${fastApiResponse.statusText}` },
        { status: fastApiResponse.status },
      )
    }

    const result = await fastApiResponse.json()

    const response = NextResponse.json(result)
    response.headers.set("Cache-Control", "no-store, must-revalidate")

    return response
  } catch (error) {
    console.error("Upload endpoint error:", error)

    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json({ success: false, error: "Upload service timeout" }, { status: 504 })
    }

    return NextResponse.json({ success: false, error: "Upload service unavailable" }, { status: 503 })
  }
}
