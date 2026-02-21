"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu-custom"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-custom"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  FileText,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Crown,
  X,
  Loader2,
} from "lucide-react"
import { useRealtime } from "@/contexts/realtime-context"
import { useSubscription, useSubscriptionStatus, useUsageLimits } from "@/contexts/subscription-context"
import { documentService, notificationService } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import type { Database } from "@/lib/supabase"

type Document = Database["public"]["Tables"]["documents"]["Row"]

export function MyDocuments() {
  const { documents, documentsLoading, documentsError, refreshDocuments } = useRealtime()
  const { subscription, usage, refreshAll } = useSubscription()
  const { isSubscribed, isPremium, planName, subscriptionStatus } = useSubscriptionStatus()
  const { limits } = useUsageLimits()
  const { toast } = useToast()
  const { getToken } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [styleFilter, setStyleFilter] = useState("all")
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("updated")
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [downloadingDocs, setDownloadingDocs] = useState<Set<string>>(new Set())

  const filteredDocuments = useMemo(() => {
    let filtered = documents

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (doc) =>
          doc.filename.toLowerCase().includes(searchLower) ||
          doc.original_filename?.toLowerCase().includes(searchLower) ||
          doc.style_applied?.toLowerCase().includes(searchLower),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((doc) => doc.status === statusFilter)
    }

    if (styleFilter !== "all") {
      filtered = filtered.filter((doc) => doc.style_applied === styleFilter)
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "updated":
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        case "created":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "name":
          return a.filename.localeCompare(b.filename)
        case "size":
          return (b.file_size || 0) - (a.file_size || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [documents, searchTerm, statusFilter, styleFilter, sortBy])

  useEffect(() => {
    setSelectedDocs([])
  }, [searchTerm, statusFilter, styleFilter])

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const token = await getToken()
      const response = await fetch(`/api/jobs/${documentId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (response.ok) {
        setSelectedDocs((prev) => prev.filter((id) => id !== documentId))
        refreshAll()
        toast({
          title: "Success",
          description: "Document deleted successfully",
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to delete document")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive",
      })
    }
  }

  const handleBulkDelete = async () => {
    try {
      const token = await getToken()
      const deletePromises = selectedDocs.map((id) =>
        fetch(`/api/jobs/${id}`, {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      )
      
      const results = await Promise.all(deletePromises)
      const allSuccessful = results.every((r) => r.ok)

      setSelectedDocs([])
      refreshAll()

      if (allSuccessful) {
        toast({
          title: "Success",
          description: `${selectedDocs.length} documents deleted successfully`,
        })
      } else {
        toast({
          title: "Partial Success",
          description: "Some documents could not be deleted.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete some documents",
        variant: "destructive",
      })
    }
  }

  const handleRetryProcessing = async (document: Document) => {
    try {
      const token = await getToken()
      const response = await fetch("/api/documents/upload-complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          job_id: document.id,
          file_path: document.storage_location,
          success: true,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to restart processing")
      }

      toast({
        title: "Success",
        description: "Document processing restarted",
      })
      refreshAll()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to restart processing",
        variant: "destructive",
      })
    }
  }

  const handleRefresh = async () => {
    try {
      await refreshDocuments()
      await refreshAll()
      toast({
        title: "Success",
        description: "Documents refreshed",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh documents",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "formatted":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "formatted":
        return "bg-green-100 text-green-800"
      case "processing":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "trialing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "past_due":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "canceled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown"
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatCurrency = (amount: number, currency = "usd") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const toggleDocSelection = (docId: string) => {
    setSelectedDocs((prev) => (prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]))
  }

  const toggleSelectAll = () => {
    setSelectedDocs((prev) => (prev.length === filteredDocuments.length ? [] : filteredDocuments.map((doc) => doc.id)))
  }

  const handleDownloadDocument = useCallback(
    async (doc: Document) => {
      if (!doc.id || doc.status !== "formatted") {
        toast({
          title: "Download Not Available",
          description: "This document is not ready for download yet.",
          variant: "destructive",
        })
        return
      }

      setDownloadingDocs((prev) => new Set(prev).add(doc.id))

      try {
        const token = await getToken()

        const response = await fetch(`/api/documents/download/${doc.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Download failed" }))
          throw new Error(errorData.error || "Failed to download document")
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
          const blob = new Blob([bytes], {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = fileName
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }

        // Download main formatted file
        downloadBlob(content, filename || `formatted_${doc.original_filename || doc.filename}`)

        // Download tracked changes if available
        if (tracked_changes_content) {
          const trackedFilename = filename
            ? filename.replace(/\.(docx|doc)$/i, "_tracked.$1")
            : `tracked_${doc.original_filename || doc.filename}`
          
          setTimeout(() => {
            downloadBlob(tracked_changes_content, trackedFilename)
          }, 500)
        }

        toast({
          title: "Download Started",
          description: tracked_changes_content
            ? "Downloading formatted and tracked changes documents"
            : `Downloading ${filename || doc.filename}`,
        })
      } catch (error) {
        console.error("[v0] Download error:", error)
        toast({
          title: "Download Failed",
          description: error instanceof Error ? error.message : "Failed to download the document.",
          variant: "destructive",
        })
      } finally {
        setDownloadingDocs((prev) => {
          const next = new Set(prev)
          next.delete(doc.id)
          return next
        })
      }
    },
    [getToken, toast],
  )

  const getFileIcon = useCallback((format: string) => {
    switch (format?.toLowerCase()) {
      case "docx":
      case "doc":
        return <FileText className="h-4 w-4 text-primary" />
      case "pdf":
        return <AlertCircle className="h-4 w-4 text-destructive" />
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />
    }
  }, [])

  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case "completed":
        return "bg-primary/10 text-primary border-primary/20"
      case "processing":
        return "bg-accent text-accent-foreground border-accent"
      case "failed":
        return "bg-destructive/10 text-destructive border-destructive/20"
      default:
        return "bg-secondary text-secondary-foreground border-border"
    }
  }, [])

  const getRowClassName = useCallback((status: string) => {
    switch (status) {
      case "completed":
        return "bg-primary/5 border-l-2 border-primary"
      case "processing":
        return "bg-accent/10"
      case "queued":
        return ""
      case "failed":
        return "bg-destructive/5 border-l-2 border-destructive"
      default:
        return "bg-secondary/20"
    }
  }, [])

  if (documentsError) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">My Documents</h1>
            <p className="text-sm sm:text-base text-destructive">Error loading documents</p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="self-start sm:self-auto bg-transparent"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="p-4 md:pt-6">
            <div className="text-center py-8 md:py-12">
              <AlertCircle className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-destructive" />
              <h3 className="text-base sm:text-lg font-medium mb-2">Failed to load documents</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-3 md:mb-4">{documentsError}</p>
              <Button onClick={handleRefresh} size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (documentsLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">My Documents</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Loading your documents...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-3 md:space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 md:h-16 bg-secondary/50 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Documents</h1>
            {isPremium && (
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
                <Crown className="h-3 w-3 mr-1" />
                {planName}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">Manage and organize your formatted documents</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleRefresh} disabled={documentsLoading} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/upload" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Upload New</span>
              <span className="sm:hidden">Upload</span>
            </Link>
          </Button>
        </div>
      </div>

      {limits && (limits.documentsAtLimit || limits.apiCallsAtLimit || limits.storageAtLimit) && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-900 dark:text-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
            <span className="flex-1">
              <strong>Usage Limit Reached:</strong> You've reached your plan limits.
              {!isPremium && " Upgrade to continue formatting documents."}
            </span>
            <Button size="sm" variant="outline" asChild className="self-start sm:self-auto bg-transparent">
              <Link href="/dashboard/upgrade">{isPremium ? "Change Plan" : "Upgrade Now"}</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFiltersModal(true)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>
        {(searchTerm || statusFilter !== "all" || styleFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm("")
              setStatusFilter("all")
              setStyleFilter("all")
              setSortBy("updated")
            }}
            className="text-xs"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {showFiltersModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <Card className="w-full sm:w-96 m-4 max-h-[80vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Filters & Search</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowFiltersModal(false)} className="h-6 w-6">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="formatted">Formatted</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Style</label>
                <Select value={styleFilter} onValueChange={setStyleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Styles</SelectItem>
                    <SelectItem value="APA">APA</SelectItem>
                    <SelectItem value="MLA">MLA</SelectItem>
                    <SelectItem value="Chicago">Chicago</SelectItem>
                    <SelectItem value="Harvard">Harvard</SelectItem>
                    <SelectItem value="IEEE">IEEE</SelectItem>
                    <SelectItem value="AP">AP</SelectItem>
                    <SelectItem value="OSCOLA">OSCOLA</SelectItem>
                    <SelectItem value="Vancouver">Vancouver</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated">Recently Updated</SelectItem>
                    <SelectItem value="created">Recently Created</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="size">File Size (Large)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={() => setShowFiltersModal(false)} className="w-full">
                Apply Filters
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            {filteredDocuments.length} Document{filteredDocuments.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedDocs.length === filteredDocuments.length && filteredDocuments.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Style</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="hidden lg:table-cell">Size</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id} className={getRowClassName(doc.status)}>
                      <TableCell>
                        <Checkbox
                          checked={selectedDocs.includes(doc.id)}
                          onCheckedChange={() => toggleDocSelection(doc.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getFileIcon(doc.format || "")}
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{doc.original_filename}</span>
                            {doc.tracked_changes && (
                              <Badge variant="outline" className="w-fit text-[10px] h-4 px-1 py-0 mt-0.5 border-primary/30 text-primary bg-primary/5">
                                Tracked
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{doc.style_applied || "-"}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs md:text-sm text-muted-foreground">
                        {formatDate(doc.created_at)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs md:text-sm text-muted-foreground">
                        {formatFileSize(doc.file_size)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={getStatusBadge(doc.status)}>
                          {getStatusIcon(doc.status)}
                          <span className="ml-1 capitalize text-xs sm:text-sm">{doc.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {doc.status === "formatted" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadDocument(doc)}
                              disabled={downloadingDocs.has(doc.id)}
                            >
                              {downloadingDocs.has(doc.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              {doc.status === "formatted" && (
                                <DropdownMenuItem onClick={() => handleDownloadDocument(doc)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {doc.status === "failed" && (
                                <DropdownMenuItem onClick={() => handleRetryProcessing(doc)}>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Retry
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href="/dashboard/upload">Upload New Document</Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 md:py-12">
              <FileText className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 text-muted-foreground/50" />
              <h3 className="text-base md:text-lg font-medium mb-2">No documents yet</h3>
              <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
                Upload your first document to get started
              </p>
              <Button asChild>
                <Link href="/dashboard/upload" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Upload First Document
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedDocs.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 bg-background border rounded-lg p-4 shadow-lg flex items-center justify-between gap-4">
          <span className="text-sm font-medium">{selectedDocs.length} selected</span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}
    </div>
  )
}
