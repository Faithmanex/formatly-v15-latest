"use client"

import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopBar } from "@/components/top-bar"
import { SidebarInset } from "@/components/ui/sidebar"
import { useAuth } from "@/components/auth-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatePresence, motion } from "framer-motion"
import { usePathname } from "next/navigation"
import { RealtimeProvider } from "@/contexts/realtime-context"
import { SubscriptionProvider } from "@/contexts/subscription-context"

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isInitialized, isLoading, user } = useAuth()
  const pathname = usePathname()

  // Show loading skeleton during auth initialization
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-background p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto relative">
          {/* Subtle Dashboard Background for Glassmorphism */}
          <div className="absolute inset-0 bg-dot-pattern opacity-[0.03] dark:opacity-[0.02] pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none fixed" />
          
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative z-10"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SubscriptionProvider>
      <RealtimeProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </RealtimeProvider>
    </SubscriptionProvider>
  )
}
