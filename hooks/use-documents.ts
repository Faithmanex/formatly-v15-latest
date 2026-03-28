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

interface UploadDocumentOptions {
  style?: string
  trackedChanges?: boolean
  englishVariant?: string
  [key: string]: unknown
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
    onSuccess: (data) => {},
  })

  const uploadDocument = useCallback(
    async (file: File, options: UploadDocumentOptions) => {
      if (!user?.id) throw new Error("User not authenticated")

      try {
        // Upload the actual document
        const uploadedDoc = await documentService.uploadDocument(file, {
          ...options,
          userId: user.id,
        })

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
    [user?.id, clearCache, refresh],
  )

  const deleteDocument = useCallback(
    async (documentId: string) => {
      if (!user?.id) throw new Error("User not authenticated")

      try {
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
    [user?.id, clearCache, refresh],
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
