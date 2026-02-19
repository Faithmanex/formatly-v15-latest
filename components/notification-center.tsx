"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, X, CheckCircle, AlertCircle, Info, AlertTriangle, ExternalLink, RefreshCw } from "lucide-react"
import { useRealtime } from "@/contexts/realtime-context"
import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Database } from "@/lib/supabase"

interface NotificationCenterProps {
  onClose: () => void
}

type Notification = Database["public"]["Tables"]["notifications"]["Row"]

export function NotificationCenter({ onClose }: NotificationCenterProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const {
    notifications,
    unreadCount,
    notificationsLoading: loading,
    notificationsError: error,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    refreshNotifications,
  } = useRealtime()

  const [activeTab, setActiveTab] = useState<"all" | "unread">("all")

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "unread") return !n.is_read
    return true
  })

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    // ... existing keyboard handlers ...
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    const handleTabKey = (event: KeyboardEvent) => {
         // ... existing tab logic ...
       if (event.key === "Tab" && containerRef.current) {
        const focusableElements = containerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement?.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement?.focus()
          }
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscapeKey)
    document.addEventListener("keydown", handleTabKey)
    // ... focus management ...
     const firstButton = containerRef.current?.querySelector("button")
    firstButton?.focus()

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscapeKey)
      document.removeEventListener("keydown", handleTabKey)
    }
  }, [onClose])

  const getIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error": return <AlertCircle className="h-4 w-4 text-red-500" />
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default: return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      await markNotificationAsRead(id)
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead()
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d`
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-transparent" onClick={onClose} />
      <div
        ref={containerRef}
        className="absolute right-0 top-12 z-50 w-80 sm:w-96 animate-in slide-in-from-top-2 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="shadow-xl border-border overflow-hidden">
          <CardHeader className="px-4 py-3 border-b bg-muted/40 block space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <Tabs defaultValue="all" value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "unread")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="unread" className="text-xs">Unread</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                    <div className="space-y-1 flex-1">
                      <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Failed to load</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => refreshNotifications()}
                  className="text-xs"
                >
                  Retry
                </Button>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <div className="bg-muted/50 p-3 rounded-full mb-3">
                  <Bell className="h-6 w-6 opacity-30" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {activeTab === "unread" ? "No Unread Notifications" : "No Notifications"}
                </p>
                <p className="text-xs mt-1 max-w-[180px]">
                  {activeTab === "unread"
                    ? "You're all caught up!"
                    : "Check back later for updates."}
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-[400px]">
                <div className="divide-y relative">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {filteredNotifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => !notification.is_read && markAsRead(notification.id)}
                        className={`
                        group relative flex gap-3 p-4 transition-colors hover:bg-muted/40 cursor-pointer
                        ${!notification.is_read ? "bg-primary/5" : "bg-background"}
                      `}
                      >
                        <div className="mt-1 flex-shrink-0">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 space-y-1 min-w-0">
                          <p
                            className={`text-sm leading-snug ${
                              !notification.is_read
                                ? "font-medium text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground/70">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            {notification.action_url && (
                              <span
                                className="text-[10px] text-primary font-medium hover:underline flex items-center gap-0.5"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.location.href = notification.action_url!
                                }}
                              >
                                View <ExternalLink className="h-2 w-2" />
                              </span>
                            )}
                          </div>
                        </div>
                        {!notification.is_read && (
                          <div
                            className="absolute right-4 top-4 h-2 w-2 rounded-full bg-primary ring-4 ring-primary/10"
                            title="Unread"
                          />
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </CardContent>
            {/* Optional footer link */}
            {/* <div className="border-t p-2 text-center bg-muted/20">
              <Button variant="link" size="sm" className="text-xs h-auto py-1 text-muted-foreground">
                 View All Notifications
              </Button>
            </div> */}
        </Card>
      </div>
    </>
  )
}
