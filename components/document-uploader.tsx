"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, File, X, CheckCircle, CheckCircle2, AlertCircle, Loader2, Download, Clock } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { profileService } from "@/lib/database"
import { getUserSubscription } from "@/lib/billing"
import { formatFileSize, getFileExtension, isValidFileType } from "@/lib/utils"
import { QuotaLimitDialog } from "@/components/quota-limit-dialog"
import { ExponentialBackoff } from "@/lib/exponential-backoff"

interface UploadedFile {
  id: string
  file: File
  status: "pending" | "uploading" | "draft" | "processing" | "formatted" | "failed"
  progress: number
  error?: string
  documentId?: string
  jobId?: string
  uploadUrl?: string
  downloadUrl?: string
  processingStartedAt?: string
  completedAt?: string
  formattingTime?: number
}

interface DocumentUploaderProps {
  selectedStyle?: string
  formattingOptions?: {
    style: string
    englishVariant: string
    reportOnly: boolean
    includeComments: boolean
    preserveFormatting: boolean
  }
  onUploadComplete?: () => void
}

const ALLOWED_FILE_TYPES = ["doc", "docx"]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILES = 5

const pollingBackoff = new ExponentialBackoff({
  initialDelay: 2000, // Start at 2 seconds
  maxDelay: 10000, // Max 10 seconds
  maxRetries: 60, // Poll for up to ~10 minutes
  factor: 1.2, // Gradual increase
})

export function DocumentUploader({
  selectedStyle = "APA",
  formattingOptions,
  onUploadComplete,
}: DocumentUploaderProps) {
  const { profile, getToken } = useAuth()
  const { toast } = useToast()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [showQuotaDialog, setShowQuotaDialog] = useState(false)
  const [quotaInfo, setQuotaInfo] = useState<{
    isFreePlan: boolean
    currentPlan: string
    documentsUsed: number
    documentLimit: number
    resetDate?: string
    canProcess: boolean
    reason?: string
  } | null>(null)
  const [pollingIntervals, setPollingIntervals] = useState<Map<string, NodeJS.Timeout>>(new Map())
  const [recentlyCompleted, setRecentlyCompleted] = useState<string[]>([])

  useEffect(() => {
    return () => {
      pollingIntervals.forEach((interval) => clearInterval(interval))
    }
  }, [pollingIntervals])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!profile?.id) {
        toast({
          title: "Authentication Required",
          description: "Please log in to upload documents.",
          variant: "destructive",
        })
        return
      }

      try {
        const canProcessResult = await profileService.canProcessDocument(profile.id)

        if (!canProcessResult.canProcess) {
          const subscription = await getUserSubscription(profile.id)
          const isFreePlan = !subscription || subscription.plan?.name?.toLowerCase().includes("free")

          setQuotaInfo({
            isFreePlan: isFreePlan ?? false,
            currentPlan: canProcessResult.planName || "Free",
            documentsUsed: canProcessResult.currentUsage || 0,
            documentLimit: canProcessResult.limit || 5,
            resetDate: subscription?.current_period_end
              ? new Date(subscription.current_period_end).toLocaleDateString()
              : undefined,
            canProcess: false,
            reason: canProcessResult.reason,
          })
          setShowQuotaDialog(true)
          return
        }
      } catch (error) {
        console.error("Error checking document processing eligibility:", error)
        toast({
          title: "Error",
          description: "Unable to verify document processing eligibility. Please try again.",
          variant: "destructive",
        })
        return
      }

      // Validate files
      const validFiles = acceptedFiles.filter((file) => {
        if (file.size > MAX_FILE_SIZE) {
          toast({
            title: "File Too Large",
            description: `${file.name} is larger than 10MB. Please choose a smaller file.`,
            variant: "destructive",
          })
          return false
        }

        if (!isValidFileType(file.name, ALLOWED_FILE_TYPES)) {
          toast({
            title: "Invalid File Type",
            description: `${file.name} is not a supported file type. Please upload DOC, DOCX, PDF, TXT, or RTF files.`,
            variant: "destructive",
          })
          return false
        }

        return true
      })

      if (files.length + validFiles.length > MAX_FILES) {
        toast({
          title: "Too Many Files",
          description: `You can only upload up to ${MAX_FILES} files at once.`,
          variant: "destructive",
        })
        return
      }

      // Add files to upload queue
      const newFiles: UploadedFile[] = validFiles.map((file) => ({
        id: Math.random().toString(36).substring(2),
        file,
        status: "pending",
        progress: 0,
      }))

      setFiles((prev) => [...prev, ...newFiles])

      // Start uploading files
      setIsUploading(true)
      try {
        for (const uploadFileItem of newFiles) {
          await processFileUpload(uploadFileItem)
        }
      } catch (error) {
        console.error("Error in upload process:", error)
      } finally {
        setIsUploading(false)
      }
    },
    [profile?.id, files.length, toast, selectedStyle, formattingOptions],
  )

  const processFileUpload = async (uploadFileItem: UploadedFile) => {
    if (!profile?.id) return

    try {
      const canProcessResult = await profileService.canProcessDocument(profile.id)

      if (!canProcessResult.canProcess) {
        throw new Error(canProcessResult.reason || "Document processing not allowed")
      }

      setFiles((prev) =>
        prev.map((f) => (f.id === uploadFileItem.id ? { ...f, status: "uploading", progress: 10 } : f)),
      )

      const token = await getToken()

      const formData = new FormData()
      formData.append("filename", uploadFileItem.file.name)
      formData.append("style", formattingOptions?.style || selectedStyle)
      formData.append("englishVariant", formattingOptions?.englishVariant || "us")
      formData.append("reportOnly", (formattingOptions?.reportOnly || false).toString())
      formData.append("includeComments", (formattingOptions?.includeComments || true).toString())
      formData.append("preserveFormatting", (formattingOptions?.preserveFormatting || true).toString())
      formData.append("trackedChanges", (formattingOptions && "trackedChanges" in formattingOptions ? formattingOptions.trackedChanges : false) as string)
      formData.append("file_size", uploadFileItem.file.size.toString())

      const createUploadResponse = await fetch("/api/documents/create-upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!createUploadResponse.ok) {
        const errorData = await createUploadResponse.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] Create upload URL request failed:", {
          status: createUploadResponse.status,
          statusText: createUploadResponse.statusText,
          error: errorData.error,
          details: errorData.details,
          type: errorData.type,
        })

        let errorMessage = "Failed to create upload URL"
        if (errorData.type === "Network/Connection Error") {
          errorMessage = "Cannot connect to processing server. Please check if the FastAPI backend is running."
        } else if (errorData.details) {
          errorMessage = `Server error: ${errorData.details}`
        }

        throw new Error(errorMessage)
      }

      const { success, job_id, upload_url, upload_headers, file_path } = await createUploadResponse.json()

      if (!success || !upload_url) {
        throw new Error("Invalid response from create-upload endpoint")
      }

      console.log("[v0] Received signed upload URL and job ID:", { job_id, hasUploadUrl: !!upload_url })

      console.log("[v0] Uploading file to Supabase Storage, job ID:", job_id)
      const fileUploadResponse = await fetch(upload_url, {
        method: "PUT",
        body: uploadFileItem.file,
        headers: {
          ...upload_headers,
          "Content-Type": uploadFileItem.file.type || "application/octet-stream",
        },
      })

      if (!fileUploadResponse.ok) {
        console.log("[v0] File upload to storage failed:", fileUploadResponse.status, fileUploadResponse.statusText)
        throw new Error("Failed to upload file to storage")
      }
      console.log("[v0] File uploaded to storage successfully, job ID:", job_id)

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFileItem.id
            ? { ...f, progress: 30, jobId: job_id, uploadUrl: upload_url, status: "draft" }
            : f,
        ),
      )

      console.log("[v0] Confirming upload completion for job ID:", job_id)
      const webhookResponse = await fetch("/api/documents/upload-complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          job_id: job_id,
          file_path: file_path,
          success: true,
        }),
      })

      if (!webhookResponse.ok) {
        const errorData = await webhookResponse.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] Upload confirmation failed:", {
          status: webhookResponse.status,
          statusText: webhookResponse.statusText,
          error: errorData.error,
          details: errorData.details,
          type: errorData.type,
        })

        let errorMessage = "Failed to confirm upload completion"

        if (errorData.type === "Connection Timeout") {
          errorMessage =
            "Server timeout: The backend service took too long to respond. Please try again or check if the FastAPI service is running."
        } else if (errorData.type === "Connection Refused") {
          errorMessage =
            "Server unreachable: Cannot connect to the FastAPI backend. Please ensure the backend service is running and accessible."
        } else if (errorData.details) {
          errorMessage = `${errorData.error}: ${errorData.details}`
        } else if (errorData.error) {
          errorMessage = errorData.error
        }

        throw new Error(errorMessage)
      }
      console.log("[v0] Upload confirmed, processing started for job ID:", job_id)

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFileItem.id
            ? {
                ...f,
                status: "processing",
                progress: 70,
                documentId: job_id,
                processingStartedAt: new Date().toISOString(),
              }
            : f,
        ),
      )

      console.log("[v0] Starting job status polling for job ID:", job_id)
      startJobPollingWithBackoff(uploadFileItem.id, job_id)

      toast({
        title: "Upload Successful",
        description: `${uploadFileItem.file.name} has been queued for processing.`,
      })
    } catch (error) {
      console.error("[v0] Upload error for job:", uploadFileItem.jobId || "unknown", error)

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFileItem.id
            ? {
                ...f,
                status: "failed",
                error: error instanceof Error ? error.message : "Upload failed. Please try again.",
              }
            : f,
        ),
      )

      toast({
        title: "Upload Failed",
        description: `Failed to upload ${uploadFileItem.file.name}. ${error instanceof Error ? error.message : "Please try again."}`,
        variant: "destructive",
      })
    }
  }

  const startJobPollingWithBackoff = (fileId: string, jobId: string) => {
    console.log("[v0] Starting polling for job ID:", jobId)
    let attempt = 0
    let timeoutId: NodeJS.Timeout | null = null
    const abortController = new AbortController()
    const fileBackoff = new ExponentialBackoff({
      initialDelay: 2000,
      maxDelay: 10000,
      maxRetries: 60, // ~10 minutes total
      factor: 1.2,
    })

    const pollJob = async () => {
      if (abortController.signal.aborted) {
        return
      }

      try {
        const token = await getToken()
        const timestamp = Date.now()
        const statusResponse = await fetch(`/api/documents/status/${jobId}?t=${timestamp}`, {
          signal: abortController.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: "no-store", // Disable browser caching
        })

        if (!statusResponse.ok) {
          console.log("[v0] Status polling failed for job ID:", jobId, statusResponse.status)
          throw new Error("Failed to get job status")
        }

        const { status, progress, result_url, error, formatting_time } = await statusResponse.json()
        console.log("[v0] Job status update:", {
          jobId,
          status,
          progress,
          hasResultUrl: !!result_url,
          error,
          attempt,
          formatting_time,
        })

        setFiles((prev) =>
          prev.map((f) => {
            if (f.id === fileId) {
              const updatedFile = {
                ...f,
                progress: Math.max(f.progress, progress || f.progress),
              }

              if (status === "formatted") {
                console.log("[v0] Job completed successfully:", jobId)
                updatedFile.status = "formatted"
                updatedFile.progress = 100
                updatedFile.downloadUrl = result_url
                updatedFile.completedAt = new Date().toISOString()
                updatedFile.formattingTime = formatting_time

                abortController.abort()
                if (timeoutId) {
                  clearTimeout(timeoutId)
                  timeoutId = null
                }
                setPollingIntervals((prev) => {
                  const newMap = new Map(prev)
                  newMap.delete(fileId)
                  return newMap
                })

                toast({
                  title: "Formatting Complete!",
                  description: `"${f.file.name}" has been formatted successfully${formatting_time ? ` in ${formatting_time.toFixed(1)}s` : ""}. Click download to get your file.`,
                })

                setRecentlyCompleted((prev) => [...prev, fileId])
                setTimeout(() => {
                  setRecentlyCompleted((prev) => prev.filter((id) => id !== fileId))
                }, 5000)

                if (onUploadComplete) {
                  onUploadComplete()
                }
              } else if (status === "failed") {
                console.log("[v0] Job failed:", jobId, error)
                updatedFile.status = "failed"
                updatedFile.error = error || "Processing failed"

                abortController.abort()
                if (timeoutId) {
                  clearTimeout(timeoutId)
                  timeoutId = null
                }
                setPollingIntervals((prev) => {
                  const newMap = new Map(prev)
                  newMap.delete(fileId)
                  return newMap
                })
              } else if (status === "processing") {
                updatedFile.status = "processing"
              } else if (status === "draft") {
                updatedFile.status = "draft"
              }

              return updatedFile
            }
            return f
          }),
        )

        if (status !== "formatted" && status !== "failed") {
          attempt++
          const nextDelay = fileBackoff.getDelay(attempt)

          if (timeoutId) {
            clearTimeout(timeoutId)
          }

          timeoutId = setTimeout(pollJob, nextDelay)

          setPollingIntervals((prev) => {
            const newMap = new Map(prev)
            newMap.set(fileId, timeoutId as any)
            return newMap
          })
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return
        }
        console.error("[v0] Error polling job status for job ID:", jobId, error)

        if (!abortController.signal.aborted) {
          attempt++
          const nextDelay = fileBackoff.getDelay(attempt)

          if (timeoutId) {
            clearTimeout(timeoutId)
          }

          timeoutId = setTimeout(pollJob, nextDelay)

          setPollingIntervals((prev) => {
            const newMap = new Map(prev)
            newMap.set(fileId, timeoutId as any)
            return newMap
          })
        }
      }
    }

    pollJob()
  }

  const downloadFile = async (file: UploadedFile) => {
    if (!file.downloadUrl || !file.jobId) return

    try {
      console.log("[v0] Initiating download for job ID:", file.jobId)

      const token = await getToken()

      const response = await fetch(`/api/documents/download/${file.jobId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!response.ok) {
        console.log("[v0] Download failed for job ID:", file.jobId, response.status, response.statusText)
        throw new Error("Failed to download file")
      }

      const { success, filename, content, tracked_changes_content } = await response.json()

      if (!success || !content) {
        throw new Error("Invalid download response")
      }

      const downloadBlob = (b64Content: string, fileName: string) => {
        const binaryString = atob(b64Content)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const blob = new Blob([bytes], { type: "application/octet-stream" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }

      console.log("[v0] Download successful, job ID:", file.jobId)
      
      // Download main formatted file
      downloadBlob(content, filename || `formatted_${file.file.name}`)

      // Download tracked changes if available
      if (tracked_changes_content) {
        const trackedFilename = filename
          ? filename.replace(/\.(docx|doc)$/i, "_tracked.$1")
          : `tracked_${file.file.name}`
        
        // Small delay to ensure browser doesn't block consecutive downloads
        setTimeout(() => {
          downloadBlob(tracked_changes_content, trackedFilename)
        }, 500)
      }

      toast({
        title: "Download Started",
        description: tracked_changes_content
          ? "Downloading formatted and tracked changes documents"
          : `Downloading ${filename || file.file.name}`,
      })
    } catch (error) {
      console.error("[v0] Download error for job ID:", file.jobId, error)
      toast({
        title: "Download Failed",
        description: "Failed to download the formatted document.",
        variant: "destructive",
      })
    }
  }

  const removeFile = (fileId: string) => {
    const interval = pollingIntervals.get(fileId)
    if (interval) {
      clearInterval(interval)
      setPollingIntervals((prev) => {
        const newMap = new Map(prev)
        newMap.delete(fileId)
        return newMap
      })
    }

    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const clearCompleted = () => {
    const completedFiles = files.filter((f) => f.status === "formatted")
    completedFiles.forEach((file) => {
      const interval = pollingIntervals.get(file.id)
      if (interval) {
        clearInterval(interval)
      }
    })

    setFiles((prev) => prev.filter((f) => f.status !== "formatted"))
    setPollingIntervals((prev) => {
      const newMap = new Map(prev)
      completedFiles.forEach((file) => newMap.delete(file.id))
      return newMap
    })
  }

  const retryFailed = async () => {
    const failedFiles = files.filter((f) => f.status === "failed")

    setFiles((prev) =>
      prev.map((f) =>
        f.status === "failed"
          ? { ...f, status: "pending", progress: 0, error: undefined, jobId: undefined }
          : f,
      ),
    )

    setIsUploading(true)
    try {
      for (const failedFile of failedFiles) {
        await processFileUpload(failedFile)
      }
    } catch (error) {
      console.error("Error retrying failed uploads:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "application/rtf": [".rtf"],
    },
    maxSize: MAX_FILE_SIZE,
    disabled: isUploading,
  })

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "pending":
        return <File className="h-4 w-4 text-muted-foreground" />
      case "uploading":
      case "draft":
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case "formatted":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: UploadedFile["status"]) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800"
      case "uploading":
        return "bg-blue-100 text-blue-800"
      case "draft":
        return "bg-purple-100 text-purple-800"
      case "processing":
        return "bg-yellow-100 text-yellow-800"
      case "formatted":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const completedCount = useMemo(() => files.filter((f) => f.status === "formatted").length, [files])
  const errorCount = useMemo(() => files.filter((f) => f.status === "failed").length, [files])
  const processingCount = useMemo(
    () => files.filter((f) => f.status === "processing" || f.status === "draft").length,
    [files],
  )

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs.toFixed(0)}s`
  }

  return (
    <div className="space-y-6">
      {quotaInfo && (
        <QuotaLimitDialog
          open={showQuotaDialog}
          onOpenChange={setShowQuotaDialog}
          isFreePlan={quotaInfo.isFreePlan}
          currentPlan={quotaInfo.currentPlan}
          documentsUsed={quotaInfo.documentsUsed}
          documentLimit={quotaInfo.documentLimit}
          resetDate={quotaInfo.resetDate}
        />
      )}

      {completedCount > 0 && recentlyCompleted.length > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Formatting complete!</strong> Your document{completedCount > 1 ? "s are" : " is"} ready to download.
          </AlertDescription>
        </Alert>
      )}

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-base sm:text-lg font-medium">Drop your files here...</p>
            ) : (
              <div>
                <p className="text-base sm:text-lg font-medium mb-2">Drag & drop files here, or click to select</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Up to {MAX_FILES} files, {formatFileSize(MAX_FILE_SIZE)} max each
                </p>
              </div>
            )}
          </div>

          {files.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-medium">Processing Queue</h3>
                <div className="flex gap-2">
                  {completedCount > 0 && (
                    <Button variant="outline" size="sm" onClick={clearCompleted}>
                      Clear Completed ({completedCount})
                    </Button>
                  )}
                  {errorCount > 0 && (
                    <Button variant="outline" size="sm" onClick={retryFailed}>
                      Retry Failed ({errorCount})
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg bg-card transition-all ${
                      recentlyCompleted.includes(file.id) ? "border-green-400 bg-green-50 ring-2 ring-green-200" : ""
                    }`}
                  >
                    {getStatusIcon(file.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs sm:text-sm font-medium truncate">{file.file.name}</p>
                        <Badge className={getStatusColor(file.status)}>{file.status}</Badge>
                        {file.jobId && (
                          <Badge variant="outline" className="text-xs">
                            Job: {file.jobId.slice(-8)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.file.size)}</span>
                        <span>{getFileExtension(file.file.name).toUpperCase()}</span>
                        {file.processingStartedAt && (
                          <span>Started: {new Date(file.processingStartedAt).toLocaleTimeString()}</span>
                        )}
                        {file.completedAt && <span>Completed: {new Date(file.completedAt).toLocaleTimeString()}</span>}
                        {file.formattingTime && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Clock className="h-3 w-3" />
                            {formatDuration(file.formattingTime)}
                          </span>
                        )}
                      </div>
                      {(file.status === "uploading" || file.status === "draft" || file.status === "processing") && (
                        <Progress value={file.progress} className="mt-2 h-1" />
                      )}
                      {file.error && (
                        <Alert className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs sm:text-sm">{file.error}</AlertDescription>
                        </Alert>
                      )}
                      {file.status === "formatted" && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Ready for download
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {file.status === "formatted" && file.downloadUrl && (
                        <Button
                          variant={recentlyCompleted.includes(file.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => downloadFile(file)}
                          className={recentlyCompleted.includes(file.id) ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                      {file.status !== "uploading" && file.status !== "processing" && file.status !== "draft" && (
                        <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

      {files.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{files.length}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total Files</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-yellow-600">{processingCount}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Processing</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-green-600">{completedCount}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-red-600">{errorCount}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
