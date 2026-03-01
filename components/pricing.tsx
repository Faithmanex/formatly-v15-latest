"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { CheckCircle, Zap, Check, ArrowUp, ArrowDown, Star, HelpCircle, ChevronDown, ChevronUp, Shield } from "lucide-react"
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("transition-base hover-lift", className)}>{children}</div>
}

interface BillingToggleProps {
  billingCycle: "monthly" | "yearly"
  onChange: (cycle: "monthly" | "yearly") => void
  showSavings?: boolean
}

function BillingToggle({ billingCycle, onChange, showSavings = true }: BillingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span className={cn("text-sm font-medium transition-colors", billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground")}>
        Monthly{showSavings && " billing"}
      </span>
      <button
        onClick={() => onChange(billingCycle === "monthly" ? "yearly" : "monthly")}
        className="relative w-12 h-6 rounded-full bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
        aria-label="Toggle billing cycle"
        type="button"
      >
        <div className={cn(
          "absolute top-1 left-1 w-4 h-4 rounded-full bg-primary shadow-sm transition-transform duration-200 ease-in-out",
          billingCycle === "yearly" ? "translate-x-6" : ""
        )} />
      </button>
      <div className="flex items-center gap-2">
        <span className={cn("text-sm font-medium transition-colors", billingCycle === "yearly" ? "text-foreground" : "text-muted-foreground")}>
          Yearly{showSavings && " billing"}
        </span>
        {showSavings && (
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none font-bold text-[10px] sm:text-xs">
            {billingCycle === "yearly" ? "2 MONTHS FREE" : "SAVE 20%"}
          </Badge>
        )}
      </div>
    </div>
  )
}

export function Pricing({ mode = "landing" }: { mode?: "landing" | "dashboard" }) {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const { subscription: currentSubscription, plans: dbPlans } = useSubscription()
  const { isSubscribed, planName } = useSubscriptionStatus()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const [isComparisonOpen, setIsComparisonOpen] = useState(false)
  
  const isDashboard = mode === "dashboard"

  // Use DB plans if available, otherwise fallback to static pricingPlans
  const displayPlans = useMemo(() => {
    const plans = dbPlans && dbPlans.length > 0 
      ? [...dbPlans].sort((a, b) => (a.price_monthly || 0) - (b.price_monthly || 0))
      : pricingPlans
    return plans
  }, [dbPlans])

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
    // Check if it's the current plan
    const isCurrentPlan = currentSubscription?.plan_id === plan.id
    if (isCurrentPlan) {
      return {
        text: "Current Plan",
        icon: <Check className="h-4 w-4" />,
        variant: "outline" as const,
        disabled: true
      }
    }

    if (!currentSubscription?.plan) {
      return {
        text: plan.name === "Free" ? "Current Plan" : "Get Started",
        icon: plan.name === "Free" ? <Check className="h-4 w-4" /> : <Zap className="h-4 w-4" />,
        variant: plan.is_popular || plan.popular ? "default" : ("outline" as const),
        disabled: plan.name === "Free"
      }
    }

    // Convert plan price to plan object if needed for isPlanUpgrade
    const isUpgrade = isPlanUpgrade(currentSubscription.plan, plan as any)
    return {
      text: isUpgrade ? "Upgrade" : "Downgrade",
      icon: isUpgrade ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />,
      variant: isUpgrade ? "default" : ("outline" as const),
      disabled: false
    }
  }

  const formatDisplayPrice = (plan: any) => {
    const price = billingCycle === "monthly" ? (plan.price_monthly ?? 0) : (plan.price_yearly ?? 0)
    const displayPrice = billingCycle === "monthly" ? price : Math.floor(price / 12)
    return price === 0 ? "$0" : `$${displayPrice}`
  }

  return (
    <section id="pricing" className={cn(
      "relative scroll-mt-20 px-3 sm:px-4 md:px-6 lg:px-8",
      isDashboard ? "py-8" : "py-12 sm:py-16 md:py-20"
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
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8">Choose the plan that fits your needs</p>
            <BillingToggle billingCycle={billingCycle} onChange={setBillingCycle} />
          </motion.div>
        )}

        {isDashboard && (
          <div className="mb-10">
            <BillingToggle billingCycle={billingCycle} onChange={setBillingCycle} />
          </div>
        )}

        <div className={cn(
          "grid gap-6 sm:gap-8",
          isDashboard ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3"
        )}>
          {displayPlans.map((plan, index) => {
            const isCurrentPlan = isDashboard && currentSubscription?.plan_id === plan.id
            const buttonInfo = isDashboard ? getPlanButtonInfo(plan) : null
            const isShowingPayPal = isDashboard && selectedPlan === plan.id && !isCurrentPlan && profile?.id
            const isPopular = plan.is_popular || plan.popular
            const features = Array.isArray(plan.features) ? plan.features : []

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col h-full"
              >
                <TiltCard className="h-full">
                  <Card
                    className={cn(
                      "relative h-full transition-all bg-background flex flex-col",
                      isPopular ? "border-primary shadow-xl" : "border-border hover:shadow-lg",
                      isCurrentPlan && "ring-2 ring-emerald-500/50 dark:ring-emerald-400/50 bg-emerald-50/10"
                    )}
                  >
                    {isPopular && (
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
                      <CardTitle className="text-xl sm:text-2xl mb-2 sm:mb-3">{plan.name}</CardTitle>
                      <div className="mb-2">
                        <span className="text-3xl sm:text-4xl md:text-5xl font-bold">{formatDisplayPrice(plan)}</span>
                        <span className="text-sm sm:text-base text-muted-foreground">/month</span>
                      </div>
                      {billingCycle === "yearly" && plan.price_yearly > 0 && (
                        <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-3">
                          Billed as ${plan.price_yearly}/year
                        </div>
                      )}
                      <CardDescription className="text-sm sm:text-base min-h-[40px] px-2 leading-relaxed">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0 flex-1">
                      <ul className="space-y-3">
                        {features.map((feature: any, featureIndex: number) => {
                          const featureStr = typeof feature === 'string' ? feature : feature.text || ""
                          const parts = featureStr.split(":")
                          const cleanFeature = parts[0].trim()
                          const tooltip = parts[1]?.trim()
                          
                          return (
                            <li key={featureIndex} className="flex items-start gap-2 sm:gap-3">
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0 mt-0.5" />
                              <span className="text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
                                {cleanFeature}
                                {tooltip && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button className="inline-flex items-center justify-center rounded-full hover:bg-muted p-0.5 transition-colors" aria-label={`More information about ${cleanFeature}`}>
                                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground transition-colors hover:text-primary" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-[220px] text-xs p-2.5 shadow-xl border-border/50 bg-popover/95 backdrop-blur-sm">
                                        {tooltip}
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
                            billingCycle={billingCycle}
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
                            "w-full text-sm sm:text-base rounded-full gap-2 transition-all",
                            isPopular && !buttonInfo?.disabled && "bg-primary hover:bg-primary/90 shadow-md"
                          )}
                          onClick={() => handlePlanSelect(plan.id!)}
                        >
                          {buttonInfo?.icon}
                          {plan.name === "Business" ? "Coming soon..." : buttonInfo?.text}
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          variant={plan.buttonVariant || (isPopular ? "default" : "outline")}
                          asChild
                          disabled={(plan as any).comingSoon}
                          className={cn(
                            "w-full text-sm sm:text-base rounded-full transition-all",
                            isPopular && "bg-primary hover:bg-primary/90 shadow-md",
                            (plan as any).comingSoon && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <Link href={user ? "/dashboard" : "/auth/register"}>
                            {plan.buttonText || (plan.name === "Free" ? "Get Started" : "Buy Now")}
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

        {/* Comparison Table */}
        <div className="mt-12 sm:mt-16 pt-4 flex justify-center">
          <Collapsible
            open={isComparisonOpen}
            onOpenChange={setIsComparisonOpen}
            className="w-full space-y-4"
          >
            <div className="flex justify-center">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-primary transition-colors">
                  {isComparisonOpen ? "Hide Feature Comparison" : "Compare All Features"}
                  {isComparisonOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <Card className="overflow-hidden border-border/50 bg-muted/5 backdrop-blur-sm animate-in slide-in-from-top-2 fade-in duration-300">
                <CardHeader className="pb-4 border-b border-border/50">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-primary" />
                    Feature Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50 bg-muted/20">
                          <th className="text-left py-4 px-6 font-medium text-muted-foreground">Feature</th>
                          {displayPlans.map((plan: any) => (
                            <th key={plan.id || plan.name} className={cn(
                              "text-center py-4 px-6 font-semibold min-w-[120px]",
                              (plan.is_popular || plan.popular) ? "text-primary" : ""
                            )}>
                              {plan.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: "Documents", key: "document_limit", format: (v: any) => v == null ? "—" : (v === -1 || v === 0 ? "Unlimited" : v.toLocaleString()) },
                          { label: "Priority Support", key: "priority_support", type: "boolean" },
                          { label: "Custom Styles", key: "custom_styles", type: "boolean" },
                          { label: "Team Collab", key: "team_collaboration", type: "boolean" },
                        ].map((row, idx) => (
                          <tr key={idx} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="py-4 px-6 font-medium">{row.label}</td>
                            {displayPlans.map((plan: any) => {
                              const val = plan[row.key];
                              return (
                                <td key={plan.id || plan.name} className="text-center py-4 px-6">
                                  {row.type === "boolean" ? (
                                    val ? (
                                      <div className="flex justify-center">
                                        <Check className="h-4 w-4 text-green-500" />
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground/30">•</span>
                                    )
                                  ) : (
                                    <span className="text-muted-foreground">{row.format ? row.format(val) : (val ?? "—")}</span>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  </section>
)
}
