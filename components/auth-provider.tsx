"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { profileService } from "@/lib/database"
import { LogoutHandler } from "@/lib/logout-handler"
import useSWR, { mutate as globalMutate } from "swr"

export interface Profile {
  id: string
  email: string
  full_name: string | null
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

async function fetchProfile(userId: string): Promise<Profile> {
  const profile = await profileService.getProfileForAuth(userId)
  if (!profile) throw new Error("Profile not found")
  return profile
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const profileKey = user?.id ? ["profile", user.id] : null

  const {
    data: profile,
    isLoading: profileLoading,
    mutate: mutateProfile,
  } = useSWR<Profile | null>(profileKey, ([, userId]: [string, string]) => fetchProfile(userId), {
    revalidateOnFocus: false,
    shouldRetryOnError: true,
    errorRetryCount: 3,
    onErrorRetry: (_, __, ___, revalidate, { retryCount }) => {
      if (retryCount >= 3) return
      setTimeout(() => revalidate({ retryCount }), Math.min(1000 * 2 ** retryCount, 8000))
    },
  })

  useEffect(() => {
    if (!supabase) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED"
      ) {
        setUser(session?.user ?? null)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        // Clear all SWR cache on logout
        globalMutate(() => true, undefined, { revalidate: false })
      }

      setIsInitialized(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const isLoading = !isInitialized || (!!user && profileLoading && profile === undefined)

  const refreshProfile = useCallback(
    async (_forceRefresh?: boolean) => {
      await mutateProfile()
    },
    [mutateProfile],
  )

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: new Error("Supabase client not initialized") }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ?? null }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!supabase) return { error: new Error("Supabase client not initialized") }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    return { error: error ?? null }
  }

  const signOut = async () => {
    try {
      if (!supabase) throw new Error("Supabase client not initialized")
      await LogoutHandler.performSecureLogout()
    } catch (error) {
      console.error("Error signing out:", error)
      LogoutHandler.emergencyLogout()
    }
  }

  const getToken = useCallback(async (): Promise<string | null> => {
    try {
      if (!supabase) return null
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) return null
      return session?.access_token ?? null
    } catch {
      return null
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      profile: profile ?? null,
      isLoading,
      isInitialized,
      signIn,
      signOut,
      signUp,
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

