"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Save, RefreshCw, AlertCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { useFormattingData } from "@/hooks/use-formatting-data"
import { useUserPreferences } from "@/hooks/use-user-preferences"

interface FormattingPreferences {
  defaultStyle: string
  defaultFont: string
  fontSize: string
  lineSpacing: string
  includeTOC: boolean
  pageNumbers: string
  margins: string
  citationStyle: string
  englishVariant: string
  trackedChanges: boolean
}

export function FormattingPreferences() {
  const { user } = useAuth()
  const { toast } = useToast()

  const {
    styles: formattingStyles,
    variants: englishVariants,
    isLoading: isLoadingData,
    error: dataError,
    refresh: refreshData,
  } = useFormattingData(user?.id)
  const {
    preferences: userPreferences,
    isLoading: isLoadingPreferences,
    savePreferences,
    refresh: refreshPreferences,
  } = useUserPreferences(user?.id)

  const [preferences, setPreferences] = useState(userPreferences)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    setPreferences(userPreferences)
  }, [userPreferences])

  const handlePreferenceChange = useCallback((key: string, value: any) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
    setHasUnsavedChanges(true)
  }, [])

  const handleSave = useCallback(async () => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save your preferences.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)
      await savePreferences(preferences)
      setHasUnsavedChanges(false)

      toast({
        title: "Preferences Saved",
        description: "Your formatting preferences have been saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Could not save your preferences. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [user, preferences, savePreferences, toast])

  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshData(), refreshPreferences()])
    toast({
      title: "Refreshed",
      description: "Preferences and data have been refreshed.",
    })
  }, [refreshData, refreshPreferences, toast])

  if (isLoadingData || isLoadingPreferences) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Formatting Preferences</h2>
            <p className="text-sm md:text-base text-muted-foreground">Loading your preferences...</p>
          </div>
        </div>
        <div className="grid gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="p-4 md:p-6">
                <Skeleton className="h-5 md:h-6 w-36 md:w-48" />
                <Skeleton className="h-3 md:h-4 w-64 md:w-96" />
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
                <Skeleton className="h-9 md:h-10 w-full" />
                <Skeleton className="h-9 md:h-10 w-full" />
                <Skeleton className="h-9 md:h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (dataError) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Formatting Preferences</h2>
            <p className="text-sm md:text-base text-muted-foreground">Error loading preferences</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm md:text-base">Failed to load preferences</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Formatting Preferences</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Customize your default document formatting settings
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleRefresh} variant="outline" disabled={isSaving} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button onClick={handleSave} disabled={!hasUnsavedChanges || isSaving} size="sm">
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {hasUnsavedChanges && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm md:text-base">
            You have unsaved changes. Don't forget to save your preferences.
          </AlertDescription>
        </Alert>
      )}

      {/* Academic Styles Section */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Academic Styles</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Choose from database-driven formatting styles and set your default preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="defaultStyle" className="text-xs md:text-sm">
                Default Formatting Style
              </Label>
              <Select
                value={preferences.defaultStyle}
                onValueChange={(value) => handlePreferenceChange("defaultStyle", value)}
              >
                <SelectTrigger className="text-sm md:text-base">
                  <SelectValue placeholder="Select formatting style" />
                </SelectTrigger>
                <SelectContent>
                  {formattingStyles.map((style) => (
                    <SelectItem key={style.id} value={style.code}>
                      {style.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="englishVariant" className="text-xs md:text-sm">
                English Variant
              </Label>
              <Select
                value={preferences.englishVariant}
                onValueChange={(value) => handlePreferenceChange("englishVariant", value)}
              >
                <SelectTrigger className="text-sm md:text-base">
                  <SelectValue placeholder="Select English variant" />
                </SelectTrigger>
                <SelectContent>
                  {englishVariants.map((variant) => (
                    <SelectItem key={variant.id} value={variant.code}>
                      {variant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="citationStyle" className="text-xs md:text-sm">
                Citation Style
              </Label>
              <Select
                value={preferences.citationStyle}
                onValueChange={(value) => handlePreferenceChange("citationStyle", value)}
              >
                <SelectTrigger className="text-sm md:text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apa">APA Style</SelectItem>
                  <SelectItem value="mla">MLA Style</SelectItem>
                  <SelectItem value="chicago">Chicago Style</SelectItem>
                  <SelectItem value="harvard">Harvard Style</SelectItem>
                  <SelectItem value="ieee">IEEE Style</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="defaultFont" className="text-xs md:text-sm">
                Default Font
              </Label>
              <Select
                value={preferences.defaultFont}
                onValueChange={(value) => handlePreferenceChange("defaultFont", value)}
              >
                <SelectTrigger className="text-sm md:text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="times">Times New Roman</SelectItem>
                  <SelectItem value="arial">Arial</SelectItem>
                  <SelectItem value="calibri">Calibri</SelectItem>
                  <SelectItem value="georgia">Georgia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Options */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Processing Options</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Configure how your documents are processed and formatted
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
          <div className="flex items-center justify-between p-3 md:p-4 border rounded-lg">
            <div className="space-y-0.5 flex-1 pr-3">
              <Label htmlFor="trackedChanges" className="text-xs md:text-sm">
                Tracked Changes
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive both a neat copy and a version showing all formatting changes
              </p>
            </div>
            <Switch
              id="trackedChanges"
              checked={preferences.trackedChanges}
              onCheckedChange={(checked) => handlePreferenceChange("trackedChanges", checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
