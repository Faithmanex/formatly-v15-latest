// PayPal subscription button component
"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"

interface PayPalButtonProps {
  planId: string
  planName: string
  billingCycle: "monthly" | "yearly"
  disabled?: boolean
}

export function PayPalButton({ planId, planName, billingCycle, disabled = false }: PayPalButtonProps) {
  const { profile } = useAuth()
  const { toast } = useToast()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !profile?.id) return

    // Load PayPal script
    const script = document.createElement("script")
    script.src =
      "https://www.paypal.com/sdk/js?client-id=AQk7S24Sc2iKHeIuA93BP-3MN3fPOumFejN4lxJmku14oGkjT_T7l8lYgaS9ohmMf8YZl4M1aHLLS_H3&vault=true&intent=subscription"
    script.async = true

    script.onload = () => {
      if (window.paypal) {
        // Map plan to PayPal plan ID
        const paypalPlanIds: Record<string, Record<string, string>> = {
          pro: {
            monthly: "P-91A156471R160720SND2UYJQ",
            yearly: "P-6LC13956890715232ND2V5QA",
          },
          business: {
            monthly: "P-33Y990793W873362UND2VB7A",
            yearly: "P-990649366E456620KND2WEKA",
          },
        }

        const planKey = planName.toLowerCase()
        const paypalPlanId = paypalPlanIds[planKey]?.[billingCycle]

        if (!paypalPlanId) {
          console.error("Invalid plan configuration")
          return
        }

        window.paypal
          .Buttons({
            style: {
              shape: "pill",
              color: "gold",
              layout: "vertical",
              label: "subscribe",
            },
            createSubscription: (data: any, actions: any) =>
              actions.subscription.create({
                plan_id: paypalPlanId,
                custom_id: profile.id, // Pass user ID for webhook handling
              }),
            onApprove: (data: any, actions: any) => {
              console.log("[PAYPAL] Subscription approved:", data.subscriptionID)
              toast({
                title: "Subscription Successful",
                description: `Your ${planName} subscription has been activated.`,
              })
              // Refresh subscription data
              window.dispatchEvent(new Event("subscription-changed"))
            },
            onError: (err: any) => {
              console.error("[PAYPAL] Subscription error:", err)
              toast({
                title: "Subscription Failed",
                description: "There was an error processing your subscription. Please try again.",
                variant: "destructive",
              })
            },
          })
          .render(containerRef.current)
      }
    }

    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [profile?.id, planId, planName, billingCycle, toast])

  return <div ref={containerRef} className={disabled ? "opacity-50 pointer-events-none" : ""} />
}
