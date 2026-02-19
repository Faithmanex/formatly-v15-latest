"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react"
import { useAuth } from "@/components/auth-provider"
import {
  getUserSubscription,
  getUserUsageStats,
  checkUsageLimits,
  getSubscriptionPlans,
  getSubscriptionStatusWithPending,
} from "@/lib/billing"
import type { Subscription, UsageStats, SubscriptionPlan, SubscriptionStatusWithPending } from "@/lib/billing"

interface PlanSpecificUsage {
  documents_processed: number
  api_calls_made: number
  storage_used_gb: number
  document_limit: number
  api_calls_limit: number
  storage_limit_gb: number
  plan_name: string
  current_period_start: string
  current_period_end: string
  usage_percentage: number
}

interface SubscriptionContextType {
  subscription: Subscription | null
  subscriptionWithPending: SubscriptionStatusWithPending | null
  usage: UsageStats | null
  planUsage: PlanSpecificUsage | null // Updated to match new structure
  plans: SubscriptionPlan[]
  limits: {
    documentsAtLimit: boolean
    apiCallsAtLimit: boolean
    storageAtLimit: boolean
    currentUsage?: {
      documents_used: number
      document_limit: number
      plan_name: string
      api_calls_made: number
      api_calls_limit: number
      storage_used_gb: number
      storage_limit_gb: number
      usage_percentage: number
    }
  } | null

  // Loading states
  isLoading: boolean
  isInitialized: boolean

  // Actions
  refreshSubscription: (forceRefresh?: boolean) => Promise<void>
  refreshUsage: () => Promise<void>
  refreshAll: () => Promise<void>

  // Computed values
  isSubscribed: boolean
  isPremium: boolean
  planName: string
  subscriptionStatus: string
  nextBillingDate: string | null
  monthlyPrice: number
  canUpgrade: boolean

  hasPendingPlanChange: boolean
  pendingPlan: {
    name: string
    effectiveDate: string
    changeReason: string
  } | null
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, isInitialized: authInitialized } = useAuth()

  // State
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [subscriptionWithPending, setSubscriptionWithPending] = useState<SubscriptionStatusWithPending | null>(null)
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [planUsage, setPlanUsage] = useState<PlanSpecificUsage | null>(null) // Updated state type
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [limits, setLimits] = useState<{
    documentsAtLimit: boolean
    apiCallsAtLimit: boolean
    storageAtLimit: boolean
    currentUsage?: {
      documents_used: number
      document_limit: number
      plan_name: string
      api_calls_made: number
      api_calls_limit: number
      storage_used_gb: number
      storage_limit_gb: number
      usage_percentage: number
    }
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  const initialLoadComplete = useRef(false)
  const lastLoadedUserId = useRef<string | null>(null)

  const DEBUG_SUBSCRIPTION = false // Added debug flag to control logging

  // Load subscription data
  const loadSubscriptionData = useCallback(async (userId: string, forceRefresh = false) => {
    try {
      if (DEBUG_SUBSCRIPTION) console.log(`[SERVER] Loading subscription data for user ${userId}`)

      // Optimization: Fetch usage stats first to avoid redundant call in checkUsageLimits
      let usageStats: UsageStats | undefined
      try {
        usageStats = await getUserUsageStats(userId)
      } catch (e) {
        console.error("Error fetching usage stats directly:", e)
      }

      const [subscriptionData, subscriptionWithPendingData, limitsData, plansData] =
        await Promise.allSettled([
          getUserSubscription(userId),
          getSubscriptionStatusWithPending(userId),
          checkUsageLimits(userId, usageStats),
          plans.length === 0 || forceRefresh ? getSubscriptionPlans(forceRefresh) : Promise.resolve(plans),
        ])

      setSubscription(subscriptionData.status === "fulfilled" ? subscriptionData.value : null)
      setSubscriptionWithPending(
        subscriptionWithPendingData.status === "fulfilled" ? subscriptionWithPendingData.value : null,
      )

      // Use usageStats if it was pre-fetched, otherwise try to get it from limitsData
      const finalUsageStats = usageStats || (limitsData.status === "fulfilled" ? limitsData.value?.currentUsage : null)
      
      setUsage(finalUsageStats as UsageStats | null)

      if (usageStats) {
        setPlanUsage({
          documents_processed: usageStats.documents_processed,
          api_calls_made: usageStats.api_calls_made,
          storage_used_gb: usageStats.storage_used_gb,
          document_limit: usageStats.document_limit,
          api_calls_limit: usageStats.api_calls_limit,
          storage_limit_gb: usageStats.storage_limit_gb,
          plan_name: usageStats.plan_name,
          current_period_start: usageStats.current_period_start,
          current_period_end: usageStats.current_period_end,
          usage_percentage: usageStats.usage_percentage,
        })
      } else {
        setPlanUsage(null)
      }

      setLimits(limitsData.status === "fulfilled" ? limitsData.value : null)
      setPlans(plansData.status === "fulfilled" ? plansData.value : [])

      if (DEBUG_SUBSCRIPTION) {
        console.log("[SERVER] Subscription data loaded:", {
          subscription:
            subscriptionData.status === "fulfilled" ? subscriptionData.value?.plan?.name || "Free" : "error",
          status: subscriptionData.status === "fulfilled" ? subscriptionData.value?.status || "none" : "error",
        })
      }
    } catch (error) {
      console.error("Error loading subscription data:", error)
      // Set default values on error
      setSubscription(null)
      setSubscriptionWithPending(null)
      setUsage(null)
      setPlanUsage(null)
      setLimits(null)
      setPlans([])
    }
  }, [])

  // Refresh functions
  const refreshSubscription = useCallback(
    async (forceRefresh = false) => {
      if (user?.id) {
        setIsLoading(true)
        await loadSubscriptionData(user.id, forceRefresh)
        setIsLoading(false)
      }
    },
    [user, loadSubscriptionData],
  )

  const refreshUsage = useCallback(async () => {
    if (user?.id) {
      try {
        const usageStats = await getUserUsageStats(user.id)
        const limitsData = await checkUsageLimits(user.id, usageStats)

        setUsage(usageStats)
        setLimits(limitsData)

        if (usageStats) {
          setPlanUsage({
            documents_processed: usageStats.documents_processed,
            api_calls_made: usageStats.api_calls_made,
            storage_used_gb: usageStats.storage_used_gb,
            document_limit: usageStats.document_limit,
            api_calls_limit: usageStats.api_calls_limit,
            storage_limit_gb: usageStats.storage_limit_gb,
            plan_name: usageStats.plan_name,
            current_period_start: usageStats.current_period_start,
            current_period_end: usageStats.current_period_end,
            usage_percentage: usageStats.usage_percentage,
          })
        } else {
          setPlanUsage(null)
        }
      } catch (error) {
        console.error("Error refreshing usage:", error)
      }
    }
  }, [user])

  const refreshAll = useCallback(async () => {
    if (user?.id) {
      setIsLoading(true)
      await loadSubscriptionData(user.id, true)
      setIsLoading(false)
    }
  }, [user, loadSubscriptionData])

  useEffect(() => {
    if (authInitialized && user?.id) {
      // This ensures fresh data is loaded on page refresh
      if (DEBUG_SUBSCRIPTION) console.log("[SERVER] Loading subscription data for authenticated user:", user.id)
      setIsLoading(true)
      loadSubscriptionData(user.id).finally(() => {
        setIsLoading(false)
        setIsInitialized(true)
        initialLoadComplete.current = true
        lastLoadedUserId.current = user.id
      })
    } else if (authInitialized && !user) {
      // Clear data when user logs out
      if (DEBUG_SUBSCRIPTION) console.log("[SERVER] Clearing subscription data for logged out user")
      setSubscription(null)
      setSubscriptionWithPending(null)
      setUsage(null)
      setPlanUsage(null)
      setLimits(null)
      setPlans([])
      setIsLoading(false)
      setIsInitialized(true)
      initialLoadComplete.current = false
      lastLoadedUserId.current = null
    }
  }, [authInitialized, user?.id, loadSubscriptionData])

  useEffect(() => {
    const handleSubscriptionChange = () => {
      if (user?.id) {
        if (DEBUG_SUBSCRIPTION) console.log("🔄 Subscription changed, refreshing subscription data...")
        refreshAll()
      }
    }

    window.addEventListener("subscription-changed", handleSubscriptionChange)
    return () => {
      window.removeEventListener("subscription-changed", handleSubscriptionChange)
    }
  }, [user, refreshAll])

  // Computed values
  const isSubscribed = useMemo(
    () => subscription?.status === "active" || subscription?.status === "trialing",
    [subscription],
  )
  const isPremium = useMemo(() => isSubscribed && subscription?.plan?.name !== "Free", [isSubscribed, subscription])
  const planName = useMemo(() => subscription?.plan?.name || "Free", [subscription])
  const subscriptionStatus = useMemo(() => subscription?.status || "none", [subscription])
  const nextBillingDate = useMemo(() => subscription?.current_period_end || null, [subscription])
  const monthlyPrice = useMemo(() => {
    return subscription?.plan
      ? subscription.billing_cycle === "yearly"
        ? Math.round(subscription.plan.price_yearly / 12)
        : subscription.plan.price_monthly
      : 0
  }, [subscription])
  const canUpgrade = useMemo(() => {
    return (
      !isPremium || (subscription?.plan && plans.some((plan) => plan.price_monthly > subscription.plan!.price_monthly)) || false
    )
  }, [isPremium, subscription, plans])

  const hasPendingPlanChange = useMemo(() => !!subscriptionWithPending?.pending_plan, [subscriptionWithPending])
  const pendingPlan = useMemo(() => {
    return subscriptionWithPending?.pending_plan
      ? {
          name: subscriptionWithPending.pending_plan.name,
          effectiveDate: subscriptionWithPending.pending_plan.effective_date,
          changeReason: subscriptionWithPending.pending_plan.change_reason,
        }
      : null
  }, [subscriptionWithPending])

  const value: SubscriptionContextType = useMemo(
    () => ({
      subscription,
      subscriptionWithPending,
      usage,
      planUsage,
      plans,
      limits,
      isLoading,
      isInitialized,
      refreshSubscription,
      refreshUsage,
      refreshAll,
      isSubscribed,
      isPremium,
      planName,
      subscriptionStatus,
      nextBillingDate,
      monthlyPrice,
      canUpgrade,
      hasPendingPlanChange,
      pendingPlan,
    }),
    [
      subscription,
      subscriptionWithPending,
      usage,
      planUsage,
      plans,
      limits,
      isLoading,
      isInitialized,
      refreshSubscription,
      refreshUsage,
      refreshAll,
      isSubscribed,
      isPremium,
      planName,
      subscriptionStatus,
      nextBillingDate,
      monthlyPrice,
      canUpgrade,
      hasPendingPlanChange,
      pendingPlan,
    ],
  )

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider")
  }
  return context
}

// Convenience hooks for common subscription checks
export function useSubscriptionStatus() {
  const { isSubscribed, isPremium, planName, subscriptionStatus, hasPendingPlanChange, pendingPlan } = useSubscription()
  return { isSubscribed, isPremium, planName, subscriptionStatus, hasPendingPlanChange, pendingPlan }
}

export function useUsageLimits() {
  const { usage, limits, subscription, planUsage } = useSubscription()
  return { usage, limits, subscription, planUsage }
}

export function useBillingInfo() {
  const { subscription, nextBillingDate, monthlyPrice, canUpgrade, hasPendingPlanChange, pendingPlan } =
    useSubscription()
  return { subscription, nextBillingDate, monthlyPrice, canUpgrade, hasPendingPlanChange, pendingPlan }
}

export function usePlanUsage() {
  const { planUsage, isLoading } = useSubscription()
  return { planUsage, isLoading }
}
