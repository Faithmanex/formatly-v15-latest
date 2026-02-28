"use client"

import type React from "react"
import { createContext, useContext, useEffect, useCallback, useMemo } from "react"
import useSWR from "swr"
import { useAuth } from "@/components/auth-provider"
import {
  getUserSubscription,
  getUserUsageStats,
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
  planUsage: PlanSpecificUsage | null
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
  isLoading: boolean
  isInitialized: boolean
  refreshSubscription: (forceRefresh?: boolean) => Promise<void>
  refreshUsage: () => Promise<void>
  refreshAll: () => Promise<void>
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

const SWR_OPTS = {
  revalidateOnFocus: true,
  shouldRetryOnError: true,
  errorRetryCount: 2,
  dedupingInterval: 30_000,
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user, isInitialized: authInitialized } = useAuth()
  const userId = user?.id ?? null
  const key = authInitialized && userId ? userId : null

  const { data: subscription, isLoading: subLoading, mutate: mutateSubscription } = useSWR<Subscription | null>(
    key ? ["subscription", key] : null,
    ([, id]: [string, string]) => getUserSubscription(id),
    SWR_OPTS,
  )

  const { data: subscriptionWithPending, mutate: mutatePending } = useSWR<SubscriptionStatusWithPending | null>(
    key ? ["subscriptionPending", key] : null,
    ([, id]: [string, string]) => getSubscriptionStatusWithPending(id),
    SWR_OPTS,
  )

  const { data: usage, isLoading: usageLoading, mutate: mutateUsage } = useSWR<UsageStats>(
    key ? ["usage", key] : null,
    ([, id]: [string, string]) => getUserUsageStats(id),
    SWR_OPTS,
  )

  const { data: plans = [], mutate: mutatePlans } = useSWR<SubscriptionPlan[]>(
    "plans",
    () => getSubscriptionPlans(),
    { ...SWR_OPTS, revalidateOnFocus: false, dedupingInterval: 10 * 60 * 1000 },
  )

  const isLoading = authInitialized && !!userId && (subLoading || usageLoading)
  const isInitialized = authInitialized && (!userId || (!subLoading && !usageLoading))

  // Derive planUsage and limits directly from usage — no extra network call
  const planUsage: PlanSpecificUsage | null = usage
    ? {
        documents_processed: usage.documents_processed,
        api_calls_made: usage.api_calls_made,
        storage_used_gb: usage.storage_used_gb,
        document_limit: usage.document_limit,
        api_calls_limit: usage.api_calls_limit,
        storage_limit_gb: usage.storage_limit_gb,
        plan_name: usage.plan_name,
        current_period_start: usage.current_period_start,
        current_period_end: usage.current_period_end,
        usage_percentage: usage.usage_percentage,
      }
    : null

  const limits = usage
    ? {
        documentsAtLimit: usage.documents_processed >= usage.document_limit,
        apiCallsAtLimit: usage.api_calls_made >= usage.api_calls_limit,
        storageAtLimit: usage.storage_used_gb >= usage.storage_limit_gb,
        currentUsage: {
          documents_used: usage.documents_processed,
          document_limit: usage.document_limit,
          plan_name: usage.plan_name,
          api_calls_made: usage.api_calls_made,
          api_calls_limit: usage.api_calls_limit,
          storage_used_gb: usage.storage_used_gb,
          storage_limit_gb: usage.storage_limit_gb,
          usage_percentage: usage.usage_percentage,
        },
      }
    : null

  const refreshSubscription = useCallback(async (_forceRefresh?: boolean) => {
    await Promise.all([mutateSubscription(), mutatePending()])
  }, [mutateSubscription, mutatePending])

  const refreshUsage = useCallback(async () => {
    await mutateUsage()
  }, [mutateUsage])

  const refreshAll = useCallback(async () => {
    await Promise.all([mutateSubscription(), mutatePending(), mutateUsage(), mutatePlans()])
  }, [mutateSubscription, mutatePending, mutateUsage, mutatePlans])

  useEffect(() => {
    const handleSubscriptionChange = () => { if (userId) refreshAll() }
    window.addEventListener("subscription-changed", handleSubscriptionChange)
    return () => window.removeEventListener("subscription-changed", handleSubscriptionChange)
  }, [userId, refreshAll])

  const isSubscribed = subscription?.status === "active" || subscription?.status === "trialing"
  const isPremium = isSubscribed && subscription?.plan?.name !== "Free"
  const planName = subscription?.plan?.name ?? "Free"
  const subscriptionStatus = subscription?.status ?? "none"
  const nextBillingDate = subscription?.current_period_end ?? null
  const monthlyPrice = subscription?.plan
    ? subscription.billing_cycle === "yearly"
      ? Math.round(subscription.plan.price_yearly / 12)
      : subscription.plan.price_monthly
    : 0
  const canUpgrade =
    !isPremium ||
    (subscription?.plan && plans.some((p) => p.price_monthly > subscription.plan!.price_monthly)) ||
    false
  const hasPendingPlanChange = !!subscriptionWithPending?.pending_plan
  const pendingPlan = subscriptionWithPending?.pending_plan
    ? {
        name: subscriptionWithPending.pending_plan.name,
        effectiveDate: subscriptionWithPending.pending_plan.effective_date,
        changeReason: subscriptionWithPending.pending_plan.change_reason,
      }
    : null

  const value = useMemo(
    () => ({
      subscription: subscription ?? null,
      subscriptionWithPending: subscriptionWithPending ?? null,
      usage: usage ?? null,
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
      subscription, subscriptionWithPending, usage, planUsage, plans, limits,
      isLoading, isInitialized, refreshSubscription, refreshUsage, refreshAll,
      isSubscribed, isPremium, planName, subscriptionStatus, nextBillingDate,
      monthlyPrice, canUpgrade, hasPendingPlanChange, pendingPlan,
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
