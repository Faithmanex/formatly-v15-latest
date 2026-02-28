"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  FileText,
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  RefreshCw,
  HelpCircle,
  BookOpen,
  Zap,
  Loader2,
  CreditCard,
  Calendar,
  Crown,
  Plus,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useSubscription, useSubscriptionStatus, useUsageLimits } from "@/contexts/subscription-context"
import { formatDistanceToNow } from "date-fns"
import { useRealtime } from "@/contexts/realtime-context"
import { JobHistory } from "@/components/job-history"

interface DashboardStats {
  totalDocuments: number
  processingDocuments: number
  completedDocuments: number
  monthlyUsage: number
  mostUsedStyle: string
}

interface DashboardData {
  stats: DashboardStats
  recentDocuments: any[]
  allDocuments: any[]
  usagePercentage: number
  planInfo: {
    name: string
    isPremium: boolean
    status: string
  }
}

export function Dashboard() {
  const router = useRouter()
  const { user, profile, isLoading: authLoading, isInitialized, getToken } = useAuth()
  const { subscription, usage, isLoading: subscriptionLoading, refreshAll } = useSubscription()
  const { isSubscribed, isPremium, planName, subscriptionStatus } = useSubscriptionStatus()
  const { limits } = useUsageLimits()
  const { documents, documentsLoading, documentsError, notifications, unreadCount } = useRealtime()

  const [activeTab, setActiveTab] = useState("overview")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [downloadingDocs, setDownloadingDocs] = useState<Set<string>>(new Set())

  // Component mount tracking
  const isMountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Safe state setters
  const safeSetIsRefreshing = useCallback((value: boolean) => {
    if (isMountedRef.current) {
      setIsRefreshing(value)
    }
  }, [])

  const safeSetActiveTab = useCallback((value: string) => {
    if (isMountedRef.current) {
      setActiveTab(value)
    }
  }, [])

  // Handle authorization redirect with cleanup
  useEffect(() => {
    if (!isMountedRef.current) return

    // Only redirect if auth is fully initialized and user is not authenticated
    if (isInitialized && !authLoading && !user) {
      router.push("/")
      return
    }
  }, [user, authLoading, isInitialized, router])

  // Centralized data computation with optimized dependencies
  const dashboardData = useMemo<DashboardData>(() => {
    const allDocuments = documents || []
    const recentDocuments = allDocuments.slice(0, 5)

    // Calculate stats efficiently
    let processingCount = 0
    let completedCount = 0
    let monthlyCount = 0
    const styleCount: Record<string, number> = {}
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    allDocuments.forEach((doc) => {
      // Status counts
      if (doc.status === "processing") processingCount++
      if (doc.status === "formatted") completedCount++

      // Monthly usage
      const docDate = new Date(doc.created_at)
      if (docDate.getMonth() === currentMonth && docDate.getFullYear() === currentYear) {
        monthlyCount++
      }

      // Style tracking
      const style = doc.style_applied || "Unknown"
      styleCount[style] = (styleCount[style] || 0) + 1
    })

    // Find most used style
    let mostUsedStyle = "APA"
    if (Object.keys(styleCount).length > 0) {
      mostUsedStyle = Object.entries(styleCount).reduce((a, b) => (styleCount[a[0]] > styleCount[b[0]] ? a : b))[0]
    }

    // Calculate usage percentage with consistent data hierarchy
    let usagePercentage = 0
    if (usage && subscription?.plan) {
      // Primary: subscription data
      const limit = subscription.plan.document_limit
      if (limit > 0) {
        usagePercentage = Math.round((usage.documents_processed / limit) * 100)
      }
    } else if (profile) {
      // Fallback: profile data
      usagePercentage = Math.round((profile.documents_used / profile.document_limit) * 100)
    }

    // Plan info with consistent hierarchy
    const planInfo = {
      name: planName || "Free",
      isPremium: isPremium || false,
      status: subscriptionStatus || "active",
    }

    return {
      stats: {
        totalDocuments: allDocuments.length,
        processingDocuments: processingCount,
        completedDocuments: completedCount,
        monthlyUsage: monthlyCount,
        mostUsedStyle,
      },
      recentDocuments,
      allDocuments,
      usagePercentage: Math.min(usagePercentage, 100),
      planInfo,
    }
  }, [documents, usage, subscription, profile, planName, isPremium, subscriptionStatus])

  // Centralized loading state - Decoupled documentsLoading for progressive rendering
  const isLoading = useMemo(() => {
    return subscriptionLoading || isRefreshing || authLoading
  }, [subscriptionLoading, isRefreshing, authLoading])

  // Handle upload completion with async cleanup
  const handleUploadComplete = useCallback(async () => {
    if (!isMountedRef.current) return

    try {
      await refreshAll()
      if (isMountedRef.current) {
        console.log("Upload completed - real-time updates will reflect changes automatically")
      }
    } catch (error) {
      console.error("Error refreshing data after upload:", error)
    }
  }, [refreshAll])

  // Safe refresh handler
  const handleRefresh = useCallback(async () => {
    if (!isMountedRef.current || isRefreshing) return

    safeSetIsRefreshing(true)

    try {
      // Use router.refresh() instead of router.reload()
      router.refresh()
      await refreshAll()
    } catch (error) {
      console.error("Error during refresh:", error)
    } finally {
      // Add delay to prevent rapid refresh clicks
      setTimeout(() => {
        if (isMountedRef.current) {
          safeSetIsRefreshing(false)
        }
      }, 1000)
    }
  }, [router, refreshAll, isRefreshing, safeSetIsRefreshing])

  // Navigation helpers
  const navigateTo = useCallback(
    (path: string) => {
      if (isMountedRef.current) {
        router.push(path)
      }
    },
    [router],
  )

  // Utility functions
  const formatCurrency = useCallback((amount: number, currency = "usd") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }, [])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }, [])

  const getSubscriptionStatusColor = useCallback((status: string) => {
    const colors = {
      active: "bg-primary/10 text-primary border-primary/20",
      trialing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      past_due: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      canceled: "bg-destructive/10 text-destructive border-destructive/20",
      default: "bg-muted text-muted-foreground border-border",
    }
    return colors[status as keyof typeof colors] || colors.default
  }, [])

  const getStatusColor = useCallback((status: string) => {
    const colors = {
      formatted: "bg-primary/10 text-primary border-primary/20",
      processing: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      failed: "bg-destructive/10 text-destructive border-destructive/20",
      default: "bg-muted text-muted-foreground border-border",
    }
    return colors[status as keyof typeof colors] || colors.default
  }, [])

  const getStatusIcon = useCallback((status: string) => {
    const icons = {
      formatted: <CheckCircle className="h-4 w-4" />,
      processing: <Clock className="h-4 w-4" />,
      failed: <AlertCircle className="h-4 w-4" />,
      default: <FileText className="h-4 w-4" />,
    }
    return icons[status as keyof typeof icons] || icons.default
  }, [])

  const LoadingSkeleton = useCallback(
    () => (
      <div className="min-h-screen bg-background p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-7 sm:h-8 w-48 sm:w-64" />
            <Skeleton className="h-4 w-64 sm:w-96" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:pb-2">
                  <Skeleton className="h-3 sm:h-4 w-16 sm:w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                  <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 mb-1 sm:mb-2" />
                  <Skeleton className="h-3 w-20 sm:w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border-border">
            <CardHeader className="p-3 sm:p-6">
              <div className="flex space-x-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-16 sm:w-20" />
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-3 sm:space-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-14 sm:h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
    [],
  )

  const ErrorDisplay = useCallback(
    () => (
      <div className="min-h-screen bg-background p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive" className="mb-4 sm:mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-sm">Error loading dashboard data: {documentsError}</span>
              <Button onClick={handleRefresh} size="sm" variant="outline" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                {isLoading ? "Loading..." : "Retry"}
              </Button>
            </AlertDescription>
          </Alert>
          {dashboardData && <DashboardContent dashboardData={dashboardData} />}
        </div>
      </div>
    ),
    [documentsError, handleRefresh, isLoading, dashboardData],
  )

  const handleDownloadDocument = useCallback(
    async (doc: any) => {
      if (!doc.id || doc.status !== "formatted") {
        return
      }

      setDownloadingDocs((prev) => new Set(prev).add(doc.id))

      try {
        const token = await getToken()

        const response = await fetch(`/api/documents/download/${doc.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        if (!response.ok) {
          throw new Error("Failed to download document")
        }

        const { success, filename, content, tracked_changes_content } = await response.json()

        if (!success || !content) {
          throw new Error("Invalid download response")
        }

        const downloadBlob = (b64Content: string, fileName: string) => {
          const binaryString = atob(b64Content)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          const blob = new Blob([bytes], {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = fileName
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }

        // Download main formatted file
        downloadBlob(content, filename || `formatted_${doc.original_filename || doc.filename}`)

        // Download tracked changes if available
        if (tracked_changes_content) {
          const trackedFilename = filename
            ? filename.replace(/\.(docx|doc)$/i, "_tracked.$1")
            : `tracked_${doc.original_filename || doc.filename}`
          
          setTimeout(() => {
            downloadBlob(tracked_changes_content, trackedFilename)
          }, 500)
        }
      } catch (error) {
        console.error("[v0] Download error:", error)
      } finally {
        setDownloadingDocs((prev) => {
          const next = new Set(prev)
          next.delete(doc.id)
          return next
        })
      }
    },
    [getToken],
  )

  const DashboardContent = useCallback(
    ({ dashboardData }: { dashboardData: DashboardData }) => {
      if (!dashboardData) return null

      const { stats, recentDocuments, allDocuments, usagePercentage, planInfo } = dashboardData

      return (
        <div className="min-h-screen bg-background">
          <div className="p-3 sm:p-4 lg:p-6 pb-24 sm:pb-6">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-foreground truncate">
                    Welcome, {profile?.full_name?.split(" ")[0] || "User"}
                  </h1>
                  <p className="text-sm text-muted-foreground hidden sm:block">
                    Here's what's happening with your documents.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {planInfo.isPremium && (
                    <Badge className="bg-primary text-primary-foreground border-0 text-xs">
                      <Crown className="h-3 w-3 mr-1" />
                      {planInfo.name}
                    </Badge>
                  )}
                  <Button
                    onClick={() => navigateTo("/dashboard/upload")}
                    className="hidden sm:flex bg-primary text-primary-foreground hover:bg-primary/90"
                    size="sm"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>

              {limits && (limits.documentsAtLimit || limits.apiCallsAtLimit || limits.storageAtLimit) && (
                <Alert className="border-amber-500/20 bg-amber-500/10 py-2 sm:py-3">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                    <span>
                      Usage limit reached.
                      {!planInfo.isPremium && " Upgrade to continue."}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-fit text-xs bg-transparent"
                      onClick={() => navigateTo("/dashboard/upgrade")}
                    >
                      {planInfo.isPremium ? "Change Plan" : "Upgrade"}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground font-medium">Documents</span>
                      <div className="p-2 bg-primary/10 rounded-full">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    {documentsLoading ? (
                      <Skeleton className="h-8 w-16 bg-muted/50" />
                    ) : (
                      <div className="text-xl sm:text-2xl font-semibold text-foreground">{stats.totalDocuments}</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground font-medium">Processing</span>
                      <div className="p-2 bg-amber-500/10 rounded-full">
                        <Clock className="h-4 w-4 text-amber-500" />
                      </div>
                    </div>
                    {documentsLoading ? (
                      <Skeleton className="h-8 w-16 bg-muted/50" />
                    ) : (
                      <div className="text-xl sm:text-2xl font-semibold text-foreground">{stats.processingDocuments}</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground font-medium">Formatted</span>
                      <div className="p-2 bg-emerald-500/10 rounded-full">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      </div>
                    </div>
                    {documentsLoading ? (
                      <Skeleton className="h-8 w-16 bg-muted/50" />
                    ) : (
                      <div className="text-xl sm:text-2xl font-semibold text-foreground">{stats.completedDocuments}</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground font-medium">Plan</span>
                      <div className="p-2 bg-blue-500/10 rounded-full">
                        <CreditCard className="h-4 w-4 text-blue-500" />
                      </div>
                    </div>
                    <div className="text-lg sm:text-xl font-semibold text-foreground truncate">{planInfo.name}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {usage && subscription?.plan
                        ? `${usage.documents_processed}/${subscription.plan.document_limit === -1 ? "∞" : subscription.plan.document_limit}`
                        : profile
                          ? `${profile.documents_used}/${profile.document_limit}`
                          : ""}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {!planInfo.isPremium && usage && subscription?.plan && (
                <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm">
                  <CardContent className="p-3 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Usage</span>
                      {subscription.current_period_end && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full">
                          <Calendar className="h-3 w-3" />
                          Renews {formatDate(subscription.current_period_end)}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Documents</span>
                        <span className="font-medium text-foreground">
                          {usage.documents_processed}/
                          {subscription.plan.document_limit === -1 ? "∞" : subscription.plan.document_limit}
                        </span>
                      </div>
                      <Progress
                        value={
                          subscription.plan.document_limit === -1
                            ? 0
                            : Math.min((usage.documents_processed / subscription.plan.document_limit) * 100, 100)
                        }
                        className="h-1.5 bg-muted/50"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-border/50 mt-2">
                      <span className="text-xs text-muted-foreground">
                        Style: <span className="font-medium text-foreground">{stats.mostUsedStyle}</span>
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-primary hover:bg-primary/10"
                        onClick={() => navigateTo("/dashboard/upgrade")}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Upgrade
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 sm:gap-3 scrollbar-sleek">
                <Button
                  variant="outline"
                  className="flex-shrink-0 h-auto py-3 px-4 flex-col gap-1.5 border-border/50 bg-background/60 backdrop-blur-xl hover:bg-primary/5 hover:border-primary/30 min-w-[100px] sm:min-w-0 transition-all duration-300"
                  onClick={() => navigateTo("/dashboard/upload")}
                >
                  <div className="p-2 bg-primary/10 rounded-full mb-1">
                    <Upload className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs font-medium">Upload</span>
                </Button>

                <Button
                  variant="outline"
                  className="flex-shrink-0 h-auto py-3 px-4 flex-col gap-1.5 border-border/50 bg-background/60 backdrop-blur-xl hover:bg-primary/5 hover:border-primary/30 min-w-[100px] sm:min-w-0 transition-all duration-300"
                  onClick={() => navigateTo("/dashboard/documents")}
                >
                  <div className="p-2 bg-primary/10 rounded-full mb-1">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs font-medium">Documents</span>
                </Button>

                <Button
                  variant="outline"
                  className="flex-shrink-0 h-auto py-3 px-4 flex-col gap-1.5 border-border/50 bg-background/60 backdrop-blur-xl hover:bg-primary/5 hover:border-primary/30 min-w-[100px] sm:min-w-0 transition-all duration-300"
                  onClick={() => navigateTo("/dashboard/ai")}
                >
                  <div className="p-2 bg-primary/10 rounded-full mb-1">
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs font-medium">AI Help</span>
                </Button>

                <Button
                  variant="outline"
                  className="flex-shrink-0 h-auto py-3 px-4 flex-col gap-1.5 border-border/50 bg-background/60 backdrop-blur-xl hover:bg-primary/5 hover:border-primary/30 min-w-[100px] sm:min-w-0 transition-all duration-300"
                  onClick={() => navigateTo("/dashboard/preferences")}
                >
                  <div className="p-2 bg-primary/10 rounded-full mb-1">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs font-medium">Styles</span>
                </Button>
              </div>

              <JobHistory />
            </div>
          </div>

          <div className="fixed bottom-4 right-4 sm:hidden z-50">
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => navigateTo("/dashboard/upload")}
            >
              <Plus className="h-6 w-6" />
              <span className="sr-only">Upload Document</span>
            </Button>
          </div>
        </div>
      )
    },
    [
      profile,
      subscription,
      usage,
      limits,
      navigateTo,
      safeSetActiveTab,
      getSubscriptionStatusColor,
      formatDate,
      formatCurrency,
      getStatusColor,
      getStatusIcon,
      formatDistanceToNow,
      handleRefresh,
      isLoading,
      handleDownloadDocument,
      downloadingDocs,
      documentsLoading,
    ],
  )

  if (!isInitialized || authLoading) {
    return <LoadingSkeleton />
  }

  if (!user) {
    return null
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (documentsError && !dashboardData) {
    return <ErrorDisplay />
  }

  return dashboardData ? <DashboardContent dashboardData={dashboardData} /> : null
}
