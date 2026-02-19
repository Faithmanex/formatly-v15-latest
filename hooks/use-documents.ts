"use client"

import { useCallback } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRealtimeData } from "./use-realtime-data"
import { documentService } from "@/lib/database"
import { useCacheStorage } from "./use-cache-storage"

export interface Document {
  id: string
  user_id: string
  filename: string
  original_filename: string
  file_size: number
  file_type: string
  status: "pending" | "processing" | "completed" | "failed"
  formatting_style: string
  created_at: string
  updated_at: string
  processed_at?: string
  download_url?: string
  report_url?: string
}

export function useDocuments() {
  const { user } = useAuth()
  const { clearCache } = useCacheStorage()

  const {
    data: documents,
    isLoading,
    error,
    isStale,
    lastUpdated,
    refresh,
  } = useRealtimeData<Document[]>({
    table: "documents",
    select: "*",
    filter: user?.id ? { column: "user_id", value: user.id } : undefined,
    cacheKey: `documents_${user?.id || "anonymous"}`,
    cacheTTL: 2 * 60 * 1000, // 2 minutes for documents (more frequent updates)
    retryAttempts: 3,
    retryDelay: 1000,
    onError: (error) => {
      console.error("[v0] Documents fetch error:", error)
    },
    onSuccess: (data) => {
      console.log("[v0] Documents loaded successfully:", data?.length || 0)
    },
  })

  const uploadDocument = useCallback(
    async (file: File, options: any) => {
      if (!user?.id) throw new Error("User not authenticated")

      try {
        console.log("[v0] Uploading document:", file.name)

        const optimisticDoc: Document = {
          id: `temp_${Date.now()}`,
          user_id: user.id,
          filename: file.name,
          original_filename: file.name,
          file_size: file.size,
          file_type: file.type,
          status: "pending",
          formatting_style: options.style || "APA",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const currentDocs = documents || []
        const optimisticDocs = [optimisticDoc, ...currentDocs]

        // Upload the actual document
        const uploadedDoc = await documentService.uploadDocument(file, options)

        if (uploadedDoc) {
          clearCache(`documents_${user.id}`)
          refresh()
          return uploadedDoc
        }

        return null
      } catch (error) {
        console.error("[v0] Error uploading document:", error)
        refresh()
        throw error
      }
    },
    [user?.id, documents, clearCache, refresh],
  )

  const deleteDocument = useCallback(
    async (documentId: string) => {
      if (!user?.id) throw new Error("User not authenticated")

      try {
        console.log("[v0] Deleting document:", documentId)

        const currentDocs = documents || []
        const optimisticDocs = currentDocs.filter((doc) => doc.id !== documentId)

        // Delete the actual document
        await documentService.deleteDocument(documentId)

        clearCache(`documents_${user.id}`)
        refresh()
      } catch (error) {
        console.error("[v0] Error deleting document:", error)
        refresh()
        throw error
      }
    },
    [user?.id, documents, clearCache, refresh],
  )

  return {
    documents: documents || [],
    isLoading: !user?.id ? false : isLoading,
    error,
    isStale,
    lastUpdated,
    refresh,
    uploadDocument,
    deleteDocument,
  }
}
