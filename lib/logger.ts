/**
 * Centralized logging utility for Formatly
 * Provides environment-aware logging with different levels
 */

type LogLevel = "debug" | "info" | "warn" | "error"

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private isDevelopment: boolean
  private isProduction: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development"
    this.isProduction = process.env.NODE_ENV === "production"
  }

  /**
   * Debug logs - only shown in development
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, context || "")
    }
  }

  /**
   * Info logs - shown in development, minimal in production
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, context || "")
    }
  }

  /**
   * Warning logs - shown in all environments
   */
  warn(message: string, context?: LogContext): void {
    console.warn(`[WARN] ${message}`, context || "")
  }

  /**
   * Error logs - shown in all environments
   */
  error(message: string, error?: unknown, context?: LogContext): void {
    console.error(`[ERROR] ${message}`, error || "", context || "")
  }

  /**
   * API request logging
   */
  apiRequest(method: string, url: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`[API] ${method} ${url}`, context || "")
    }
  }

  /**
   * API response logging
   */
  apiResponse(method: string, url: string, status: number, duration: number): void {
    if (this.isDevelopment) {
      const emoji = status >= 200 && status < 300 ? "✅" : "❌"
      console.log(`[API] ${emoji} ${method} ${url} - ${status} (${duration}ms)`)
    }
  }

  /**
   * Real-time subscription logging
   */
  realtime(event: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`[REALTIME] ${event}`, context || "")
    }
  }

  /**
   * Authentication logging
   */
  auth(event: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`[AUTH] ${event}`, context || "")
    }
  }

  /**
   * Cache logging
   */
  cache(event: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`[CACHE] ${event}`, context || "")
    }
  }
}

// Export singleton instance
export const logger = new Logger()
