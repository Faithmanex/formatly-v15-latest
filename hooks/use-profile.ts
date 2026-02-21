"use client"

import { useCallback } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRealtimeData } from "./use-realtime-data"
import { profileService } from "@/lib/database"
import { useCacheStorage } from "./use-cache-storage"

export interface Profile {
  id: string
  email: string
  full_name: string
  role: string
  document_limit: number
  documents_used: number
  formatting_preferences?: any
  created_at: string
  updated_at: string
}

export function useProfile() {
  const { user } = useAuth()
  const { clearCache } = useCacheStorage()

  const {
    data: profile,
    isLoading,
    error,
    isStale,
    lastUpdated,
    refresh,
  } = useRealtimeData<Profile>({
    table: "profiles",
    select: "*",
    filter: user?.id ? { column: "id", value: user.id } : undefined,
    cacheKey: `profile_${user?.id || "anonymous"}`,
    cacheTTL: 10 * 60 * 1000, // 10 minutes for profile data
    retryAttempts: 3,
    retryDelay: 1000,
    onError: (error) => {
      console.error("[v0] Profile fetch error:", error)
    },
    onSuccess: (data) => {},
  })

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!user?.id || !profile) return null

      try {

        const optimisticProfile = { ...profile, ...updates }

        // Update the actual profile
        const updatedProfile = await profileService.updateProfile(user.id, updates)

        if (updatedProfile) {
          clearCache(`profile_${user.id}`)
          refresh()
          return updatedProfile
        }

        return null
      } catch (error) {
        console.error("[v0] Error updating profile:", error)
        refresh()
        throw error
      }
    },
    [user?.id, profile, clearCache, refresh],
  )

  return {
    profile: profile?.[0] || null, // Supabase returns array, get first item
    isLoading: !user?.id ? false : isLoading,
    error,
    isStale,
    lastUpdated,
    refresh,
    updateProfile,
  }
}
