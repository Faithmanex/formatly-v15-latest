import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},
        },
      }
    )

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { paypalSubscriptionId, paypalPlanId, billingCycle } = await request.json()

    if (!paypalSubscriptionId || !paypalPlanId || !billingCycle) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 1. Look up the internal plan using the PayPal plan ID
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("id")
      .or(`paypal_plan_id_monthly.eq.${paypalPlanId},paypal_plan_id_yearly.eq.${paypalPlanId}`)
      .maybeSingle()

    if (planError || !plan) {
      return Response.json({ error: "Plan not found" }, { status: 404 })
    }

    const now = new Date()
    const periodEnd = new Date(
      now.getTime() + (billingCycle === "yearly" ? 366 : 32) * 24 * 60 * 60 * 1000
    )

    // 2. Check for an existing active subscription
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    let subscriptionId: string

    if (existingSub) {
      // Update the existing subscription to the new plan
      const { data: updated, error } = await supabase
        .from("subscriptions")
        .update({
          plan_id: plan.id,
          paypal_subscription_id: paypalSubscriptionId,
          status: "active",
          billing_cycle: billingCycle,
          current_period_end: periodEnd.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", existingSub.id)
        .select("id")
        .single()

      if (error) {
        console.error("[ACTIVATE] Error updating subscription:", error)
        return Response.json({ error: "Failed to update subscription" }, { status: 500 })
      }
      subscriptionId = updated.id
    } else {
      // Create a brand new subscription record
      const { data: inserted, error } = await supabase
        .from("subscriptions")
        .insert({
          user_id: user.id,
          plan_id: plan.id,
          paypal_subscription_id: paypalSubscriptionId,
          status: "active",
          billing_cycle: billingCycle,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
        })
        .select("id")
        .single()

      if (error) {
        console.error("[ACTIVATE] Error creating subscription:", error)
        return Response.json({ error: "Failed to create subscription" }, { status: 500 })
      }
      subscriptionId = inserted.id
    }

    // 3. Link the subscription to the user's profile
    await supabase
      .from("profiles")
      .update({ subscription_id: subscriptionId })
      .eq("id", user.id)

    return Response.json({ success: true, subscriptionId })
  } catch (error) {
    console.error("[ACTIVATE] Unexpected error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
