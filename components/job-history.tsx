"use client"

import { useState } from "react"
import { useJobs } from "@/hooks/use-jobs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  FileText, 
  Download, 
  Trash2, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Calendar
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"

export function JobHistory() {
  const { jobs, loading, error, refreshJobs } = useJobs()
  const { getToken } = useAuth()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "formatted": return "bg-green-500/10 text-green-500 border-green-500/20"
      case "processing": return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "failed": return "bg-red-500/10 text-red-500 border-red-500/20"
      default: return "bg-slate-500/10 text-slate-500 border-slate-500/20"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "formatted": return <CheckCircle className="h-3 w-3 mr-1" />
      case "processing": return <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
      case "failed": return <AlertCircle className="h-3 w-3 mr-1" />
      default: return <Clock className="h-3 w-3 mr-1" />
    }
  }

  const handleDelete = async (jobId: string) => {
    try {
      setDeletingId(jobId)
      const token = await getToken()
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!response.ok) throw new Error("Failed to delete job")
      
      toast({ title: "Deleted", description: "Job removed successfully" })
      refreshJobs()
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete job", variant: "destructive" })
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownload = async (job: any) => {
    try {
      setDownloadingId(job.id)
      const token = await getToken()
      const response = await fetch(`/api/documents/download/${job.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!response.ok) throw new Error("Download failed")
      
      const { success, filename, content, tracked_changes_content } = await response.json()
      if (!success) throw new Error("Download failed")

      const downloadBlob = (b64: string, name: string) => {
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
        const blob = new Blob([bytes], { type: "application/octet-stream" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = name
        a.click()
        URL.revokeObjectURL(url)
      }

      downloadBlob(content, filename || `formatted_${job.original_filename}`)
      
      if (tracked_changes_content) {
        const trackedName = filename ? filename.replace(/\.docx?$/i, "_tracked.docx") : `tracked_${job.original_filename}`
        setTimeout(() => downloadBlob(tracked_changes_content, trackedName), 500)
      }

      toast({ title: "Download started" })
    } catch (err) {
      toast({ title: "Error", description: "Download failed", variant: "destructive" })
    } finally {
      setDownloadingId(null)
    }
  }

  const handleRetry = async (job: any) => {
    try {
      setRetryingId(job.id)
      const token = await getToken()
      const response = await fetch("/api/documents/upload-complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          job_id: job.id,
          file_path: job.storage_location,
          success: true,
        }),
      })

      if (!response.ok) throw new Error("Retry failed")
      
      toast({ title: "Retrying", description: "Processing task restarted" })
      refreshJobs()
    } catch (err) {
      toast({ title: "Error", description: "Failed to restart process", variant: "destructive" })
    } finally {
      setRetryingId(null)
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Formatting History
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={refreshJobs} 
          disabled={loading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {loading && jobs.length === 0 ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-muted-foreground"> {error} </div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground italic"> No formatting history yet </div>
        ) : (
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto custom-scrollbar">
            {jobs.map((job) => (
              <div key={job.id} className="p-4 flex items-center justify-between hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{job.original_filename}</p>
                      {job.tracked_changes && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 border-primary/20 text-primary bg-primary/5">
                          Tracked
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-muted-foreground flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(new Date(job.created_at), 'MMM d, HH:mm')}
                      </p>
                      <span className="text-[10px] text-muted-foreground/30">•</span>
                      <p className="text-[10px] text-muted-foreground capitalize">{job.style_applied} Style</p>
                      {job.formatting_time && (
                        <>
                          <span className="text-[10px] text-muted-foreground/30">•</span>
                          <p className="text-[10px] text-muted-foreground">{job.formatting_time.toFixed(1)}s</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Badge variant="outline" className={`${getStatusColor(job.status)} text-[10px] px-2 py-0 border-transparent capitalize`}>
                    {getStatusIcon(job.status)}
                    {job.status}
                  </Badge>
                  
                  {job.status === "formatted" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                      onClick={() => handleDownload(job)}
                      disabled={downloadingId === job.id}
                    >
                      {downloadingId === job.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                    </Button>
                  )}
                  
                  {job.status === "failed" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-amber-500 hover:bg-amber-500/10"
                      onClick={() => handleRetry(job)}
                      disabled={retryingId === job.id}
                    >
                      {retryingId === job.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(job.id)}
                    disabled={deletingId === job.id}
                  >
                    {deletingId === job.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
