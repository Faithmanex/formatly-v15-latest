"use client"

import { Bell, Upload, User, Settings, LogOut, CreditCard } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu-custom"
import { useAuth } from "@/components/auth-provider"
import { useRealtime } from "@/contexts/realtime-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogoutHandler } from "@/lib/logout-handler"
import { useState, useEffect } from "react"
import { NotificationCenter } from "@/components/notification-center"

export function TopBar() {
  const { user, profile, signOut } = useAuth()
  const { unreadCount } = useRealtime()
  const [showNotifications, setShowNotifications] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    const loadSubscription = async () => {
      if (!profile?.id) return

      try {
        const { getUserSubscription } = await import("@/lib/billing")
        const subscriptionData = await getUserSubscription(profile.id)
        setSubscription(subscriptionData)
      } catch (error) {
        console.error("Error loading subscription for top bar:", error)
      }
    }

    loadSubscription()
  }, [profile?.id])

  const handleSecureLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Logout failed, performing emergency logout:", error)
      LogoutHandler.emergencyLogout()
    }
  }

  useEffect(() => {
    if (LogoutHandler.shouldForceLogout()) {
      console.log("Security check triggered forced logout")
      LogoutHandler.emergencyLogout()
    }
  }, [])

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="hidden sm:flex bg-transparent transition-all duration-200 hover:scale-105 hover:shadow-md"
        >
          <Link href="/dashboard/upload" className="flex items-center">
            <Upload className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Quick Upload</span>
            <span className="md:hidden">Upload</span>
            {subscription?.plan?.document_limit !== -1 && profile?.documents_processed && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {profile.documents_processed}/{subscription?.plan?.document_limit || profile?.document_limit || 1}
              </Badge>
            )}
          </Link>
        </Button>

        <ThemeToggle />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative transition-all duration-200 hover:scale-110 hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
          aria-expanded={showNotifications}
          aria-haspopup="dialog"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 animate-in zoom-in-50 duration-200 pointer-events-none"
              aria-hidden="true"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full transition-all duration-200 hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="User menu"
              aria-haspopup="true"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={profile?.avatar_url || "/placeholder-user.jpg"}
                  alt={profile?.full_name || "User avatar"}
                />
                <AvatarFallback className="bg-primary/10">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 sm:w-56 animate-in slide-in-from-top-2 duration-200 shadow-lg border-0 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80"
            align="end"
            alignOffset={0}
            sideOffset={12}
            forceMount
            style={{
              boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.12), 0px 2px 8px rgba(0, 0, 0, 0.08)",
            }}
          >
            <div className="absolute -top-1 right-4 w-2 h-2 bg-background border-l border-t border-border rotate-45 z-10" />

            <DropdownMenuItem className="font-normal focus:bg-muted/50" asChild>
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none truncate">{profile?.full_name || "User"}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">{user?.email}</p>
                {subscription?.plan && (
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {subscription.plan.name}
                    </Badge>
                    {subscription.status !== "active" && (
                      <Badge variant="secondary" className="text-xs">
                        {subscription.status}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild className="focus:bg-muted/50 transition-colors duration-150">
              <Link href="/dashboard/account" className="flex items-center gap-3 w-full py-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>My Account</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="focus:bg-muted/50 transition-colors duration-150">
              <Link href="/dashboard/billing" className="flex items-center gap-3 w-full py-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span>Billing & Subscription</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="focus:bg-muted/50 transition-colors duration-150">
              <Link href="/dashboard/settings" className="flex items-center gap-3 w-full py-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleSecureLogout}
              className="flex items-center gap-3 py-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 transition-colors duration-150"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {showNotifications && <NotificationCenter onClose={() => setShowNotifications(false)} />}
    </header>
  )
}
