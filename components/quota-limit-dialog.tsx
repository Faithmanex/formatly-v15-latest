"use client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Crown, Calendar, ArrowUp, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

interface QuotaLimitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isFreePlan: boolean
  currentPlan?: string
  documentsUsed: number
  documentLimit: number
  resetDate?: string
}

export function QuotaLimitDialog({
  open,
  onOpenChange,
  isFreePlan,
  currentPlan = "Free",
  documentsUsed,
  documentLimit,
  resetDate,
}: QuotaLimitDialogProps) {
  const router = useRouter()
  const { profile } = useAuth()

  const handleUpgrade = () => {
    onOpenChange(false)
    router.push("/dashboard/upgrade")
  }

  const handleViewBilling = () => {
    onOpenChange(false)
    router.push("/dashboard/billing")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 rounded-full">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            Document Limit Reached
          </DialogTitle>
          <DialogDescription>You've used all your available documents for this billing period.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Usage */}
          <Alert>
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    {isFreePlan ? (
                      <>Free Plan</>
                    ) : (
                      <>
                        <Crown className="h-3 w-3" />
                        {currentPlan}
                      </>
                    )}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {documentsUsed} / {documentLimit} documents used
                  </span>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Message based on plan type */}
          {isFreePlan ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You've reached your free plan limit of {documentLimit} documents this month. Upgrade to continue
                formatting documents with these benefits:
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground ml-4">
                <li>• Higher document limits or unlimited formatting</li>
                <li>• Priority processing</li>
                <li>• Advanced formatting options</li>
                <li>• Premium support</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You've used all {documentLimit} documents in your {currentPlan} plan this billing period.
              </p>
              {resetDate && (
                <p className="text-sm text-muted-foreground">
                  Your quota will reset on <strong>{resetDate}</strong>, or you can upgrade now for higher limits.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isFreePlan ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Maybe Later
              </Button>
              <Button onClick={handleUpgrade} className="flex items-center gap-2">
                <ArrowUp className="h-4 w-4" />
                Upgrade Now
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleViewBilling} className="flex items-center gap-2 bg-transparent">
                <RefreshCw className="h-4 w-4" />
                View Billing
              </Button>
              <Button onClick={handleUpgrade} className="flex items-center gap-2">
                <ArrowUp className="h-4 w-4" />
                Upgrade Plan
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
