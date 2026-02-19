"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Check, Zap, Star, ArrowUp, ArrowDown, Clock, Shield, ChevronDown, ChevronUp, RefreshCw } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useSubscription, useSubscriptionStatus } from "@/contexts/subscription-context"
import { getPlanChangePreview, isPlanUpgrade } from "@/lib/billing"
import { useToast } from "@/hooks/use-toast"
import { PayPalButton } from "./paypal-button"
import { cn } from "@/lib/utils"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 },
  },
}

export function SubscriptionPlans() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const { subscription: currentSubscription, plans, refreshAll } = useSubscription()
  const { isSubscribed, isPremium, planName } = useSubscriptionStatus()
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly")
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isComparisonOpen, setIsComparisonOpen] = useState(false)
  const [pendingDowngrade, setPendingDowngrade] = useState<{
    planName: string
    effectiveDate: string
  } | null>(null)

  const isYearly = billingInterval === "yearly"

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoading(false)
        if (currentSubscription) {
          // Auto-select the user's current billing cycle
          if (currentSubscription.billing_cycle === "yearly") {
            setBillingInterval("yearly")
          }
        }
      } catch (error) {
        console.error("Error loading plans:", error)
        toast({
          title: "Error",
          description: "Failed to load subscription plans.",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    loadPlans()
  }, [toast, currentSubscription, profile])

  const handlePlanSelect = async (planId: string) => {
    if (!profile?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to a plan.",
        variant: "destructive",
      })
      return
    }

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

        setPendingDowngrade({
          planName: preview.newPlan.name,
          effectiveDate: preview.effectiveDate!,
        })
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
        text: plan.name === "Free" ? "Get Started" : "Subscribe Now",
        icon: <Zap className="h-4 w-4" />,
        variant: plan.is_popular ? "default" : ("outline" as const),
      }
    }

    const isUpgrade = isPlanUpgrade(currentSubscription.plan, plan)
    const isCurrentPlan =
      currentSubscription?.plan_id === plan.id &&
      currentSubscription?.billing_cycle === billingInterval

    if (isCurrentPlan) {
      return {
        text: "Current Plan",
        icon: <Check className="h-4 w-4" />,
        variant: "outline" as const,
      }
    }

    if (currentSubscription?.plan_id === plan.id) {
      if (billingInterval === "yearly") {
        return {
          text: "Switch to Yearly",
          icon: <RefreshCw className="h-4 w-4" />,
          variant: "default" as const,
        }
      } else {
        return {
          text: "Switch to Monthly",
          icon: <RefreshCw className="h-4 w-4" />,
          variant: "outline" as const,
        }
      }
    }

    if (isUpgrade) {
      return {
        text: "Upgrade",
        icon: <ArrowUp className="h-4 w-4" />,
        variant: "default" as const,
      }
    } else {
      return {
        text: "Downgrade",
        icon: <ArrowDown className="h-4 w-4" />,
        variant: "outline" as const,
      }
    }
  }

  const formatPrice = (price: number, currency = "usd") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price / 100)
  }

  const getYearlySavings = (monthly: number, yearly: number) => {
    if (yearly === 0 || monthly === 0) return 0
    const monthlyCost = monthly * 12
    const savings = monthlyCost - yearly
    return Math.round((savings / monthlyCost) * 100)
  }

  if (loading) {
    return (
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-[400px] w-full rounded-3xl bg-muted/20 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 max-w-7xl mx-auto px-4"
    >
      {pendingDowngrade && (
        <motion.div variants={itemVariants}>
          <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900 py-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 dark:text-orange-200 text-sm">
              Downgrading to <strong>{pendingDowngrade.planName}</strong> on{" "}
              <strong>{new Date(pendingDowngrade.effectiveDate).toLocaleDateString()}</strong>.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <Tabs
        defaultValue="monthly"
        value={billingInterval}
        onValueChange={(val) => setBillingInterval(val as "monthly" | "yearly")}
        className="w-full flex flex-col items-center"
      >
        <motion.div variants={itemVariants} className="mb-6">
          <TabsList className="grid w-full grid-cols-2 w-[400px] h-10">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly" className="relative">
              Yearly
              <span className="absolute -top-3 -right-3 text-[10px] bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                -20%
              </span>
            </TabsTrigger>
          </TabsList>
        </motion.div>

        <TabsContent value="monthly" className="w-full mt-0">
          <PlanGrid
            plans={plans}
            isYearly={false}
            currentSubscription={currentSubscription}
            profile={profile}
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
            handlePlanSelect={handlePlanSelect}
            getPlanButtonInfo={getPlanButtonInfo}
            formatPrice={formatPrice}
            getYearlySavings={getYearlySavings}
          />
        </TabsContent>
        <TabsContent value="yearly" className="w-full mt-0">
          <PlanGrid
            plans={plans}
            isYearly={true}
            currentSubscription={currentSubscription}
            profile={profile}
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
            handlePlanSelect={handlePlanSelect}
            getPlanButtonInfo={getPlanButtonInfo}
            formatPrice={formatPrice}
            getYearlySavings={getYearlySavings}
          />
        </TabsContent>
      </Tabs>

      <motion.div variants={itemVariants} className="pt-4 flex justify-center">
        <Collapsible
          open={isComparisonOpen}
          onOpenChange={setIsComparisonOpen}
          className="w-full space-y-4"
        >
          <div className="flex justify-center">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-primary">
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
            <Card className="overflow-hidden border-border/50 bg-muted/10 animate-in slide-in-from-top-2 fade-in duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-primary" />
                  Feature Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Feature</th>
                        {plans.map((plan) => (
                          <th key={plan.id} className={`text-center py-3 px-4 font-semibold ${plan.is_popular ? "text-primary" : ""}`}>
                            {plan.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="space-y-4">
                      {[
                        { label: "Documents", key: "document_limit", format: (v: number) => v === -1 ? "Unlimited" : v.toLocaleString() },
                        { label: "API Calls", key: "api_calls_limit", format: (v: number) => v === -1 ? "Unlimited" : v.toLocaleString() },
                        { label: "Storage", key: "storage_limit_gb", format: (v: number) => v === -1 ? "Unlimited" : `${v} GB` },
                        { label: "Priority Support", key: "priority_support", type: "boolean" },
                        { label: "Custom Styles", key: "custom_styles", type: "boolean" },
                        { label: "Team Collab", key: "team_collaboration", type: "boolean" },
                      ].map((row, idx) => (
                        <tr key={idx} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 font-medium">{row.label}</td>
                          {plans.map((plan) => {
                            //@ts-ignore
                            const val = plan[row.key];
                            return (
                              <td key={plan.id} className="text-center py-3 px-4">
                                {row.type === "boolean" ? (
                                  val ? (
                                    <div className="flex justify-center">
                                      <Check className="h-4 w-4 text-green-500" />
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground/30">•</span>
                                  )
                                ) : (
                                  // @ts-ignore
                                  <span className="text-muted-foreground">{row.format(val)}</span>
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
      </motion.div>
    </motion.div>
  )
}

function PlanGrid({
  plans,
  isYearly,
  currentSubscription,
  profile,
  selectedPlan,
  setSelectedPlan,
  handlePlanSelect,
  getPlanButtonInfo,
  formatPrice,
  getYearlySavings,
}: any) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:gap-8">
      {plans.map((plan: any) => {
        const isCurrentPlan =
          currentSubscription?.plan_id === plan.id &&
          currentSubscription?.billing_cycle === (isYearly ? "yearly" : "monthly")
        const price = isYearly ? plan.price_yearly || 0 : plan.price_monthly || 0
        const yearlyPrice = plan.price_yearly || 0
        const monthlyPrice = plan.price_monthly || 0
        const savings =
          isYearly && yearlyPrice > 0 && monthlyPrice > 0 ? getYearlySavings(monthlyPrice, yearlyPrice) : 0

        const buttonInfo = getPlanButtonInfo(plan)
        const isShowingPayPal = selectedPlan === plan.id && !isCurrentPlan && profile?.id

        return (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`relative flex flex-col`}
          >
            <Card
              className={cn(
                "flex-1 relative overflow-hidden transition-all duration-300 border h-full flex flex-col",
                plan.is_popular
                  ? "border-primary/50 shadow-xl shadow-primary/10 z-10 scale-[1.02]"
                  : "border-border hover:border-primary/30 hover:shadow-lg",
                isCurrentPlan && "ring-2 ring-emerald-500/50 dark:ring-emerald-400/50 bg-emerald-50/10 dark:bg-emerald-950/5"
              )}
            >
              {isCurrentPlan && (
                <div className="absolute top-0 right-0 p-3">
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-100/20 gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Current
                  </Badge>
                </div>
              )}

              {plan.is_popular && !isCurrentPlan && (
                <>
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                    <Badge className="bg-primary text-primary-foreground px-2 py-0.5 shadow-lg text-[10px] font-semibold uppercase tracking-wide">
                      Most Popular
                    </Badge>
                  </div>
                </>
              )}

              <CardHeader className="text-center pt-6 pb-4">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-sm mt-1 min-h-[32px] px-2">{plan.description}</CardDescription>
                <div className="mt-4 flex items-center justify-center gap-1">
                  <span className="text-4xl font-bold tracking-tight">
                    {price === 0 ? "Free" : formatPrice(price, plan.currency)}
                  </span>
                  {price > 0 && (
                    <span className="text-muted-foreground self-end mb-1">
                      /{isYearly ? "year" : "mo"}
                    </span>
                  )}
                </div>
                {isYearly && savings > 0 && (
                  <div className="mt-1 text-xs text-green-600 font-medium bg-green-50 dark:bg-green-900/20 inline-block px-2 py-0.5 rounded-full mx-auto">
                    Save {savings}%
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-4 flex-1">
                <div className="w-full h-px bg-border/50" />
                <div className="space-y-3">
                  {Array.isArray(plan.features) &&
                    plan.features.map((feature: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                          <Check className="h-2.5 w-2.5 text-primary" />
                        </div>
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  
                  <div className="pt-2 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Documents</span>
                        <span className="font-medium">{(plan.document_limit || 0) === -1 ? "Unlimited" : (plan.document_limit || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">API Calls</span>
                        <span className="font-medium">{(plan.api_calls_limit || 0) === -1 ? "Unlimited" : (plan.api_calls_limit || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Storage</span>
                        <span className="font-medium">{(plan.storage_limit_gb || 0) === -1 ? "Unlimited" : `${plan.storage_limit_gb || 0} GB`}</span>
                      </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-0 pb-6">
                {isShowingPayPal ? (
                  <div className="w-full space-y-2">
                    <PayPalButton
                      planId={plan.id}
                      planName={plan.name}
                      billingCycle={isYearly ? "yearly" : "monthly"}
                      disabled={isCurrentPlan}
                    />
                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground h-8 text-xs" onClick={() => setSelectedPlan(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    className={cn(
                      "w-full h-9 text-sm transition-all",
                      plan.is_popular && "hover:scale-[1.02]",
                      isCurrentPlan && "bg-muted text-muted-foreground hover:bg-muted"
                    )}
                    variant={isCurrentPlan ? "outline" : buttonInfo.variant}
                    onClick={() => handlePlanSelect(plan.id)}
                    disabled={isCurrentPlan}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      {isCurrentPlan ? (
                        <>
                           <Check className="h-4 w-4" />
                           Current Plan
                        </>
                      ) : (
                        <>
                           {buttonInfo.icon}
                           {buttonInfo.text}
                        </>
                      )}
                    </div>
                  </Button>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
