"use client"

import { useState, useEffect, useCallback } from "react"
import { ProfileCacheService } from "@/lib/profile-cache"
import { useAuth } from "@/components/auth-provider"

interface CacheStatus {
  exists: boolean
  valid: boolean
  expiresAt?: number
  age?: number
  timeUntilExpiry?: number
}

export function useProfileCache() {
  const { user, refreshProfile } = useAuth()
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
    exists: false,
    valid: false,
  })

  const updateCacheStatus = useCallback(() => {
    const info = ProfileCacheService.getCacheInfo()
    const status: CacheStatus = {
      exists: info.exists,
      valid: info.valid,
      expiresAt: info.expiresAt,
      age: info.age,
      timeUntilExpiry: info.expiresAt ? info.expiresAt - Date.now() : undefined,
    }
    setCacheStatus(status)
  }, [])

  // Update cache status periodically
  useEffect(() => {
    updateCacheStatus()

    // Check cache status every 30 seconds
    const interval = setInterval(updateCacheStatus, 30000)

    return () => clearInterval(interval)
  }, [updateCacheStatus])

  // Validate cache when user changes
  useEffect(() => {
    if (user) {
      updateCacheStatus()
    }
  }, [user, updateCacheStatus])

  const forceRefresh = useCallback(async () => {
    console.log("Force refreshing profile cache")
    ProfileCacheService.forceRefresh()
    await refreshProfile(true)
    updateCacheStatus()
  }, [refreshProfile, updateCacheStatus])

  const clearCache = useCallback(() => {
    console.log("Manually clearing profile cache")
    ProfileCacheService.clearProfileCache()
    updateCacheStatus()
  }, [updateCacheStatus])

  const validateCache = useCallback(() => {
    const isValid = ProfileCacheService.isCacheValid()
    updateCacheStatus()
    return isValid
  }, [updateCacheStatus])

  return {
    cacheStatus,
    forceRefresh,
    clearCache,
    validateCache,
    updateCacheStatus,
  }
}
