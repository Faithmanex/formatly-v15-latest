import { ProfileCacheService } from "@/lib/profile-cache"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { logger } from "./logger"

const supabase = getSupabaseBrowserClient()

export class LogoutHandler {
  static async performSecureLogout(): Promise<void> {
    try {
      logger.auth("Performing secure logout with cache cleanup")

      ProfileCacheService.clearProfileCache()
      this.clearAllApplicationCookies()
      this.clearApplicationStorage()

      await supabase.auth.signOut()

      window.location.href = "/"

      logger.auth("Secure logout completed successfully")
    } catch (error) {
      logger.error("Error during secure logout", error)
      ProfileCacheService.clearProfileCache()
      this.clearAllApplicationCookies()
      window.location.href = "/"
      throw error
    }
  }

  private static clearAllApplicationCookies(): void {
    try {
      const cookies = document.cookie.split(";")
      const appCookiePrefixes = ["formatly_", "auth_", "session_", "user_", "preferences_"]

      cookies.forEach((cookie) => {
        const cookieName = cookie.split("=")[0].trim()
        const shouldClear = appCookiePrefixes.some((prefix) => cookieName.startsWith(prefix))

        if (shouldClear) {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict`
          logger.debug("Cleared cookie", { cookieName })
        }
      })
    } catch (error) {
      logger.error("Error clearing application cookies", error)
    }
  }

  private static clearApplicationStorage(): void {
    try {
      const storageKeys = ["formatly_preferences", "formatly_cache", "user_settings", "document_cache"]

      storageKeys.forEach((key) => {
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
      })

      logger.debug("Cleared application storage")
    } catch (error) {
      logger.error("Error clearing application storage", error)
    }
  }

  static emergencyLogout(): void {
    logger.auth("Performing emergency logout")

    ProfileCacheService.clearProfileCache()
    this.clearAllApplicationCookies()
    this.clearApplicationStorage()

    window.location.href = "/"
  }

  static shouldForceLogout(): boolean {
    try {
      const cacheInfo = ProfileCacheService.getCacheInfo()

      if (cacheInfo.exists && !cacheInfo.valid && cacheInfo.age && cacheInfo.age > 24 * 60 * 60 * 1000) {
        logger.auth("Forcing logout due to stale invalid cache")
        return true
      }

      return false
    } catch (error) {
      logger.error("Error checking logout conditions", error)
      return false
    }
  }
}
