"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useCacheStorage } from "./use-cache-storage"

interface RealtimeDataOptions<T> {
  table: string
  select?: string
  filter?: { column: string; value: any }
  cacheKey: string
  cacheTTL?: number
  retryAttempts?: number
  retryDelay?: number
  onError?: (error: Error) => void
  onSuccess?: (data: T) => void
}

interface RealtimeDataState<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  isStale: boolean
  lastUpdated: number | null
}

export function useRealtimeData<T>(options: RealtimeDataOptions<T>) {
  const {
    table,
    select = "*",
    filter,
    cacheKey,
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    retryAttempts = 3,
    retryDelay = 1000,
    onError,
    onSuccess,
  } = options

  const { getCache, setCache, clearCache } = useCacheStorage()
  const [state, setState] = useState<RealtimeDataState<T>>({
    data: null,
    isLoading: true,
    error: null,
    isStale: false,
    lastUpdated: null,
  })

  const retryCountRef = useRef(0)
  const subscriptionRef = useRef<any>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    const cachedData = getCache<T>(cacheKey, { ttl: cacheTTL })
    if (cachedData) {
      console.log(`[v0] Loaded cached data for ${cacheKey}`)
      setState((prev) => ({
        ...prev,
        data: cachedData,
        isLoading: false,
        isStale: true, // Mark as stale to trigger background refresh
        lastUpdated: Date.now(),
      }))
    }
  }, [cacheKey, cacheTTL, getCache])

  const fetchData = useCallback(
    async (isRetry = false) => {
      if (!mountedRef.current) return

      try {
        if (!isRetry) {
          setState((prev) => ({ ...prev, isLoading: true, error: null }))
        }

        let query = supabase.from(table).select(select)

        if (filter) {
          query = query.eq(filter.column, filter.value)
        }

        const { data, error } = await query

        if (!mountedRef.current) return

        if (error) throw error

        setCache(cacheKey, data, { ttl: cacheTTL })

        setState((prev) => ({
          ...prev,
          data: data as T,
          isLoading: false,
          error: null,
          isStale: false,
          lastUpdated: Date.now(),
        }))

        retryCountRef.current = 0
        onSuccess?.(data as T)
        console.log(`[v0] Successfully fetched data for ${cacheKey}`)
      } catch (error) {
        if (!mountedRef.current) return

        const err = error as Error
        console.error(`[v0] Error fetching data for ${cacheKey}:`, err)

        if (retryCountRef.current < retryAttempts) {
          retryCountRef.current++
          const delay = retryDelay * Math.pow(2, retryCountRef.current - 1)

          console.log(`[v0] Retrying ${cacheKey} in ${delay}ms (attempt ${retryCountRef.current}/${retryAttempts})`)

          setTimeout(() => {
            if (mountedRef.current) {
              fetchData(true)
            }
          }, delay)
          return
        }

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err,
          // Keep existing data if available
          isStale: prev.data !== null,
        }))

        onError?.(err)
      }
    },
    [table, select, filter, cacheKey, cacheTTL, retryAttempts, retryDelay, setCache, onSuccess, onError],
  )

  useEffect(() => {
    if (!table) return

    console.log(`[v0] Setting up realtime subscription for ${table}`)

    const subscription = supabase
      .channel(`${table}_changes`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
          ...(filter && { filter: `${filter.column}=eq.${filter.value}` }),
        },
        (payload) => {
          console.log(`[v0] Realtime update for ${table}:`, payload)

          clearCache(cacheKey)
          fetchData()
        },
      )
      .subscribe()

    subscriptionRef.current = subscription

    return () => {
      if (subscriptionRef.current) {
        console.log(`[v0] Cleaning up realtime subscription for ${table}`)
        supabase.removeChannel(subscriptionRef.current)
      }
    }
  }, [table, filter, cacheKey, clearCache, fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
    }
  }, [])

  const refresh = useCallback(() => {
    retryCountRef.current = 0
    clearCache(cacheKey)
    fetchData()
  }, [cacheKey, clearCache, fetchData])

  return {
    ...state,
    refresh,
  }
}
