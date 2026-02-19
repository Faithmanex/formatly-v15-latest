"use client"

import { useCallback } from "react"

interface CacheItem<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface CacheOptions {
  ttl?: number
  storage?: "localStorage" | "sessionStorage"
}

const DEFAULT_TTL = 5 * 60 * 1000
const DEFAULT_STORAGE = "localStorage"

export function useCacheStorage() {
  const getStorage = useCallback((storageType: "localStorage" | "sessionStorage" = DEFAULT_STORAGE) => {
    if (typeof window === "undefined") return null
    return storageType === "localStorage" ? localStorage : sessionStorage
  }, [])

  const setCache = useCallback(
    (key: string, data: any, options: CacheOptions = {}) => {
      const { ttl = DEFAULT_TTL, storage = DEFAULT_STORAGE } = options
      const storageInstance = getStorage(storage)

      if (!storageInstance) return

      const cacheItem: CacheItem<any> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      }

      try {
        storageInstance.setItem(key, JSON.stringify(cacheItem))
      } catch (error) {
        console.warn(`Failed to cache data for key ${key}:`, error)
      }
    },
    [getStorage],
  )

  const getCache = useCallback(
    (key: string, options: CacheOptions = {}): any | null => {
      const { storage = DEFAULT_STORAGE } = options
      const storageInstance = getStorage(storage)

      if (!storageInstance) return null

      try {
        const cached = storageInstance.getItem(key)
        if (!cached) return null

        const cacheItem: CacheItem<any> = JSON.parse(cached)

        if (Date.now() > cacheItem.expiresAt) {
          storageInstance.removeItem(key)
          return null
        }

        return cacheItem.data
      } catch (error) {
        console.warn(`Failed to retrieve cache for key ${key}:`, error)
        return null
      }
    },
    [getStorage],
  )

  const clearCache = useCallback(
    (key: string, options: CacheOptions = {}) => {
      const { storage = DEFAULT_STORAGE } = options
      const storageInstance = getStorage(storage)

      if (!storageInstance) return

      try {
        storageInstance.removeItem(key)
      } catch (error) {
        console.warn(`Failed to clear cache for key ${key}:`, error)
      }
    },
    [getStorage],
  )

  const clearAllCache = useCallback(
    (prefix?: string, options: CacheOptions = {}) => {
      const { storage = DEFAULT_STORAGE } = options
      const storageInstance = getStorage(storage)

      if (!storageInstance) return

      try {
        if (prefix) {
          const keys = Object.keys(storageInstance)
          keys.forEach((key) => {
            if (key.startsWith(prefix)) {
              storageInstance.removeItem(key)
            }
          })
        } else {
          storageInstance.clear()
        }
      } catch (error) {
        console.warn("Failed to clear cache:", error)
      }
    },
    [getStorage],
  )

  return {
    setCache,
    getCache,
    clearCache,
    clearAllCache,
  }
}
