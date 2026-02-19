"use client"

import { Badge } from "@/components/ui/badge"
import { Crown, Zap, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface PlanBadgeProps {
  planName: string
  isPremium?: boolean
  isPopular?: boolean
  variant?: "default" | "gradient" | "outline"
  showIcon?: boolean
  className?: string
}

export function PlanBadge({
  planName,
  isPremium = false,
  isPopular = false,
  variant = "default",
  showIcon = true,
  className,
}: PlanBadgeProps) {
  const getIcon = () => {
    if (isPopular) return Star
    if (isPremium) return Crown
    return Zap
  }

  const getVariantClasses = () => {
    if (variant === "gradient" && isPremium) {
      return "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
    }
    if (variant === "outline") {
      return "border-primary text-primary bg-transparent"
    }
    if (isPremium) {
      return "bg-purple-100 text-purple-800 border-purple-200"
    }
    if (isPopular) {
      return "bg-blue-100 text-blue-800 border-blue-200"
    }
    return "bg-gray-100 text-gray-800 border-gray-200"
  }

  const Icon = getIcon()

  return (
    <Badge className={cn(getVariantClasses(), className)}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {planName}
    </Badge>
  )
}
