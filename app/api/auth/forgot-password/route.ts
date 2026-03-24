import { NextResponse } from "next/server"
import { rateLimit, getRateLimitIdentifier, RATE_LIMITS } from "@/lib/rate-limit"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    // 1. Get Rate Limit Identifier (Standardized IP or user-id lookup)
    const identifier = getRateLimitIdentifier(request)

    // 2. Apply Rate Limit for Password Reset requests
    const { success, limit, remaining, reset } = await rateLimit(identifier, RATE_LIMITS.AUTH_PASSWORD_RESET)

    if (!success) {
      return NextResponse.json(
        { error: "Too many password reset requests. Please wait a while before trying again." },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          }
        }
      )
    }

    // 3. Process Request using secure Server Client
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()

    // Create reset rate limit trigger
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/auth/callback?next=/dashboard/settings/password`,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Reset link sent to your email" })
  } catch (err: any) {
    console.error("[FORGOT_PASSWORD] Server error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
