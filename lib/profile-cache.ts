import type { Profile } from "@/components/auth-provider"
import { logger } from "./logger"

interface CachedProfile {
  profile: Profile
  timestamp: number
  expiresAt: number
  version: string // Add versioning for cache invalidation
  checksum: string // Add integrity check
}

const PROFILE_CACHE_KEY = "formatly_profile_cache"
const CACHE_DURATION = 15 * 60 * 1000 // 15 minutes in milliseconds
const CACHE_VERSION = "1.0" // Increment when profile structure changes
const MAX_COOKIE_SIZE = 3800 // Safe cookie size limit (4KB - overhead)

export class ProfileCacheService {
  /**
   * Generate simple checksum for data integrity
   */
  private static generateChecksum(data: string): string {
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Safely encode data with size validation
   */
  private static safeEncode(data: CachedProfile): string | null {
    try {
      const jsonString = JSON.stringify(data)
      const encoded = btoa(jsonString)

      // Check if encoded data exceeds safe cookie size
      if (encoded.length > MAX_COOKIE_SIZE) {
        logger.warn("Profile data too large for cookie storage", { size: encoded.length })
        return null
      }

      return encoded
    } catch (error) {
      logger.error("Failed to encode profile data", error)
      return null
    }
  }

  /**
   * Safely decode data with integrity validation
   */
  private static safeDecode(encoded: string): CachedProfile | null {
    try {
      // Validate base64 format
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) {
        logger.warn("Invalid base64 format in cache")
        return null
      }

      const jsonString = atob(encoded)

      // Validate JSON format before parsing
      if (!jsonString.startsWith("{") || !jsonString.endsWith("}")) {
        logger.warn("Invalid JSON format in cache")
        return null
      }

      const cachedData: CachedProfile = JSON.parse(jsonString)

      // Validate required fields
      if (!cachedData.profile || !cachedData.timestamp || !cachedData.expiresAt) {
        logger.warn("Missing required fields in cached data")
        return null
      }

      // Validate version compatibility
      if (cachedData.version !== CACHE_VERSION) {
        logger.cache("Cache version mismatch, invalidating")
        return null
      }

      // Validate checksum if present
      if (cachedData.checksum) {
        const expectedChecksum = this.generateChecksum(JSON.stringify(cachedData.profile))
        if (cachedData.checksum !== expectedChecksum) {
          logger.warn("Cache integrity check failed")
          return null
        }
      }

      return cachedData
    } catch (error) {
      logger.error("Failed to decode profile cache", error)
      return null
    }
  }

  /**
   * Store profile data in cookie with enhanced security
   */
  static setProfileCache(profile: Profile): void {
    try {
      const now = Date.now()
      const checksum = this.generateChecksum(JSON.stringify(profile))

      const cachedData: CachedProfile = {
        profile,
        timestamp: now,
        expiresAt: now + CACHE_DURATION,
        version: CACHE_VERSION,
        checksum,
      }

      const cookieValue = this.safeEncode(cachedData)
      if (!cookieValue) {
        logger.warn("Profile too large for caching")
        return
      }

      const expiryDate = new Date(cachedData.expiresAt)
      const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.protocol === "http:")
      const cookieString = `${PROFILE_CACHE_KEY}=${cookieValue}; expires=${expiryDate.toUTCString()}; path=/; ${isLocal ? "" : "secure;"} samesite=strict; httponly=false`

      // Validate cookie string length
      if (cookieString.length > 4000) {
        return
      }

      document.cookie = cookieString
      logger.cache("Profile cached", { profileId: profile.id })
    } catch (error) {
      logger.error("Failed to cache profile", error)
    }
  }

  /**
   * Retrieve profile data from cookie with enhanced validation
   */
  static getProfileCache(): Profile | null {
    try {
      const cookies = document.cookie.split(";")
      const profileCookie = cookies.find((cookie) => cookie.trim().startsWith(`${PROFILE_CACHE_KEY}=`))

      if (!profileCookie) {
        return null
      }

      const cookieValue = profileCookie.split("=")[1]?.trim()
      if (!cookieValue) {
        logger.warn("Empty cookie value found")
        this.clearProfileCache()
        return null
      }

      const cachedData = this.safeDecode(cookieValue)
      if (!cachedData) {
        logger.warn("Failed to decode cache, clearing")
        this.clearProfileCache()
        return null
      }

      const now = Date.now()
      if (now > cachedData.expiresAt) {
        logger.cache("Profile cache expired, removing")
        this.clearProfileCache()
        return null
      }

      logger.cache("Profile cache hit", { profileId: cachedData.profile.id })
      return cachedData.profile
    } catch (error) {
      logger.error("Failed to retrieve profile cache", error)
      this.clearProfileCache()
      return null
    }
  }

  /**
   * Check if cached profile is valid and not expired
   */
  static isCacheValid(): boolean {
    try {
      const cookies = document.cookie.split(";")
      const profileCookie = cookies.find((cookie) => cookie.trim().startsWith(`${PROFILE_CACHE_KEY}=`))

      if (!profileCookie) return false

      const cookieValue = profileCookie.split("=")[1]?.trim()
      if (!cookieValue) return false

      const cachedData = this.safeDecode(cookieValue)
      if (!cachedData) return false

      return Date.now() < cachedData.expiresAt
    } catch (error) {
      logger.error("Cache validation error", error)
      return false
    }
  }

  /**
   * Clear profile cache (used on logout or when cache is corrupted)
   */
  static clearProfileCache(): void {
    try {
      document.cookie = `${PROFILE_CACHE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict`
      logger.cache("Profile cache cleared")
    } catch (error) {
      logger.error("Failed to clear profile cache", error)
    }
  }

  /**
   * Get comprehensive cache metadata for debugging
   */
  static getCacheInfo(): {
    exists: boolean
    valid: boolean
    expiresAt?: number
    age?: number
    version?: string
    hasChecksum?: boolean
    size?: number
    error?: string
  } {
    try {
      const cookies = document.cookie.split(";")
      const profileCookie = cookies.find((cookie) => cookie.trim().startsWith(`${PROFILE_CACHE_KEY}=`))

      if (!profileCookie) {
        return { exists: false, valid: false }
      }

      const cookieValue = profileCookie.split("=")[1]?.trim()
      if (!cookieValue) {
        return { exists: true, valid: false, error: "Empty cookie value" }
      }

      const cachedData = this.safeDecode(cookieValue)
      if (!cachedData) {
        return {
          exists: true,
          valid: false,
          size: cookieValue.length,
          error: "Failed to decode cache data",
        }
      }

      const now = Date.now()
      const isValid = now < cachedData.expiresAt

      return {
        exists: true,
        valid: isValid,
        expiresAt: cachedData.expiresAt,
        age: now - cachedData.timestamp,
        version: cachedData.version,
        hasChecksum: !!cachedData.checksum,
        size: cookieValue.length,
      }
    } catch (error) {
      return {
        exists: false,
        valid: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Force refresh cache by clearing it (will trigger fresh fetch)
   */
  static forceRefresh(): void {
    logger.cache("Forcing profile cache refresh")
    this.clearProfileCache()
  }

  /**
   * Invalidate cache when profile data changes
   */
  static invalidateOnUpdate(profileId: string): void {
    try {
      const cachedProfile = this.getProfileCache()
      if (cachedProfile && cachedProfile.id === profileId) {
        logger.cache("Invalidating cache due to profile update", { profileId })
        this.clearProfileCache()
      }
    } catch (error) {
      logger.error("Failed to invalidate cache", error)
    }
  }

  /**
   * Set cache with custom expiry time
   */
  static setProfileCacheWithExpiry(profile: Profile, expiryMinutes = 15): void {
    try {
      const now = Date.now()
      const customExpiry = expiryMinutes * 60 * 1000
      const checksum = this.generateChecksum(JSON.stringify(profile))

      const cachedData: CachedProfile = {
        profile,
        timestamp: now,
        expiresAt: now + customExpiry,
        version: CACHE_VERSION,
        checksum,
      }

      const cookieValue = this.safeEncode(cachedData)
      if (!cookieValue) {
        logger.warn("Profile too large for caching with custom expiry")
        return
      }

      const expiryDate = new Date(cachedData.expiresAt)
      const cookieString = `${PROFILE_CACHE_KEY}=${cookieValue}; expires=${expiryDate.toUTCString()}; path=/; secure; samesite=strict; httponly=false`

      if (cookieString.length > 4000) {
        logger.warn("Cookie string too long for custom expiry")
        return
      }

      document.cookie = cookieString
      logger.cache(`Profile cached with ${expiryMinutes}m expiry`, { profileId: profile.id })
    } catch (error) {
      logger.error("Failed to cache profile with custom expiry", error)
    }
  }

  /**
   * Refresh cache if older than specified minutes
   */
  static shouldRefresh(maxAgeMinutes = 10): boolean {
    try {
      const info = this.getCacheInfo()
      if (!info.exists || !info.valid) return true

      const ageMinutes = (info.age || 0) / (60 * 1000)
      return ageMinutes > maxAgeMinutes
    } catch (error) {
      return true
    }
  }
}
