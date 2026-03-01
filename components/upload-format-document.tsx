"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { DocumentUploader } from "@/components/document-uploader"
import { Upload, Settings, Palette, Globe, AlertCircle, RefreshCw, ChevronDown } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useFormattingData } from "@/hooks/use-formatting-data"
import { useUserPreferences } from "@/hooks/use-user-preferences"

interface FormattingOptions {
  style: string
  englishVariant: string
  trackedChanges: boolean
}

const DEFAULT_OPTIONS: FormattingOptions = {
  style: "APA",
  englishVariant: "US",
  trackedChanges: false,
}

export function UploadFormatDocument() {
  const { user } = useAuth()
  const { toast } = useToast()

  const {
    styles: formattingStyles,
    variants: englishVariants,
    customStyles,
    isLoading,
    error,
    refresh,
  } = useFormattingData(user?.id)
  const { preferences: userPreferences, isLoading: isLoadingPreferences } = useUserPreferences(user?.id)

  const [formattingOptions, setFormattingOptions] = useState<FormattingOptions>(DEFAULT_OPTIONS)

  useEffect(() => {
    if (userPreferences && !isLoadingPreferences) {
      setFormattingOptions({
        style: userPreferences.defaultStyle,
        englishVariant: userPreferences.englishVariant || "US",
        trackedChanges: userPreferences.trackedChanges !== undefined ? userPreferences.trackedChanges : false,
      })
    }
  }, [userPreferences, isLoadingPreferences])

  const updateFormattingOption = useCallback((key: keyof FormattingOptions, value: any) => {
    setFormattingOptions((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleUploadComplete = useCallback(() => {
    toast({
      title: "Upload Complete",
      description: "Your documents have been processed successfully.",
    })
  }, [toast])

  const handleRetry = useCallback(() => {
    refresh()
  }, [refresh])

  if (isLoading || isLoadingPreferences) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-6 md:h-8 w-48 md:w-64" />
          <Skeleton className="h-3 md:h-4 w-64 md:w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 md:h-6 w-36 md:w-48" />
              <Skeleton className="h-3 md:h-4 w-48 md:w-72" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 md:h-4 w-20 md:w-24" />
                  <Skeleton className="h-9 md:h-10 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 md:h-6 w-36 md:w-48" />
              <Skeleton className="h-3 md:h-4 w-48 md:w-72" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 md:h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
      <div className="space-y-1 md:space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">Upload & Format Documents</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Upload your documents and apply professional formatting with your preferred academic style.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm md:text-base">Failed to load formatting data</span>
            <Button onClick={handleRetry} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Formatting Options */}
        <Card>
          <CardHeader className="px-4 pt-4 pb-2 md:px-6 md:pt-6 md:pb-2">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Settings className="h-4 w-4 md:h-5 md:w-5" />
              Formatting Options
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Configure how your documents should be formatted
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6 px-4 pb-4 pt-0 md:px-6 md:pb-6 md:pt-0">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic" className="text-xs md:text-sm">
                  Basic Settings
                </TabsTrigger>
                <TabsTrigger value="advanced" className="text-xs md:text-sm">
                  Advanced
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-3 md:space-y-4 mt-3 md:mt-4">
                {/* Academic Style */}
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="style" className="text-xs md:text-sm">
                    Academic Style
                  </Label>
                  <Select
                    value={formattingOptions.style}
                    onValueChange={(value) => updateFormattingOption("style", value)}
                  >
                    <SelectTrigger className="text-sm md:text-base">
                      <SelectValue placeholder="Select academic style" />
                    </SelectTrigger>
                    <SelectContent>
                      {formattingStyles.map((style) => (
                        <SelectItem key={style.id} value={style.code}>
                          <div className="flex flex-col">
                            <span className="text-sm md:text-base">{style.name}</span>
                            {style.description && (
                              <span className="text-xs text-muted-foreground">{style.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                      {customStyles.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-t">
                            Custom Styles
                          </div>
                          {customStyles.map((style) => (
                            <SelectItem key={style.id} value={`custom-${style.id}`}>
                              <div className="flex items-center gap-2">
                                <Palette className="h-3 w-3" />
                                <div className="flex flex-col">
                                  <span className="text-sm md:text-base">{style.name}</span>
                                  {style.description && (
                                    <span className="text-xs text-muted-foreground">{style.description}</span>
                                  )}
                                </div>
                                {style.is_default && (
                                  <Badge variant="secondary" className="ml-auto text-xs">
                                    Default
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* English Variant */}
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="englishVariant" className="text-xs md:text-sm">
                    English Variant
                  </Label>
                  <Select
                    value={formattingOptions.englishVariant}
                    onValueChange={(value) => updateFormattingOption("englishVariant", value)}
                  >
                    <SelectTrigger className="text-sm md:text-base">
                      <SelectValue placeholder="Select English variant" />
                    </SelectTrigger>
                    <SelectContent>
                      {englishVariants.map((variant) => (
                        <SelectItem key={variant.id} value={variant.code}>
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <div className="flex flex-col">
                              <span className="text-sm md:text-base">{variant.name}</span>
                              {variant.description && (
                                <span className="text-xs text-muted-foreground">{variant.description}</span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tracked Changes */}
                <div className="flex items-center justify-between p-3 md:p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="trackedChanges" className="text-xs md:text-sm">
                      Tracked Changes
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Receive both a neat copy and a version showing all formatting changes
                    </p>
                  </div>
                  <Switch
                    id="trackedChanges"
                    checked={formattingOptions.trackedChanges}
                    onCheckedChange={(checked) => updateFormattingOption("trackedChanges", checked)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-3 md:space-y-4 mt-3 md:mt-4">
                {/* Current Settings Summary */}
                <div className="p-3 md:p-4 bg-secondary/50 rounded-lg">
                  <h4 className="font-medium mb-2 text-sm md:text-base">Current Settings</h4>
                  <div className="space-y-1 text-xs md:text-sm">
                    <div className="flex justify-between">
                      <span>Style:</span>
                      <span className="font-medium">
                        {formattingStyles.find((s) => s.code === formattingOptions.style)?.name ||
                          customStyles.find((s) => `custom-${s.id}` === formattingOptions.style)?.name ||
                          formattingOptions.style}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>English:</span>
                      <span className="font-medium">
                        {englishVariants.find((v) => v.code === formattingOptions.englishVariant)?.name ||
                          formattingOptions.englishVariant}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tracked Changes:</span>
                      <span className="font-medium">{formattingOptions.trackedChanges ? "Enabled" : "Disabled"}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Document Upload */}
        <Card>
          <CardHeader className="px-4 pt-4 pb-2 md:px-6 md:pt-6 md:pb-2">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Upload className="h-4 w-4 md:h-5 md:w-5" />
              Upload Documents
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Upload your documents for formatting. Supports only DOCX (max 10MB each)
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 md:px-6 md:pb-6 md:pt-0">
            <DocumentUploader
              selectedStyle={formattingOptions.style}
              formattingOptions={formattingOptions}
              onUploadComplete={handleUploadComplete}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Palette className="h-4 w-4 md:h-5 md:w-5" />
            Style Management Information
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Reference guide for formatting styles and their definitions
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="margins" className="border-b-0 mb-2">
              <AccordionTrigger className="py-2 px-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors no-underline hover:no-underline">
                <span className="text-sm font-medium">Margins</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 px-4 text-xs md:text-sm text-muted-foreground">
                Standard margins are typically 1 inch (2.54 cm) on all sides. Some styles may require specific margin adjustments for headers, footers, or first pages.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="headings" className="border-b-0 mb-2">
              <AccordionTrigger className="py-2 px-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors no-underline hover:no-underline">
                <span className="text-sm font-medium">Headings Style</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 px-4 text-xs md:text-sm text-muted-foreground">
                Heading levels are formatted according to the selected style (APA, MLA, Chicago, etc.). Each level has specific font size, weight, and spacing requirements.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="numbering" className="border-b-0 mb-2">
              <AccordionTrigger className="py-2 px-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors no-underline hover:no-underline">
                <span className="text-sm font-medium">Page Numbering</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 px-4 text-xs md:text-sm text-muted-foreground">
                Page numbers are positioned according to style guidelines. Some styles require page numbers in headers, while others place them in footers or at specific locations.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="spacing" className="border-b-0 mb-2">
              <AccordionTrigger className="py-2 px-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors no-underline hover:no-underline">
                <span className="text-sm font-medium">Line Spacing</span>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 px-4 text-xs md:text-sm text-muted-foreground">
                Standard line spacing for academic documents is typically 1.5 or double-spaced. The selected style automatically applies the appropriate spacing.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
