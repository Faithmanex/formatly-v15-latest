// PayPal webhook handler for subscription events
import { headers } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const headersList = await headers()

    // Verify webhook signature (in production, verify with PayPal)
    // For now, we'll accept all webhooks in development

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    })

    // Handle different PayPal event types
    switch (body.event_type) {
      case "BILLING.SUBSCRIPTION.CREATED":
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
        console.log("[PAYPAL WEBHOOK] Unhandled event type:", body.event_type)
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("[PAYPAL WEBHOOK] Error processing webhook:", error)
    return Response.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function handleSubscriptionCreated(supabase: any, resource: any) {
  console.log("[PAYPAL WEBHOOK] Subscription created:", resource.id)

  // Update subscription with PayPal subscription ID
  const { error } = await supabase
    .from("subscriptions")
    .update({
      paypal_subscription_id: resource.id,
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", resource.custom_id) // Assuming we pass user subscription ID as custom_id

  if (error) {
    console.error("[PAYPAL WEBHOOK] Error updating subscription:", error)
  }
}

async function handleSubscriptionUpdated(supabase: any, resource: any) {
  console.log("[PAYPAL WEBHOOK] Subscription updated:", resource.id)

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
      status: statusMap[resource.status] || "active",
      updated_at: new Date().toISOString(),
    })
    .eq("paypal_subscription_id", resource.id)

  if (error) {
    console.error("[PAYPAL WEBHOOK] Error updating subscription status:", error)
  }
}

async function handleSubscriptionCancelled(supabase: any, resource: any) {
  console.log("[PAYPAL WEBHOOK] Subscription cancelled:", resource.id)

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
  console.log("[PAYPAL WEBHOOK] Subscription suspended:", resource.id)

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
  console.log("[PAYPAL WEBHOOK] Payment completed:", resource.id)

  // Create invoice record for payment
  const { error } = await supabase.from("invoices").insert({
    paypal_transaction_id: resource.id,
    amount_paid: Math.round(Number.parseFloat(resource.amount.value) * 100),
    currency: resource.amount.currency_code,
    status: "paid",
    paid_at: new Date().toISOString(),
  })

  if (error) {
    console.error("[PAYPAL WEBHOOK] Error creating invoice:", error)
  }
}
