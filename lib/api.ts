// API service for backend communication
// This will be used when the actual backend is ready

import { logger } from "./logger"

const API_BASE_URL =
  process.env.NODE_ENV === "production" ? process.env.NEXT_PUBLIC_SITE_URL || "" : "http://localhost:3000"

export interface ProcessDocumentRequest {
  filename: string
  content: string // base64 encoded file content
  style: string
  englishVariant: string
  trackedChanges: boolean
  options?: {
    include_toc?: boolean
    page_numbers?: string
    margins?: string
  }
}

export interface ProcessDocumentResponse {
  success: boolean
  job_id: string
  status: "draft" | "processing"
  message: string
}

export interface DocumentStatusResponse {
  success: boolean
  job_id: string
  status: "draft" | "processing" | "formatted" | "failed"
  progress: number
  result_url?: string
  error?: string
}

export interface FormattedDocumentResponse {
  success: boolean
  filename: string
  content: string // base64 encoded formatted document
  tracked_changes_content?: string
  metadata: {
    style?: string
    [key: string]: any
  }
}

export class DocumentAPI {
  private static async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`
    const method = options.method || "GET"

    const startTime = performance.now()

    logger.apiRequest(method, url, {
      headers: options.headers,
      body: options.body ? "present" : "none",
    })

    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      })

      const endTime = performance.now()
      const duration = Math.round(endTime - startTime)

      logger.apiResponse(method, url, response.status, duration)

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()
      return responseData
    } catch (error) {
      const endTime = performance.now()
      const duration = Math.round(endTime - startTime)

      logger.error(`API ${method} request failed`, error, { url, duration })
      throw error
    }
  }

  static async processDocument(data: ProcessDocumentRequest): Promise<ProcessDocumentResponse> {
    logger.info("Processing document", {
      style: data.style,
      englishVariant: data.englishVariant,
      trackedChanges: data.trackedChanges,
      filename: data.filename,
    })

    return this.request("/api/documents/process", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  static async getDocumentStatus(jobId: string): Promise<DocumentStatusResponse> {
    logger.debug("Checking document status", { jobId })
    return this.request(`/api/documents/status/${jobId}`)
  }

  static async downloadFormattedDocument(jobId: string): Promise<FormattedDocumentResponse> {
    logger.debug("Downloading formatted document", { jobId })
    return this.request(`/api/documents/download/${jobId}`)
  }

  static async uploadFile(file: File): Promise<{ success: boolean; file_id: string }> {
    logger.info("Uploading file", {
      name: file.name,
      size: file.size,
      type: file.type,
    })

    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    logger.info("File uploaded successfully", { fileId: result.file_id })
    return result
  }

  static async getFormattingStyles(): Promise<any[]> {
    logger.debug("Fetching formatting styles")
    return this.request("/api/formatting/styles")
  }

  static async getEnglishVariants(): Promise<any[]> {
    logger.debug("Fetching English variants")
    return this.request("/api/formatting/variants")
  }

  // User preferences don't need to be sent to the FastAPI backend
}

// Utility function to convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      // Remove the data:application/...;base64, prefix
      const base64 = result.split(",")[1]
      resolve(base64)
    }
    reader.onerror = (error) => reject(error)
  })
}
