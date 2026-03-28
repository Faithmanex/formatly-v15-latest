"use client"

import { useRealtime } from "@/contexts/realtime-context"
import { useAuth } from "@/components/auth-provider"
import { getSupabase } from "@/lib/supabase"

export function useNotifications() {
  const { user } = useAuth()
  const {
    notifications,
    unreadCount,
    notificationsLoading: loading,
    notificationsError: error,
    markNotificationAsRead: markAsRead,
    markAllNotificationsAsRead: markAllAsRead,
    refreshNotifications: refresh,
  } = useRealtime()

  const clearAll = async () => {
    if (!user) return

    try {
      const supabase = getSupabase()
      const { error } = await supabase.from("notifications").delete().eq("user_id", user.id)
      if (error) throw error
    } catch (error) {
      console.error("Error clearing all notifications:", error)
    }
  }

  const retry = () => {
    refresh()
  }

  return {
    notifications,
    loading,
    unreadCount,
    error,
    markAsRead,
    markAllAsRead,
    clearAll,
    refresh,
    retry,
  }
}
