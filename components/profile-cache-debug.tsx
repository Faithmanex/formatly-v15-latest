"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Trash2, Clock, CheckCircle, XCircle } from "lucide-react"
import { useProfileCache } from "@/hooks/use-profile-cache"
import { useAuth } from "@/components/auth-provider"

export function ProfileCacheDebug() {
  const { user } = useAuth()
  const { cacheStatus, forceRefresh, clearCache, validateCache } = useProfileCache()

  if (!user) {
    return null
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  const formatAge = (ms: number) => {
    if (ms < 60000) {
      return `${Math.floor(ms / 1000)}s ago`
    }
    return `${Math.floor(ms / 60000)}m ago`
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          Profile Cache Status
        </CardTitle>
        <CardDescription className="text-xs">Debug information for profile caching system</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Cache Exists:</span>
            {cacheStatus.exists ? (
              <Badge variant="default" className="h-5">
                <CheckCircle className="h-3 w-3 mr-1" />
                Yes
              </Badge>
            ) : (
              <Badge variant="secondary" className="h-5">
                <XCircle className="h-3 w-3 mr-1" />
                No
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Cache Valid:</span>
            {cacheStatus.valid ? (
              <Badge variant="default" className="h-5">
                <CheckCircle className="h-3 w-3 mr-1" />
                Valid
              </Badge>
            ) : (
              <Badge variant="destructive" className="h-5">
                <XCircle className="h-3 w-3 mr-1" />
                Invalid
              </Badge>
            )}
          </div>

          {cacheStatus.age && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Cache Age:</span>
              <span className="text-xs font-mono">{formatAge(cacheStatus.age)}</span>
            </div>
          )}

          {cacheStatus.timeUntilExpiry && cacheStatus.timeUntilExpiry > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Expires In:</span>
              <span className="text-xs font-mono">{formatTime(cacheStatus.timeUntilExpiry)}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={forceRefresh}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Force Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={clearCache}>
            <Trash2 className="h-3 w-3 mr-1" />
            Clear Cache
          </Button>
          <Button size="sm" variant="outline" onClick={validateCache}>
            <CheckCircle className="h-3 w-3 mr-1" />
            Validate
          </Button>
        </div>

        {cacheStatus.expiresAt && (
          <div className="text-xs text-muted-foreground">
            <strong>Expires:</strong> {new Date(cacheStatus.expiresAt).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
