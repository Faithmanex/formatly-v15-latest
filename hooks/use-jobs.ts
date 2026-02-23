"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/components/auth-provider"

export interface Job {
  id: string
  filename: string
  original_filename: string
  status: "draft" | "processing" | "formatted" | "failed"
  style_applied: string
  created_at: string
  updated_at: string
  file_size: number | null
  tracked_changes: boolean
  formatting_time: number | null
  language_variant: string | null
  storage_location: string | null
  tracked_changes_url: string | null
}

export function useJobs() {
  const { user, getToken } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const token = await getToken()
      const response = await fetch("/api/jobs", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!response.ok) {
        throw new Error("Failed to fetch jobs")
      }

      const data = await response.json()
      setJobs(data.jobs || [])
      setError(null)
    } catch (err) {
      console.error("Error fetching jobs:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }, [user, getToken])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  return { jobs, loading, error, refreshJobs: fetchJobs }
}
