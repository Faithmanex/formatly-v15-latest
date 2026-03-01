"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle, Zap, Check, ArrowUp, ArrowDown, RefreshCw, Star, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { pricingPlans } from "@/lib/landing-data"
import { useAuth } from "@/components/auth-provider"
import { useSubscription, useSubscriptionStatus } from "@/contexts/subscription-context"
import { PayPalButton } from "@/components/billing/paypal-button"
import { cn } from "@/lib/utils"
import { isPlanUpgrade, getPlanChangePreview } from "@/lib/billing"
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`transition-base hover-lift ${className}`}>{children}</div>
}

export function Pricing({ mode = "landing" }: { mode?: "landing" | "dashboard" }) {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const { subscription: currentSubscription, plans } = useSubscription()
  const { isSubscribed, planName } = useSubscriptionStatus()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  
  const isDashboard = mode === "dashboard"

  const handlePlanSelect = async (planId: string) => {
    if (!profile?.id) return
    
    setSelectedPlan(planId)
    try {
      const preview = await getPlanChangePreview(profile.id, planId)

      if (!preview.isUpgrade && preview.currentPlan) {
        const confirmed = window.confirm(
          `This will downgrade your plan from ${preview.currentPlan.name} to ${preview.newPlan.name}. ` +
            `The change will take effect on ${new Date(preview.effectiveDate!).toLocaleDateString()}. ` +
            `You'll keep your current benefits until then. Continue?`,
        )

        if (!confirmed) {
          setSelectedPlan(null)
          return
        }
      }
    } catch (error) {
      console.error("Error previewing plan change:", error)
      toast({
        title: "Error",
        description: "Failed to preview plan change. Please try again.",
        variant: "destructive",
      })
      setSelectedPlan(null)
    }
  }

  const getPlanButtonInfo = (plan: any) => {
    if (!currentSubscription?.plan) {
      return {
        text: plan.name === "Free" ? "Current Plan" : "Get Started",
        icon: plan.name === "Free" ? <Check className="h-4 w-4" /> : <Zap className="h-4 w-4" />,
        variant: plan.popular ? "default" : ("outline" as const),
        disabled: plan.name === "Free"
      }
    }

    const isCurrentPlan = currentSubscription?.plan_id === plan.id
    if (isCurrentPlan) {
      return {
        text: "Current Plan",
        icon: <Check className="h-4 w-4" />,
        variant: "outline" as const,
        disabled: true
      }
    }

    // Map landing-data plan IDs to DB plan objects for comparison if possible
    // For now, simple upgrade logic based on price
    const dbPlan = plans.find(p => p.id === plan.id)
    if (dbPlan) {
      const isUpgrade = isPlanUpgrade(currentSubscription.plan, dbPlan)
      return {
        text: isUpgrade ? "Upgrade" : "Downgrade",
        icon: isUpgrade ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />,
        variant: isUpgrade ? "default" : ("outline" as const),
        disabled: false
      }
    }

    return {
      text: "Get Started",
      icon: <Zap className="h-4 w-4" />,
      variant: plan.popular ? "default" : ("outline" as const),
      disabled: false
    }
  }

  return (
    <section id="pricing" className={cn(
      "relative scroll-mt-20",
      isDashboard ? "py-6" : "py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-6 lg:px-8"
    )}>
      <div className="max-w-7xl mx-auto">
        {!isDashboard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16 px-4"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground">Choose the plan that fits your needs</p>
          </motion.div>
        )}

        <div className={cn(
          "grid gap-6 sm:gap-8",
          isDashboard ? "grid-cols-1 md:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3"
        )}>
          {pricingPlans.map((plan, index) => {
            const isCurrentPlan = isDashboard && currentSubscription?.plan_id === plan.id
            const buttonInfo = isDashboard ? getPlanButtonInfo(plan) : null
            const isShowingPayPal = isDashboard && selectedPlan === plan.id && !isCurrentPlan && profile?.id

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <TiltCard className="h-full">
                  <Card
                    className={cn(
                      "relative h-full transition-all bg-background flex flex-col",
                      plan.popular ? "border-primary shadow-xl" : "border-border hover:shadow-lg",
                      isCurrentPlan && "ring-2 ring-emerald-500/50 dark:ring-emerald-400/50 bg-emerald-50/10"
                    )}
                  >
                    {plan.popular && (
                      <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs sm:text-sm rounded-full px-3 py-1">
                        Most Popular
                      </Badge>
                    )}
                    
                    {isCurrentPlan && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-100/20 gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          Current
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-4 sm:pb-6 p-4 sm:p-6">
                      <CardTitle className="text-xl sm:text-2xl mb-3 sm:mb-4">{plan.name}</CardTitle>
                      <div className="mb-2">
                        <span className="text-3xl sm:text-4xl md:text-5xl font-bold">{plan.price}</span>
                        <span className="text-sm sm:text-base text-muted-foreground">/{plan.period}</span>
                      </div>
                      <CardDescription className="text-sm sm:text-base min-h-[40px]">{plan.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0 flex-1">
                      <ul className="space-y-3">
                        {plan.features.map((feature, featureIndex) => {
                          const hasInfo = feature.includes("(i)")
                          const cleanFeature = feature.replace("(i)", "").trim()
                          
                          return (
                            <li key={featureIndex} className="flex items-start gap-2 sm:gap-3">
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />
                              <span className="text-xs sm:text-sm flex items-center gap-1">
                                {cleanFeature}
                                {hasInfo && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-[200px] text-xs">
                                        {cleanFeature.includes("Tracked Changes") 
                                          ? "Full history of all edits made to your document structure and content."
                                          : "Create and save specialized formatting templates for specific requirements."}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    </CardContent>

                    <CardFooter className="p-4 sm:p-6 pt-0">
                      {isShowingPayPal ? (
                        <div className="w-full space-y-2">
                          <PayPalButton
                            planId={plan.id!}
                            planName={plan.name}
                            billingCycle="monthly"
                            disabled={isCurrentPlan}
                          />
                          <Button variant="ghost" size="sm" className="w-full text-muted-foreground h-8 text-xs" onClick={() => setSelectedPlan(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : isDashboard ? (
                        <Button
                          size="lg"
                          variant={buttonInfo?.variant as any}
                          disabled={buttonInfo?.disabled || (plan as any).comingSoon}
                          className={cn(
                            "w-full text-sm sm:text-base rounded-full gap-2",
                            plan.popular && !buttonInfo?.disabled && "bg-primary hover:bg-primary/90"
                          )}
                          onClick={() => handlePlanSelect(plan.id!)}
                        >
                          {buttonInfo?.icon}
                          {plan.name === "Business" ? "Coming soon..." : buttonInfo?.text}
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          variant={plan.buttonVariant}
                          asChild
                          className={cn(
                            "w-full text-sm sm:text-base rounded-full",
                            plan.popular && "bg-primary hover:bg-primary/90"
                          )}
                        >
                          <Link href={user ? "/dashboard" : "/onboard"}>
                            {plan.buttonText}
                          </Link>
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                </TiltCard>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
