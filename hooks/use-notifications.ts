"use client"

import { useRealtime } from "@/contexts/realtime-context"

export function useNotifications() {
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
    // This will be handled by the real-time context
    // For now, we can implement it here or move it to the context
    try {
      const { getSupabase } = await import("@/lib/supabase")
      const supabase = getSupabase()

      const response = await supabase.auth.getUser()
      if (response.data.user) {
        await supabase.from("notifications").delete().eq("user_id", response.data.user.id)
      }
    } catch (error) {
      console.error("Error clearing all notifications:", error)
    }
  }

  const addNotification = (notification: any) => {
    // This is now handled automatically by real-time subscriptions
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
    addNotification,
    refresh,
    retry,
  }
}
