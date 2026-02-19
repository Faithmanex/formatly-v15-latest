"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { FileText, Zap, HardDrive, TrendingUp, Calendar } from "lucide-react"
import { useSubscription, usePlanUsage } from "@/contexts/subscription-context"

export function UsageStats() {
  const { subscription, usage, limits, isLoading } = useSubscription()
  const { planUsage } = usePlanUsage()

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1 || limit === 0) return 0 // Unlimited or no limit
    return Math.min((used / limit) * 100, 100)
  }

  const formatBytes = (gb: number) => {
    if (gb === 0) return "0 GB"
    if (gb < 1) return `${Math.round(gb * 1024)} MB`
    return `${gb.toFixed(2)} GB`
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 75) return "text-yellow-600"
    return "text-green-600"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
              <div className="h-2 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const documentsUsed = planUsage?.documents_processed || 0
  const documentLimit = planUsage?.document_limit || 0
  const apiCallsUsed = planUsage?.api_calls_made || 0
  const apiCallsLimit = planUsage?.api_calls_limit || 0
  const storageUsed = planUsage?.storage_used_gb || 0
  const storageLimit = planUsage?.storage_limit_gb || 0
  const planName = planUsage?.plan_name || subscription?.plan?.name || "Free"

  const documentPercentage = getUsagePercentage(documentsUsed, documentLimit)
  const apiPercentage = getUsagePercentage(apiCallsUsed, apiCallsLimit)
  const storagePercentage = getUsagePercentage(storageUsed, storageLimit)

  const isDocumentUnlimited = documentLimit === -1
  const isApiUnlimited = apiCallsLimit === -1
  const isStorageUnlimited = storageLimit === -1

  return (
    <div className="space-y-6">
      {/* Billing Period Info */}
      {planUsage && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Current Billing Period</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDate(planUsage.current_period_start)} - {formatDate(planUsage.current_period_end)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Period Usage */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Processed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documentsUsed.toLocaleString()}
              {!isDocumentUnlimited && (
                <span className="text-sm font-normal text-muted-foreground">
                  / {documentLimit === 0 ? "0" : documentLimit.toLocaleString()}
                </span>
              )}
            </div>
            {!isDocumentUnlimited && documentLimit > 0 && (
              <>
                <Progress value={documentPercentage} className="mt-2" />
                <p className={`text-xs mt-1 ${getUsageColor(documentPercentage)}`}>
                  {Math.max(0, documentLimit - documentsUsed)} documents remaining
                </p>
              </>
            )}
            {isDocumentUnlimited && <p className="text-xs text-green-600 mt-1">Unlimited documents</p>}
            {documentLimit === 0 && <p className="text-xs text-red-600 mt-1">No document allowance</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {apiCallsUsed.toLocaleString()}
              {!isApiUnlimited && apiCallsLimit > 0 && (
                <span className="text-sm font-normal text-muted-foreground">/ {apiCallsLimit.toLocaleString()}</span>
              )}
            </div>
            {!isApiUnlimited && apiCallsLimit > 0 && (
              <>
                <Progress value={apiPercentage} className="mt-2" />
                <p className={`text-xs mt-1 ${getUsageColor(apiPercentage)}`}>
                  {Math.max(0, apiCallsLimit - apiCallsUsed)} calls remaining
                </p>
              </>
            )}
            {isApiUnlimited && <p className="text-xs text-green-600 mt-1">Unlimited API calls</p>}
            {apiCallsLimit === 0 && <p className="text-xs text-red-600 mt-1">No API access</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(storageUsed)}
              {!isStorageUnlimited && storageLimit > 0 && (
                <span className="text-sm font-normal text-muted-foreground">/ {formatBytes(storageLimit)}</span>
              )}
            </div>
            {!isStorageUnlimited && storageLimit > 0 && (
              <>
                <Progress value={storagePercentage} className="mt-2" />
                <p className={`text-xs mt-1 ${getUsageColor(storagePercentage)}`}>
                  {formatBytes(Math.max(0, storageLimit - storageUsed))} remaining
                </p>
              </>
            )}
            {isStorageUnlimited && <p className="text-xs text-green-600 mt-1">Unlimited storage</p>}
            {storageLimit === 0 && <p className="text-xs text-red-600 mt-1">No storage allowance</p>}
          </CardContent>
        </Card>
      </div>

      {/* Usage Alerts */}
      {((documentPercentage >= 75 && !isDocumentUnlimited) ||
        (apiPercentage >= 75 && !isApiUnlimited) ||
        (storagePercentage >= 75 && !isStorageUnlimited)) && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Usage Alert</h3>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  {documentPercentage >= 75 && !isDocumentUnlimited && (
                    <p>Documents: {Math.round(documentPercentage)}% used</p>
                  )}
                  {apiPercentage >= 75 && !isApiUnlimited && <p>API Calls: {Math.round(apiPercentage)}% used</p>}
                  {storagePercentage >= 75 && !isStorageUnlimited && (
                    <p>Storage: {Math.round(storagePercentage)}% used</p>
                  )}
                  <p className="mt-2">
                    {Math.max(documentPercentage, apiPercentage, storagePercentage) >= 90
                      ? "Consider upgrading your plan to avoid service interruption."
                      : "You may want to consider upgrading your plan."}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Details */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan Details</CardTitle>
          <CardDescription>Your subscription limits and features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Plan</span>
              <Badge variant="outline">{planName}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Document Limit</span>
              <span className="text-sm">
                {isDocumentUnlimited
                  ? "Unlimited"
                  : documentLimit === 0
                    ? "None"
                    : `${documentLimit.toLocaleString()}/month`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">API Calls Limit</span>
              <span className="text-sm">
                {isApiUnlimited
                  ? "Unlimited"
                  : apiCallsLimit === 0
                    ? "None"
                    : `${apiCallsLimit.toLocaleString()}/month`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Storage Limit</span>
              <span className="text-sm">
                {isStorageUnlimited ? "Unlimited" : storageLimit === 0 ? "None" : `${formatBytes(storageLimit)}`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Priority Support</span>
              <span className="text-sm">{subscription?.plan?.priority_support ? "Included" : "Not included"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Custom Styles</span>
              <span className="text-sm">{subscription?.plan?.custom_styles ? "Included" : "Not included"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
