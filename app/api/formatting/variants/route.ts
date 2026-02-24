import { type NextRequest, NextResponse } from "next/server"

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL
const FASTAPI_TIMEOUT = Number.parseInt(process.env.FASTAPI_TIMEOUT!)

const defaultVariants = [
  { id: "us", name: "US English", description: "American English" },
  { id: "uk", name: "UK English", description: "British English" },
  { id: "ca", name: "Canadian English", description: "Canadian English" },
  { id: "au", name: "Australian English", description: "Australian English" },
]

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && !process.env.FASTAPI_BASE_URL) {
    return NextResponse.json(defaultVariants)
  }

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
      return NextResponse.json(defaultVariants)
    }

    const result = await fastApiResponse.json()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Variants endpoint error:", error)
    return NextResponse.json(defaultVariants)
  }
}
