"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { profileService } from "@/lib/database"
import { ProfileCacheService } from "@/lib/profile-cache"
import { LogoutHandler } from "@/lib/logout-handler"
import { ExponentialBackoff } from "@/lib/exponential-backoff"

// Export Profile interface as named export
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

interface AuthContextType {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isInitialized: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshProfile: (forceRefresh?: boolean) => Promise<void>
  getToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const profileBackoff = new ExponentialBackoff({
  initialDelay: 1000,
  maxDelay: 8000,
  maxRetries: 3,
  factor: 2,
})

const DEBUG_AUTH = false

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  const authListenerSetup = useRef(false)
  const initialLoadComplete = useRef(false)

  const loadProfile = useCallback(async (userId: string, forceRefresh = false): Promise<Profile | null> => {
    try {
      // Check cache first unless force refresh is requested
      if (!forceRefresh) {
        try {
          const cachedProfile = ProfileCacheService.getProfileCache()
          if (cachedProfile && cachedProfile.id === userId) {
            if (DEBUG_AUTH) console.log("[SERVER] Profile loaded from cache:", cachedProfile.id)
            return cachedProfile
          }
        } catch (cacheError) {
          if (DEBUG_AUTH) console.warn("Cache retrieval failed, falling back to database:", cacheError)
        }
      }

      if (DEBUG_AUTH) console.log(`[SERVER] Loading profile from Supabase for user ${userId}`)

      const userProfile = await profileBackoff.execute(
        async () => {
          const profile = await profileService.getProfileForAuth(userId)
          if (!profile) {
            throw new Error("Profile not found")
          }
          return profile
        },
        (attempt, delay, error) => {
          if (DEBUG_AUTH) console.log(`Profile load attempt ${attempt} failed, retrying in ${delay}ms:`, error.message)
        },
      )

      if (DEBUG_AUTH) console.log("[SERVER] Profile loaded from Supabase:", userProfile.id)

      // Safely cache the profile data
      try {
        ProfileCacheService.setProfileCache(userProfile)
      } catch (cacheError) {
        if (DEBUG_AUTH) console.warn("Failed to cache profile, continuing without cache:", cacheError)
      }

      return userProfile
    } catch (error) {
      console.error("Error loading profile after all retries:", error)
      return null
    }
  }, [])

  const refreshProfile = useCallback(
    async (forceRefresh = false) => {
      if (user) {
        if (DEBUG_AUTH)
          console.log("[SERVER] Refreshing profile for user:", user.id, forceRefresh ? "(force refresh)" : "")
        const userProfile = await loadProfile(user.id, forceRefresh)
        setProfile(userProfile)
        if (userProfile) {
          try {
            ProfileCacheService.setProfileCache(userProfile)
          } catch (cacheError) {
            if (DEBUG_AUTH) console.warn("Failed to update cache after refresh:", cacheError)
          }
        }
      }
    },
    [user, loadProfile],
  )

  useEffect(() => {
    if (initialLoadComplete.current) return

    try {
      const cachedProfile = ProfileCacheService.getProfileCache()
      if (cachedProfile) {
        if (DEBUG_AUTH) console.log("[SERVER] Initial profile loaded from cache:", cachedProfile.id)
        setProfile(cachedProfile)
      }
    } catch (cacheError) {
      if (DEBUG_AUTH) console.warn("Failed to load initial cache, will fetch from database:", cacheError)
    }

    initialLoadComplete.current = true
  }, [])

  useEffect(() => {
    // Prevent duplicate listener setup
    if (authListenerSetup.current) return

    if (DEBUG_AUTH) console.log("[SERVER] Setting up auth state change listener...")
    authListenerSetup.current = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (DEBUG_AUTH) console.log("[SERVER] Auth state changed:", event, session?.user?.id)

      if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user) {
          setUser(session.user)

          if (!profile || profile.id !== session.user.id) {
            setIsLoading(true)
            const userProfile = await loadProfile(session.user.id)
            setProfile(userProfile)
            setIsLoading(false)
          } else {
            setIsLoading(false)
          }
        } else {
          setUser(null)
          setProfile(null)
          setIsLoading(false)
        }
      } else if (event === "SIGNED_OUT") {
        // Clear cache on logout
        ProfileCacheService.clearProfileCache()
        setUser(null)
        setProfile(null)
        setIsLoading(false)
      }

      if (!isInitialized) {
        setIsInitialized(true)
      }
    })

    return () => {
      subscription.unsubscribe()
      authListenerSetup.current = false
    }
  }, [loadProfile, isInitialized, profile])

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setIsLoading(false)
        return { error }
      }

      return { error: null }
    } catch (error) {
      setIsLoading(false)
      return { error }
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        setIsLoading(false)
        return { error }
      }

      return { error: null }
    } catch (error) {
      setIsLoading(false)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true)
      await LogoutHandler.performSecureLogout()
    } catch (error) {
      console.error("Error signing out:", error)
      LogoutHandler.emergencyLogout()
      setIsLoading(false)
    }
  }

  const getToken = useCallback(async (): Promise<string | null> => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) {
        console.error("Error getting session:", error)
        return null
      }
      return session?.access_token || null
    } catch (error) {
      console.error("Error getting token:", error)
      return null
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      profile,
      isLoading,
      isInitialized,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      getToken,
    }),
    [user, profile, isLoading, isInitialized, refreshProfile, getToken],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
