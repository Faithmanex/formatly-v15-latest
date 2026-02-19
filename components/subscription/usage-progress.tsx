"use client"

import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface UsageProgressProps {
  label: string
  used: number
  limit: number
  unit?: string
  showPercentage?: boolean
  showRemaining?: boolean
  variant?: "default" | "compact" | "detailed"
  className?: string
}

export function UsageProgress({
  label,
  used,
  limit,
  unit = "",
  showPercentage = true,
  showRemaining = false,
  variant = "default",
  className,
}: UsageProgressProps) {
  const isUnlimited = limit === -1
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100)
  const isAtLimit = !isUnlimited && used >= limit
  const isNearLimit = !isUnlimited && percentage >= 80

  const formatNumber = (num: number) => {
    if (unit === "GB") return num.toFixed(1)
    return num.toLocaleString()
  }

  const getProgressColor = () => {
    if (isAtLimit) return "bg-red-500"
    if (isNearLimit) return "bg-yellow-500"
    return "bg-blue-500"
  }

  const getIcon = () => {
    if (isAtLimit) return AlertCircle
    if (isNearLimit) return TrendingUp
    return CheckCircle
  }

  const Icon = getIcon()

  if (variant === "compact") {
    return (
      <div className={cn("space-y-1", className)}>
        <div className="flex justify-between text-xs">
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground">
            {formatNumber(used)} {unit} / {isUnlimited ? "∞" : `${formatNumber(limit)} ${unit}`}
          </span>
        </div>
        <Progress value={percentage} className="h-1" />
      </div>
    )
  }

  if (variant === "detailed") {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon
              className={cn("h-4 w-4", isAtLimit ? "text-red-500" : isNearLimit ? "text-yellow-500" : "text-green-500")}
            />
            <span className="font-medium">{label}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {formatNumber(used)} {unit} / {isUnlimited ? "∞" : `${formatNumber(limit)} ${unit}`}
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          {showPercentage && !isUnlimited && <span>{percentage.toFixed(0)}% used</span>}
          {showRemaining && !isUnlimited && (
            <span>
              {Math.max(0, limit - used).toLocaleString()} {unit} remaining
            </span>
          )}
          {isAtLimit && <span className="text-red-600 font-medium">Limit reached</span>}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {formatNumber(used)} {unit} / {isUnlimited ? "∞" : `${formatNumber(limit)} ${unit}`}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
      {isAtLimit && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <AlertCircle className="h-3 w-3" />
          You've reached your {label.toLowerCase()} limit
        </div>
      )}
    </div>
  )
}
