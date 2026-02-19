"use client"

import { Badge } from "@/components/ui/badge"
import { AlertCircle, Clock, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface SubscriptionStatusBadgeProps {
  status: string
  planName?: string
  showIcon?: boolean
  variant?: "default" | "compact" | "detailed"
  className?: string
}

export function SubscriptionStatusBadge({
  status,
  planName,
  showIcon = true,
  variant = "default",
  className,
}: SubscriptionStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return {
          label: "Active",
          className: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircle,
        }
      case "trialing":
        return {
          label: "Trial",
          className: "bg-blue-100 text-blue-800 border-blue-200",
          icon: Clock,
        }
      case "past_due":
        return {
          label: "Past Due",
          className: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: AlertCircle,
        }
      case "canceled":
        return {
          label: "Canceled",
          className: "bg-red-100 text-red-800 border-red-200",
          icon: XCircle,
        }
      case "none":
        return {
          label: "Free",
          className: "bg-gray-100 text-gray-800 border-gray-200",
          icon: null,
        }
      default:
        return {
          label: status.charAt(0).toUpperCase() + status.slice(1),
          className: "bg-gray-100 text-gray-800 border-gray-200",
          icon: null,
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  if (variant === "compact") {
    return (
      <Badge className={cn(config.className, "text-xs", className)}>
        {showIcon && Icon && <Icon className="h-3 w-3" />}
        {config.label}
      </Badge>
    )
  }

  if (variant === "detailed" && planName) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge className={cn(config.className, "text-xs")}>
          {showIcon && Icon && <Icon className="h-3 w-3" />}
          {config.label}
        </Badge>
        <span className="text-sm font-medium">{planName}</span>
      </div>
    )
  }

  return (
    <Badge className={cn(config.className, className)}>
      {showIcon && Icon && <Icon className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  )
}
