"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import type { Database } from "@/lib/types"
import { logger } from "@/lib/logger"

const DEBUG_REALTIME = false

type Document = Database["public"]["Tables"]["documents"]["Row"]
type Notification = Database["public"]["Tables"]["notifications"]["Row"]
type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"]

interface RealtimeContextType {
  // Document real-time data
  documents: Document[]
  documentsLoading: boolean
  documentsError: string | null

  // Notification real-time data
  notifications: Notification[]
  unreadCount: number
  notificationsLoading: boolean
  notificationsError: string | null

  // Profile real-time data
  profile: Profile | null
  profileLoading: boolean
  profileError: string | null

  subscription: Subscription | null
  subscriptionLoading: boolean
  subscriptionError: string | null

  // Connection status
  isConnected: boolean
  connectionError: string | null

  // Actions
  markNotificationAsRead: (id: string) => void
  markAllNotificationsAsRead: () => void
  refreshDocuments: () => Promise<void>
  refreshNotifications: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshSubscription: () => Promise<void>
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

export function RealtimeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()

  // Document state
  const [documents, setDocuments] = useState<Document[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(true)
  const [documentsError, setDocumentsError] = useState<string | null>(null)

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const [notificationsError, setNotificationsError] = useState<string | null>(null)

  // Profile state
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)

  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const channelsRef = useRef<RealtimeChannel[]>([])
  const mountedRef = useRef(true)
  const subscriptionsSetup = useRef(false)
  const lastUserId = useRef<string | null>(null)

  const loadInitialDocuments = useCallback(async () => {
    if (!user?.id || !mountedRef.current) return

    try {
      setDocumentsError(null)
      if (DEBUG_REALTIME) logger.realtime("Loading initial documents")

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(50)

      if (error) throw error

      if (mountedRef.current) {
        setDocuments(data || [])
        if (DEBUG_REALTIME) logger.realtime("Loaded documents", { count: data?.length || 0 })
      }
    } catch (error) {
      logger.error("Error loading documents", error)
      if (mountedRef.current) {
        setDocumentsError(error instanceof Error ? error.message : "Failed to load documents")
      }
    } finally {
      if (mountedRef.current) {
        setDocumentsLoading(false)
      }
    }
  }, [user?.id])

  const loadInitialNotifications = useCallback(async () => {
    if (!user?.id || !mountedRef.current) return

    try {
      setNotificationsError(null)
      if (DEBUG_REALTIME) logger.realtime("Loading initial notifications")

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error

      if (mountedRef.current) {
        setNotifications(data || [])
        const unread = data?.filter((n) => !n.is_read).length || 0
        setUnreadCount(unread)
        if (DEBUG_REALTIME) logger.realtime("Loaded notifications", { count: data?.length || 0, unread })
      }
    } catch (error) {
      logger.error("Error loading notifications", error)
      if (mountedRef.current) {
        setNotificationsError(error instanceof Error ? error.message : "Failed to load notifications")
      }
    } finally {
      if (mountedRef.current) {
        setNotificationsLoading(false)
      }
    }
  }, [user?.id])

  const loadInitialProfile = useCallback(async () => {
    if (!user?.id || !mountedRef.current) return

    try {
      setProfileError(null)
      if (DEBUG_REALTIME) logger.realtime("Loading initial profile")

      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error) throw error

      if (mountedRef.current) {
        setProfile(data)
        if (DEBUG_REALTIME) logger.realtime("Loaded profile")
      }
    } catch (error) {
      logger.error("Error loading profile", error)
      if (mountedRef.current) {
        setProfileError(error instanceof Error ? error.message : "Failed to load profile")
      }
    } finally {
      if (mountedRef.current) {
        setProfileLoading(false)
      }
    }
  }, [user?.id])

  const loadInitialSubscription = useCallback(async () => {
    if (!user?.id || !mountedRef.current) return

    try {
      setSubscriptionError(null)
      if (DEBUG_REALTIME) logger.realtime("Loading initial subscription")

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error

      if (mountedRef.current) {
        setSubscription(data)
        if (DEBUG_REALTIME) logger.realtime("Loaded subscription", { subscriptionId: data?.id || "none" })
      }
    } catch (error) {
      logger.error("Error loading subscription", error)
      if (mountedRef.current) {
        setSubscriptionError(error instanceof Error ? error.message : "Failed to load subscription")
      }
    } finally {
      if (mountedRef.current) {
        setSubscriptionLoading(false)
      }
    }
  }, [user?.id])

  const handleSubscriptionChange = useCallback((subscription: Subscription | null) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("subscription-changed", { detail: subscription }))
    }
  }, [])

  const setupRealtimeSubscriptions = useCallback(() => {
    if (!user?.id) return

    if (subscriptionsSetup.current && lastUserId.current === user.id) {
      if (DEBUG_REALTIME) logger.realtime("Real-time subscriptions already set up for this user")
      return
    }

    if (DEBUG_REALTIME) logger.realtime("Setting up real-time subscriptions")
    setConnectionError(null)

    const documentsChannel = supabase
      .channel(`documents-changes-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documents",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: RealtimePostgresChangesPayload<Document>) => {
          if (DEBUG_REALTIME)
            logger.realtime("Document change", {
              event: payload.eventType,
              filename: payload.new?.filename || payload.old?.filename,
            })

          if (payload.eventType === "INSERT" && payload.new) {
            setDocuments((prev) => [payload.new as Document, ...prev])
          } else if (payload.eventType === "UPDATE" && payload.new) {
            setDocuments((prev) => prev.map((doc) => (doc.id === payload.new!.id ? (payload.new as Document) : doc)))
          } else if (payload.eventType === "DELETE" && payload.old) {
            setDocuments((prev) => prev.filter((doc) => doc.id !== payload.old!.id))
          }
        },
      )
      .subscribe((status) => {
        if (DEBUG_REALTIME) logger.realtime("Documents subscription status", { status })
        if (status === "SUBSCRIBED") {
          setIsConnected(true)
        } else if (status === "CHANNEL_ERROR") {
          setConnectionError("Failed to connect to documents channel")
          setIsConnected(false)
        }
      })

    const notificationsChannel = supabase
      .channel(`notifications-changes-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: RealtimePostgresChangesPayload<Notification>) => {
          if (DEBUG_REALTIME)
            logger.realtime("Notification change", {
              event: payload.eventType,
              title: payload.new?.title || payload.old?.title,
            })

          if (payload.eventType === "INSERT" && payload.new) {
            setNotifications((prev) => [payload.new as Notification, ...prev])
            if (!payload.new.is_read) {
              setUnreadCount((prev) => prev + 1)
            }
          } else if (payload.eventType === "UPDATE" && payload.new) {
            setNotifications((prev) =>
              prev.map((notif) => (notif.id === payload.new!.id ? (payload.new as Notification) : notif)),
            )
            setNotifications((current) => {
              const unread = current
                .map((n) => (n.id === payload.new!.id ? (payload.new as Notification) : n))
                .filter((n) => !n.is_read).length
              setUnreadCount(unread)
              return current
            })
          } else if (payload.eventType === "DELETE" && payload.old) {
            setNotifications((prev) => {
              const filtered = prev.filter((notif) => notif.id !== payload.old!.id)
              const unread = filtered.filter((n) => !n.is_read).length
              setUnreadCount(unread)
              return filtered
            })
          }
        },
      )
      .subscribe((status) => {
        if (DEBUG_REALTIME) logger.realtime("Notifications subscription status", { status })
        if (status === "CHANNEL_ERROR") {
          setConnectionError("Failed to connect to notifications channel")
        }
      })

    const profileChannel = supabase
      .channel(`profile-changes-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload: RealtimePostgresChangesPayload<Profile>) => {
          if (DEBUG_REALTIME) logger.realtime("Profile change", { event: payload.eventType })
          if (payload.new) {
            setProfile(payload.new as Profile)
          }
        },
      )
      .subscribe((status) => {
        if (DEBUG_REALTIME) logger.realtime("Profile subscription status", { status })
        if (status === "CHANNEL_ERROR") {
          setConnectionError("Failed to connect to profile channel")
        }
      })

    const subscriptionChannel = supabase
      .channel(`subscription-changes-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: RealtimePostgresChangesPayload<Subscription>) => {
          if (DEBUG_REALTIME)
            logger.realtime("Subscription change", {
              event: payload.eventType,
              status: payload.new?.status || payload.old?.status,
            })

          if (payload.eventType === "INSERT" && payload.new) {
            const newSub = payload.new as Subscription
            if (newSub.status === "active") {
              setSubscription(newSub)
              handleSubscriptionChange(newSub)
            }
          } else if (payload.eventType === "UPDATE" && payload.new) {
            const updatedSub = payload.new as Subscription
            setSubscription(updatedSub)
            handleSubscriptionChange(updatedSub)
          } else if (payload.eventType === "DELETE" && payload.old) {
            setSubscription(null)
            handleSubscriptionChange(null)
          }
        },
      )
      .subscribe((status) => {
        if (DEBUG_REALTIME) logger.realtime("Subscription subscription status", { status })
        if (status === "CHANNEL_ERROR") {
          setConnectionError("Failed to connect to subscription channel")
        }
      })

    channelsRef.current = [documentsChannel, notificationsChannel, profileChannel, subscriptionChannel]
    subscriptionsSetup.current = true
    lastUserId.current = user.id

    if (DEBUG_REALTIME) logger.realtime("Real-time subscriptions setup complete")

    const checkConnection = () => {
      const allConnected = channelsRef.current.every((channel) => channel.state === "joined")
      setIsConnected(allConnected)
      if (!allConnected) {
        logger.warn("Some real-time channels are not connected")
      }
    }

    const connectionInterval = setInterval(checkConnection, 5000)

    return () => {
      clearInterval(connectionInterval)
    }
  }, [user?.id, handleSubscriptionChange])

  const cleanupSubscriptions = useCallback(() => {
    if (DEBUG_REALTIME) logger.realtime("Cleaning up real-time subscriptions")
    channelsRef.current.forEach((channel) => {
      supabase.removeChannel(channel)
    })
    channelsRef.current = []
    subscriptionsSetup.current = false
    lastUserId.current = null
    setIsConnected(false)
  }, [])

  useEffect(() => {
    if (user?.id && user.id !== lastUserId.current) {
      // Load initial data quickly
      Promise.all([
        loadInitialDocuments(),
        loadInitialNotifications(),
        loadInitialProfile(),
        loadInitialSubscription(),
      ]).then(() => {
        // Then setup real-time subscriptions
        const cleanup = setupRealtimeSubscriptions()
        return cleanup
      })
    } else if (!user?.id) {
      // Reset state when user logs out
      setDocuments([])
      setNotifications([])
      setProfile(null)
      setSubscription(null)
      setUnreadCount(0)
      setDocumentsLoading(true)
      setNotificationsLoading(true)
      setProfileLoading(true)
      setSubscriptionLoading(true)
      setIsConnected(false)
      setConnectionError(null)
      cleanupSubscriptions()
    }

    return cleanupSubscriptions
  }, [
    user?.id,
    loadInitialDocuments,
    loadInitialNotifications,
    loadInitialProfile,
    loadInitialSubscription,
    setupRealtimeSubscriptions,
    cleanupSubscriptions,
  ])

  useEffect(() => {
    return () => {
      mountedRef.current = false
      cleanupSubscriptions()
    }
  }, [cleanupSubscriptions])

  const markNotificationAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id)

      if (error) throw error
      // Real-time subscription will handle the state update
    } catch (error) {
      logger.error("Error marking notification as read", error)
    }
  }, [])

  const markAllNotificationsAsRead = useCallback(async () => {
    if (!user?.id) return

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false)

      if (error) throw error
      // Real-time subscription will handle the state update
    } catch (error) {
      logger.error("Error marking all notifications as read", error)
    }
  }, [user?.id])

  const refreshDocuments = useCallback(async () => {
    setDocumentsLoading(true)
    await loadInitialDocuments()
  }, [loadInitialDocuments])

  const refreshNotifications = useCallback(async () => {
    setNotificationsLoading(true)
    await loadInitialNotifications()
  }, [loadInitialNotifications])

  const refreshProfile = useCallback(async () => {
    setProfileLoading(true)
    await loadInitialProfile()
  }, [loadInitialProfile])

  const refreshSubscription = useCallback(async () => {
    setSubscriptionLoading(true)
    await loadInitialSubscription()
  }, [loadInitialSubscription])

  const value: RealtimeContextType = {
    documents,
    documentsLoading,
    documentsError,
    notifications,
    unreadCount,
    notificationsLoading,
    notificationsError,
    profile,
    profileLoading,
    profileError,
    subscription,
    subscriptionLoading,
    subscriptionError,
    isConnected,
    connectionError,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    refreshDocuments,
    refreshNotifications,
    refreshProfile,
    refreshSubscription,
  }

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error("useRealtime must be used within a RealtimeProvider")
  }
  return context
}
