// PayPal webhook handler for subscription events
import { createServerClient } from "@supabase/ssr"
import { headers } from "next/headers"

export const dynamic = "force-dynamic"

async function verifyPayPalWebhook(body: string, headersList: Headers): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  const baseUrl = process.env.PAYPAL_API_URL ?? "https://api-m.paypal.com"

  if (!webhookId || !clientId || !clientSecret) {
    console.warn("[PAYPAL WEBHOOK] Missing verification credentials — skipping signature check")
    return true
  }

  try {
    // Get PayPal access token
    const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    })
    const { access_token } = await tokenRes.json()

    // Verify the webhook signature via PayPal API
    const verifyRes = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        transmission_id: headersList.get("paypal-transmission-id"),
        transmission_time: headersList.get("paypal-transmission-time"),
        cert_url: headersList.get("paypal-cert-url"),
        auth_algo: headersList.get("paypal-auth-algo"),
        transmission_sig: headersList.get("paypal-transmission-sig"),
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
      }),
    })

    const { verification_status } = await verifyRes.json()
    return verification_status === "SUCCESS"
  } catch (error) {
    console.error("[PAYPAL WEBHOOK] Signature verification failed:", error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const headersList = await headers()

    const isValid = await verifyPayPalWebhook(rawBody, headersList)
    if (!isValid) {
      console.error("[PAYPAL WEBHOOK] Invalid webhook signature — rejecting request")
      return Response.json({ error: "Invalid webhook signature" }, { status: 401 })
    }

    const body = JSON.parse(rawBody)

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    })

    switch (body.event_type) {
      case "BILLING.SUBSCRIPTION.CREATED":
      case "BILLING.SUBSCRIPTION.ACTIVATED":
        await handleSubscriptionCreated(supabase, body.resource)
        break
      case "BILLING.SUBSCRIPTION.UPDATED":
        await handleSubscriptionUpdated(supabase, body.resource)
        break
      case "BILLING.SUBSCRIPTION.CANCELLED":
        await handleSubscriptionCancelled(supabase, body.resource)
        break
      case "BILLING.SUBSCRIPTION.SUSPENDED":
        await handleSubscriptionSuspended(supabase, body.resource)
        break
      case "PAYMENT.CAPTURE.COMPLETED":
        await handlePaymentCompleted(supabase, body.resource)
        break
      default:
        break
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("[PAYPAL WEBHOOK] Error processing webhook:", error)
    return Response.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function handleSubscriptionCreated(supabase: any, resource: any) {
  const userId = resource.custom_id
  const paypalPlanId = resource.plan_id
  const paypalSubscriptionId = resource.id

  if (!userId) {
    console.error("[PAYPAL WEBHOOK] No custom_id (user_id) found in subscription resource")
    return
  }

  // 1. Find the internal plan and billing cycle by matching both PayPal plan ID columns
  const { data: planData, error: planError } = await supabase
    .from("subscription_plans")
    .select("id, paypal_plan_id_monthly, paypal_plan_id_yearly")
    .or(`paypal_plan_id_monthly.eq.${paypalPlanId},paypal_plan_id_yearly.eq.${paypalPlanId}`)
    .maybeSingle()

  if (planError || !planData) {
    console.error("[PAYPAL WEBHOOK] Error finding plan for PayPal ID:", paypalPlanId, planError)
    return
  }

  const billing_cycle = planData.paypal_plan_id_yearly === paypalPlanId ? "yearly" : "monthly"
  const now = new Date()

  // Use PayPal's actual next billing time if available, otherwise approximate
  const nextBillingTime = resource.billing_info?.next_billing_time
  const periodEnd = nextBillingTime
    ? new Date(nextBillingTime)
    : new Date(now.getTime() + (billing_cycle === "yearly" ? 366 : 32) * 24 * 60 * 60 * 1000)

  // 2. Check if an active subscription already exists for this user (FIX: filter by status)
  const { data: existingSub, error: fetchError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle()

  if (fetchError) {
    console.error("[PAYPAL WEBHOOK] Error checking existing subscription:", fetchError)
  }

  let subscriptionId: string | null = null

  if (existingSub) {
    // Update existing active subscription
    const { data: updated, error } = await supabase
      .from("subscriptions")
      .update({
        paypal_subscription_id: paypalSubscriptionId,
        plan_id: planData.id,
        status: "active",
        billing_cycle,
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", existingSub.id)
      .select("id")
      .single()

    if (error) {
      console.error("[PAYPAL WEBHOOK] Error updating subscription:", error)
      return
    }
    subscriptionId = updated.id
  } else {
    // Create new subscription for the user
    const { data: inserted, error } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan_id: planData.id,
        paypal_subscription_id: paypalSubscriptionId,
        status: "active",
        billing_cycle,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .select("id")
      .single()

    if (error) {
      console.error("[PAYPAL WEBHOOK] Error creating subscription:", error)
      return
    }
    subscriptionId = inserted.id
  }

  // 3. Link the subscription to the user's profile using the ID we already have (FIX: no extra roundtrip)
  if (subscriptionId) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ subscription_id: subscriptionId })
      .eq("id", userId)

    if (profileError) {
      console.error("[PAYPAL WEBHOOK] Error linking subscription to profile:", profileError)
    }
  }
}

async function handleSubscriptionUpdated(supabase: any, resource: any) {
  const statusMap: Record<string, string> = {
    APPROVAL_PENDING: "trialing",
    APPROVED: "active",
    ACTIVE: "active",
    SUSPENDED: "past_due",
    CANCELLED: "canceled",
    EXPIRED: "canceled",
  }

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: statusMap[resource.status] ?? "active",
      updated_at: new Date().toISOString(),
    })
    .eq("paypal_subscription_id", resource.id)

  if (error) {
    console.error("[PAYPAL WEBHOOK] Error updating subscription status:", error)
  }
}

async function handleSubscriptionCancelled(supabase: any, resource: any) {
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq("paypal_subscription_id", resource.id)

  if (error) {
    console.error("[PAYPAL WEBHOOK] Error cancelling subscription:", error)
  }
}

async function handleSubscriptionSuspended(supabase: any, resource: any) {
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("paypal_subscription_id", resource.id)

  if (error) {
    console.error("[PAYPAL WEBHOOK] Error suspending subscription:", error)
  }
}

async function handlePaymentCompleted(supabase: any, resource: any) {
  // Resolve the subscription by the PayPal subscription ID in the capture's supplementary data
  const paypalSubscriptionId = resource.supplementary_data?.related_ids?.subscription_id

  if (!paypalSubscriptionId) {
    console.warn("[PAYPAL WEBHOOK] No subscription ID found in payment capture — skipping invoice")
    return
  }

  const { data: sub, error: subError } = await supabase
    .from("subscriptions")
    .select("id, user_id")
    .eq("paypal_subscription_id", paypalSubscriptionId)
    .maybeSingle()

  if (subError || !sub) {
    console.error("[PAYPAL WEBHOOK] Error resolving subscription for payment:", paypalSubscriptionId, subError)
    return
  }

  const { error } = await supabase.from("invoices").insert({
    user_id: sub.user_id,
    subscription_id: sub.id,
    paypal_transaction_id: resource.id,
    amount_due: Math.round(Number.parseFloat(resource.amount.value) * 100),
    amount_paid: Math.round(Number.parseFloat(resource.amount.value) * 100),
    currency: resource.amount.currency_code,
    status: "paid",
    paid_at: new Date().toISOString(),
  })

  if (error) {
    console.error("[PAYPAL WEBHOOK] Error creating invoice:", error)
  }
}
