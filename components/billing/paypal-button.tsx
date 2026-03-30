"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { useSubscription } from "@/contexts/subscription-context"

const getPayPalSdkUrl = () => {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  if (!clientId) return null
  
  // You can set NEXT_PUBLIC_PAYPAL_ENV to 'sandbox' or 'live'
  // If not set, we default to live but allow a simple check
  const isSandbox = process.env.NEXT_PUBLIC_PAYPAL_ENV === 'sandbox' || clientId.startsWith('sb-')
  const baseUrl = isSandbox ? 'https://www.sandbox.paypal.com' : 'https://www.paypal.com'
  
  return `${baseUrl}/sdk/js?client-id=${clientId}&vault=true&intent=subscription`
}

let paypalSdkPromise: Promise<void> | null = null

function loadPayPalSdk(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("PayPal SDK can only load in the browser."))
  }

  if (window.paypal) {
    return Promise.resolve()
  }

  if (paypalSdkPromise) {
    return paypalSdkPromise
  }

  paypalSdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-paypal-sdk="true"]') as HTMLScriptElement | null

    if (existingScript) {
      if (existingScript.dataset.loaded === "true" && window.paypal) {
        resolve()
        return
      }

      if (existingScript.dataset.failed === "true") {
        existingScript.remove()
      } else {
        const onLoad = () => {
          existingScript.removeEventListener("load", onLoad)
          existingScript.removeEventListener("error", onError)
          resolve()
        }

        const onError = () => {
          existingScript.removeEventListener("load", onLoad)
          existingScript.removeEventListener("error", onError)
          paypalSdkPromise = null
          reject(new Error("Failed to load PayPal SDK."))
        }

        existingScript.addEventListener("load", onLoad)
        existingScript.addEventListener("error", onError)
        return
      }
    }

    const sdkUrl = getPayPalSdkUrl()
    if (!sdkUrl) {
      reject(new Error("PayPal Client ID is not configured."))
      return
    }

    const script = document.createElement("script")
    script.src = sdkUrl
    script.async = true
    script.dataset.paypalSdk = "true"

    script.onload = () => {
      script.dataset.loaded = "true"
      resolve()
    }

    script.onerror = () => {
      script.dataset.failed = "true"
      paypalSdkPromise = null
      reject(new Error("Failed to load PayPal SDK."))
    }

    document.head.appendChild(script)
  })

  return paypalSdkPromise
}

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

    let isMounted = true

    loadPayPalSdk()
      .then(() => {
        if (!window.paypal || !containerRef.current || !isMounted) {
          return
        }

        containerRef.current.innerHTML = ""

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
          toast({
            title: "Configuration Error",
            description: "This plan is not available for PayPal subscription.",
            variant: "destructive",
          })
          return
        }

        void window.paypal
          .Buttons({
            style: {
              shape: "pill",
              color: "gold",
              layout: "vertical",
              label: "subscribe",
            },
            createSubscription: (data: any, actions: any) => {
              return actions.subscription.create({
                plan_id: paypalPlanId,
                custom_id: profile.id,
              })
            },
            onApprove: async (data: any) => {
              try {
                const res = await fetch("/api/subscriptions/activate", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    paypalSubscriptionId: data.subscriptionID,
                    paypalPlanId,
                    billingCycle,
                  }),
                })

                if (!res.ok) {
                  throw new Error("Activation failed")
                }

                toast({
                  title: "Subscription Activated",
                  description: `You're now on the ${planName} plan.`,
                })
                await refreshAll()
                window.dispatchEvent(new Event("subscription-changed"))
              } catch {
                toast({
                  title: "Activation Error",
                  description: "Payment was received but your plan could not be updated. Please contact support.",
                  variant: "destructive",
                })
              }
            },
            onError: (err: any) => {
              console.error("PayPal subscription flow failed:", err)
              toast({
                title: "Subscription Failed",
                description: "There was an error processing your subscription. Please try again.",
                variant: "destructive",
              })
            },
          })
          .render(containerRef.current)
      })
      .catch((error) => {
        console.error("Failed to initialize PayPal SDK:", error)
        toast({
          title: "Payment Error",
          description: "Failed to load PayPal. Please disable blockers or refresh and try again.",
          variant: "destructive",
        })
      })

    return () => {
      isMounted = false
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
