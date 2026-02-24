import { type NextRequest, NextResponse } from "next/server"
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    const body = await request.json()
    const { job_id } = body
    const fullUrl = `${FASTAPI_BASE_URL}/api/documents/upload-complete`

    const {
      data: { session },
    } = await supabase.auth.getSession()
    const authHeader = session?.access_token ? `Bearer ${session.access_token}` : ""

    try {
      const response = await fetch(fullUrl, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(FASTAPI_TIMEOUT),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("FastAPI upload-complete error:", response.status, errorText)

        let errorMessage = "Failed to confirm upload completion"
        const details = errorText

        if (response.status === 401) {
          errorMessage = "Authentication failed with FastAPI backend"
        } else if (response.status === 404) {
          errorMessage = "Document job not found - may have expired"
        } else if (response.status >= 500) {
          errorMessage = "FastAPI backend service error"
        }

        return NextResponse.json(
          {
            success: false,
            error: errorMessage,
            details: details,
            type: "FastAPI Error",
          },
          { status: response.status },
        )
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (fetchError) {
      if (fetchError instanceof Error) {
        if (fetchError.name === "AbortError") {
          console.error("[v0] FastAPI connection timeout after", FASTAPI_TIMEOUT / 1000, "seconds")
          return NextResponse.json(
            {
              success: false,
              error: "FastAPI backend connection timeout",
              details: `The FastAPI backend at ${fullUrl} did not respond within ${FASTAPI_TIMEOUT / 1000} seconds.`,
              type: "Connection Timeout",
              troubleshooting: {
                step1: "Check if FastAPI backend is running",
                step2: `Verify FASTAPI_BASE_URL is set correctly: ${FASTAPI_BASE_URL}`,
                step3: "Check network connectivity between Next.js and FastAPI",
              },
            },
            { status: 504 },
          )
        }

        if (
          fetchError.message.includes("ECONNREFUSED") ||
          fetchError.message.includes("ENOTFOUND") ||
          fetchError.message.includes("connect ECONNREFUSED")
        ) {
          console.error("[v0] FastAPI connection refused:", fetchError.message)
          return NextResponse.json(
            {
              success: false,
              error: "Cannot connect to FastAPI backend",
              details: `Connection refused to ${fullUrl}. The service may be offline or unreachable.`,
              type: "Connection Refused",
              troubleshooting: {
                step1: "Ensure FastAPI backend is running (python main.py or uvicorn main:app)",
                step2: `Verify the correct host/port: ${FASTAPI_BASE_URL}`,
                step3: "Check firewall and network settings",
              },
            },
            { status: 503 },
          )
        }
      }

      console.error("[v0] Unexpected fetch error:", fetchError instanceof Error ? fetchError.message : fetchError)
      throw fetchError
    }
  } catch (error) {
    console.error("[v0] Upload complete route error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error occurred",
        type: error instanceof TypeError ? "Network Error" : "Server Error",
      },
      { status: 500 },
    )
  }
}
