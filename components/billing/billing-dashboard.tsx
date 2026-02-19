"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, Calendar, TrendingUp, AlertCircle, Zap, Clock, ArrowDown } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useSubscription, useSubscriptionStatus } from "@/contexts/subscription-context"
import Link from "next/link"

export function BillingDashboard() {
  const { profile } = useAuth()
  const { subscription, usage, limits, isLoading, refreshAll } = useSubscription()
  const { isSubscribed, isPremium, planName, subscriptionStatus, hasPendingPlanChange, pendingPlan } =
    useSubscriptionStatus()

  const formatCurrency = (amount: number, currency = "usd") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "trialing":
        return "bg-blue-100 text-blue-800"
      case "past_due":
        return "bg-yellow-100 text-yellow-800"
      case "canceled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const calculateUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0 // Unlimited
    return Math.min((used / limit) * 100, 100)
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {hasPendingPlanChange && pendingPlan && (
        <Alert className="border-orange-200 bg-orange-50">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDown className="h-4 w-4 text-orange-600" />
                <span>
                  Your plan will be downgraded to <strong>{pendingPlan.name}</strong> on{" "}
                  <strong>{formatDate(pendingPlan.effectiveDate)}</strong>. You'll keep your current{" "}
                  <strong>{planName}</strong> benefits until then.
                </span>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/upgrade">Manage Plan</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Subscription Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Current Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{planName}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getStatusColor(subscriptionStatus)}>
                {subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)}
              </Badge>
              {subscription?.cancel_at_period_end && (
                <Badge variant="outline" className="text-orange-600">
                  Canceling
                </Badge>
              )}
              {hasPendingPlanChange && (
                <Badge variant="outline" className="text-orange-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Downgrade Pending
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              {subscription?.plan?.description || "Basic features included"}
            </p>
            {hasPendingPlanChange && pendingPlan && (
              <p className="text-xs text-orange-600 mt-2">
                Changing to {pendingPlan.name} on {formatDate(pendingPlan.effectiveDate)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Monthly Cost</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {subscription?.plan
                ? formatCurrency(
                    subscription.billing_cycle === "yearly"
                      ? Math.round(subscription.plan.price_yearly / 12)
                      : subscription.plan.price_monthly,
                    subscription.plan.currency,
                  )
                : "$0.00"}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {subscription?.plan && subscription.plan.price_yearly > 0 && subscription.billing_cycle === "yearly" && (
                <>Save {formatCurrency(subscription.plan.price_monthly * 12 - subscription.plan.price_yearly)} yearly</>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Next Billing</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {subscription?.current_period_end ? formatDate(subscription.current_period_end) : "N/A"}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {subscription?.cancel_at_period_end
                ? "Subscription ends"
                : hasPendingPlanChange
                  ? "Plan change takes effect"
                  : "Next payment due"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Statistics */}
      {usage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Usage This Month</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Your current usage for the billing period ending {formatDate(usage.current_period_end)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium">Documents Processed</span>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {usage.documents_processed} /{" "}
                    {subscription?.plan?.document_limit === -1 ? "∞" : subscription?.plan?.document_limit || 5}
                  </span>
                </div>
                <Progress
                  value={calculateUsagePercentage(usage.documents_processed, subscription?.plan?.document_limit || 5)}
                  className="h-2"
                />
                {limits?.documentsAtLimit && (
                  <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm text-orange-600">
                    <AlertCircle className="h-4 w-4" />
                    You've reached your document limit
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium">API Calls</span>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {usage.api_calls_made.toLocaleString()} /{" "}
                    {subscription?.plan?.api_calls_limit === -1
                      ? "∞"
                      : subscription?.plan?.api_calls_limit?.toLocaleString() || "100"}
                  </span>
                </div>
                <Progress
                  value={calculateUsagePercentage(usage.api_calls_made, subscription?.plan?.api_calls_limit || 100)}
                  className="h-2"
                />
                {limits?.apiCallsAtLimit && (
                  <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm text-orange-600">
                    <AlertCircle className="h-4 w-4" />
                    You've reached your API call limit
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium">Storage Used</span>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {usage.storage_used_gb.toFixed(1)} GB /{" "}
                    {subscription?.plan?.storage_limit_gb === -1 ? "∞" : subscription?.plan?.storage_limit_gb || 1} GB
                  </span>
                </div>
                <Progress
                  value={calculateUsagePercentage(usage.storage_used_gb, subscription?.plan?.storage_limit_gb || 1)}
                  className="h-2"
                />
                {limits?.storageAtLimit && (
                  <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm text-orange-600">
                    <AlertCircle className="h-4 w-4" />
                    You've reached your storage limit
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Manage your subscription and billing preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link href="/dashboard/upgrade" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                {isPremium ? "Change Plan" : "Upgrade Plan"}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/billing/payment-methods">Manage Payment Methods</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/billing/history">View Billing History</Link>
            </Button>
            {subscription && subscription.status === "active" && !subscription.cancel_at_period_end && (
              <Button variant="outline" className="text-red-600 hover:text-red-700 bg-transparent">
                Cancel Subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
