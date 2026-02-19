"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { useSubscription } from "@/contexts/subscription-context"

interface PayPalButtonProps {
  planId: string
  planName: string
  billingCycle: "monthly" | "yearly"
  disabled?: boolean
}

export function PayPalButton({ planId, planName, billingCycle, disabled = false }: PayPalButtonProps) {
  const { profile } = useAuth()
  const { toast } = useToast()
  const { refreshAll } = useSubscription()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !profile?.id || disabled) return

    // Load PayPal script
    const script = document.createElement("script")
    script.src =
      "https://www.paypal.com/sdk/js?client-id=AQk7S24Sc2iKHeIuA93BP-3MN3fPOumFejN4lxJmku14oGkjT_T7l8lYgaS9ohmMf8YZl4M1aHLLS_H3&vault=true&intent=subscription"
    script.async = true

    script.onload = () => {
      if (window.paypal) {
        const paypalPlanIds: Record<string, Record<string, string>> = {
          free: {
            monthly: "",
            yearly: "",
          },
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
          console.error("[v0] Invalid plan configuration:", planName, billingCycle)
          toast({
            title: "Configuration Error",
            description: "This plan is not available for PayPal subscription.",
            variant: "destructive",
          })
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
            createSubscription: (data: any, actions: any) => {
              console.log("[v0] Creating PayPal subscription:", paypalPlanId)
              return actions.subscription.create({
                plan_id: paypalPlanId,
                custom_id: profile.id,
              })
            },
            onApprove: async (data: any, actions: any) => {
              console.log("[v0] PayPal subscription approved:", data.subscriptionID)
              toast({
                title: "Subscription Successful",
                description: `Your ${planName} subscription has been activated.`,
              })
              // Refresh subscription data
              await refreshAll()
              window.dispatchEvent(new Event("subscription-changed"))
            },
            onError: (err: any) => {
              console.error("[v0] PayPal subscription error:", err)
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

    script.onerror = () => {
      console.error("[v0] Failed to load PayPal script")
      toast({
        title: "Payment Error",
        description: "Failed to load PayPal. Please refresh and try again.",
        variant: "destructive",
      })
    }

    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [profile?.id, planId, planName, billingCycle, toast, disabled, refreshAll])

  return (
    <div
      ref={containerRef}
      className={`w-full ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      data-testid="paypal-button-container"
    />
  )
}
