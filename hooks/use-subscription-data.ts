"use client"

import { useCallback } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRealtimeData } from "./use-realtime-data"
import { getUserSubscription, getUserUsageStats, checkUsageLimits } from "@/lib/billing"
import { useCacheStorage } from "./use-cache-storage"

export interface SubscriptionData {
  subscription: any
  usage: any
  limits: any
}

export function useSubscriptionData() {
  const { user } = useAuth()
  const { getCache, setCache, clearCache } = useCacheStorage()

  const {
    data: subscriptionData,
    isLoading,
    error,
    isStale,
    lastUpdated,
    refresh,
  } = useRealtimeData<SubscriptionData>({
    table: "user_subscriptions",
    select: "*",
    filter: user?.id ? { column: "user_id", value: user.id } : undefined,
    cacheKey: `subscription_${user?.id || "anonymous"}`,
    cacheTTL: 3 * 60 * 1000, // 3 minutes for subscription data
    retryAttempts: 3,
    retryDelay: 1500,
    onError: (error) => {
      console.error("[v0] Subscription fetch error:", error)
    },
    onSuccess: (data) => {
      console.log("[v0] Subscription data loaded successfully")
    },
  })

  const loadFullSubscriptionData = useCallback(async () => {
    if (!user?.id) return null

    const cacheKey = `full_subscription_${user.id}`
    const cached = getCache<SubscriptionData>(cacheKey)

    if (cached) {
      console.log("[v0] Using cached full subscription data")
      return cached
    }

    try {
      console.log("[v0] Loading full subscription data from API")

      const [subscription, usage, limits] = await Promise.allSettled([
        getUserSubscription(user.id),
        getUserUsageStats(user.id),
        checkUsageLimits(user.id),
      ])

      const fullData: SubscriptionData = {
        subscription: subscription.status === "fulfilled" ? subscription.value : null,
        usage: usage.status === "fulfilled" ? usage.value : null,
        limits: limits.status === "fulfilled" ? limits.value : null,
      }

      setCache(cacheKey, fullData, { ttl: 3 * 60 * 1000 })

      return fullData
    } catch (error) {
      console.error("[v0] Error loading full subscription data:", error)
      return null
    }
  }, [user?.id, getCache, setCache])

  const refreshAll = useCallback(async () => {
    if (!user?.id) return

    console.log("[v0] Refreshing all subscription data")

    // Clear all subscription caches
    clearCache(`subscription_${user.id}`)
    clearCache(`full_subscription_${user.id}`)

    // Trigger refresh
    refresh()
    await loadFullSubscriptionData()
  }, [user?.id, clearCache, refresh, loadFullSubscriptionData])

  return {
    subscriptionData: subscriptionData?.[0] || null,
    isLoading: !user?.id ? false : isLoading,
    error,
    isStale,
    lastUpdated,
    refresh,
    refreshAll,
    loadFullSubscriptionData,
  }
}
