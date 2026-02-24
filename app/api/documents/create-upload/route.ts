import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

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

    const formData = await request.formData()

    const style = formData.get("style") as string
    if (style) {
      formData.set("style", style.toLowerCase())
    }

    const fastApiUrl = process.env.FASTAPI_BASE_URL
    const fullUrl = `${fastApiUrl}/api/documents/create-upload`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const {
      data: { session },
    } = await supabase.auth.getSession()
    const authHeader = session?.access_token ? `Bearer ${session.access_token}` : ""

    try {
      const response = await fetch(fullUrl, {
        method: "POST",
        headers: {
          Authorization: authHeader,
        },
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("FastAPI create-upload error:", response.status, errorText)
        return NextResponse.json(
          {
            error: "Failed to create upload URL",
            details: errorText,
            status: response.status,
            fastApiUrl: fullUrl,
          },
          { status: response.status },
        )
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (fetchError) {
      clearTimeout(timeoutId)

      if (fetchError instanceof Error) {
        if (fetchError.name === "AbortError") {
          console.error("FastAPI connection timeout after 10 seconds")
          return NextResponse.json(
            {
              error: "FastAPI backend connection timeout",
              details: "The FastAPI backend service is not responding. Please check if it's running.",
              troubleshooting: {
                message: "FastAPI Backend Not Available",
                steps: [
                  "1. Check if FastAPI backend is running on " + fastApiUrl,
                  "2. Verify FASTAPI_BASE_URL environment variable is correct",
                  "3. Ensure the backend service is accessible from this environment",
                  "4. Check network connectivity and firewall settings",
                ],
              },
              type: "Connection Timeout",
            },
            { status: 504 },
          )
        }

        if (fetchError.message.includes("ECONNREFUSED") || fetchError.message.includes("fetch")) {
          console.error("FastAPI connection refused:", fetchError.message)
          return NextResponse.json(
            {
              error: "Cannot connect to FastAPI backend",
              details: `Connection refused to ${fullUrl}. The FastAPI service appears to be offline.`,
              troubleshooting: {
                message: "FastAPI Backend Service Offline",
                steps: [
                  "1. Start the FastAPI backend service: 'python main.py' or 'uvicorn main:app --reload'",
                  "2. Verify it's running on the correct port (default: 8000)",
                  "3. Check the FASTAPI_BASE_URL environment variable: " + fastApiUrl,
                  "4. Ensure the backend has all required environment variables configured",
                ],
              },
              type: "Connection Refused",
            },
            { status: 503 },
          )
        }
      }

      throw fetchError
    }
  } catch (error) {
    console.error("Create upload route error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        type: error instanceof TypeError ? "Network/Connection Error" : "Server Error",
      },
      { status: 500 },
    )
  }
}
