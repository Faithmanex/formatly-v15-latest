import { type NextRequest, NextResponse } from "next/server"

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const FASTAPI_TIMEOUT = Number.parseInt(process.env.FASTAPI_TIMEOUT || "5000")

export async function GET(request: NextRequest) {
  try {
    // Forward the request to FastAPI
    const fastApiResponse = await fetch(`${FASTAPI_BASE_URL}/api/formatting/variants`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(FASTAPI_TIMEOUT),
    })

    if (!fastApiResponse.ok) {
      console.error("FastAPI variants fetch failed:", fastApiResponse.status, fastApiResponse.statusText)
      return NextResponse.json(
        { error: "Failed to fetch formatting variants from the backend service." },
        { status: fastApiResponse.status }
      )
    }

    const result = await fastApiResponse.json()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Variants endpoint error:", error)
    return NextResponse.json(
      { error: "Internal Server Error fetching formatting variants." },
      { status: 500 }
    )
  }
}
