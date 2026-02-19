"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, CreditCard, TrendingUp, Zap } from "lucide-react"
import { SubscriptionStatusBadge } from "./subscription-status-badge"
import { PlanBadge } from "./plan-badge"
import { UsageProgress } from "./usage-progress"
import { useSubscription, useSubscriptionStatus, useUsageLimits } from "@/contexts/subscription-context"
import Link from "next/link"

interface SubscriptionSummaryProps {
  variant?: "default" | "compact" | "detailed"
  showUsage?: boolean
  showActions?: boolean
  className?: string
}

export function SubscriptionSummary({
  variant = "default",
  showUsage = true,
  showActions = true,
  className,
}: SubscriptionSummaryProps) {
  const { subscription, usage } = useSubscription()
  const { isSubscribed, isPremium, planName, subscriptionStatus } = useSubscriptionStatus()
  const { limits } = useUsageLimits()

  const formatCurrency = (amount: number, currency = "usd") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (variant === "compact") {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PlanBadge planName={planName} isPremium={isPremium} variant="gradient" />
              <SubscriptionStatusBadge status={subscriptionStatus} variant="compact" />
            </div>
            {subscription?.current_period_end && (
              <div className="text-xs text-muted-foreground">Renews {formatDate(subscription.current_period_end)}</div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === "detailed") {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription Overview
              </CardTitle>
              <CardDescription>Your current plan and usage details</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <PlanBadge planName={planName} isPremium={isPremium} variant="gradient" />
              <SubscriptionStatusBadge status={subscriptionStatus} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Monthly Cost</p>
                <p className="text-xs text-muted-foreground">
                  {subscription?.plan
                    ? formatCurrency(
                        subscription.billing_cycle === "yearly"
                          ? Math.round(subscription.plan.price_yearly / 12)
                          : subscription.plan.price_monthly,
                        subscription.plan.currency,
                      )
                    : "$0.00"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Next Billing</p>
                <p className="text-xs text-muted-foreground">
                  {subscription?.current_period_end ? formatDate(subscription.current_period_end) : "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Billing Cycle</p>
                <p className="text-xs text-muted-foreground capitalize">{subscription?.billing_cycle || "monthly"}</p>
              </div>
            </div>
          </div>

          {/* Usage Statistics */}
          {showUsage && usage && subscription?.plan && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Usage This Month</h4>
              <div className="space-y-3">
                <UsageProgress
                  label="Documents"
                  used={usage.documents_processed}
                  limit={subscription.plan.document_limit}
                  variant="detailed"
                  showRemaining
                />
                <UsageProgress
                  label="API Calls"
                  used={usage.api_calls_made}
                  limit={subscription.plan.api_calls_limit}
                  variant="detailed"
                />
                <UsageProgress
                  label="Storage"
                  used={usage.storage_used_gb}
                  limit={subscription.plan.storage_limit_gb}
                  unit="GB"
                  variant="detailed"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2">
              <Button asChild size="sm">
                <Link href="/dashboard/upgrade">{isPremium ? "Change Plan" : "Upgrade Plan"}</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/billing">View Billing</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Current Plan</CardTitle>
          <div className="flex items-center gap-2">
            <PlanBadge planName={planName} isPremium={isPremium} />
            <SubscriptionStatusBadge status={subscriptionStatus} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription?.plan && (
          <div className="text-sm text-muted-foreground">
            <p>{subscription.plan.description}</p>
            <p className="mt-1">
              {formatCurrency(
                subscription.billing_cycle === "yearly"
                  ? Math.round(subscription.plan.price_yearly / 12)
                  : subscription.plan.price_monthly,
                subscription.plan.currency,
              )}{" "}
              per month
            </p>
          </div>
        )}

        {showUsage && usage && subscription?.plan && (
          <div className="space-y-2">
            <UsageProgress
              label="Documents"
              used={usage.documents_processed}
              limit={subscription.plan.document_limit}
            />
            <UsageProgress
              label="Storage"
              used={usage.storage_used_gb}
              limit={subscription.plan.storage_limit_gb}
              unit="GB"
            />
          </div>
        )}

        {showActions && (
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link href="/dashboard/upgrade">{isPremium ? "Change Plan" : "Upgrade Plan"}</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/billing">Manage Billing</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
