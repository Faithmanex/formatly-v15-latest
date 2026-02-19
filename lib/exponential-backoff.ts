export interface BackoffOptions {
  initialDelay?: number
  maxDelay?: number
  maxRetries?: number
  factor?: number
  jitter?: boolean
}

export class ExponentialBackoff {
  private initialDelay: number
  private maxDelay: number
  private maxRetries: number
  private factor: number
  private jitter: boolean

  constructor(options: BackoffOptions = {}) {
    this.initialDelay = options.initialDelay ?? 1000 // 1 second
    this.maxDelay = options.maxDelay ?? 32000 // 32 seconds
    this.maxRetries = options.maxRetries ?? 5
    this.factor = options.factor ?? 2
    this.jitter = options.jitter ?? true
  }

  async execute<T>(fn: () => Promise<T>, onRetry?: (attempt: number, delay: number, error: Error) => void): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (attempt === this.maxRetries) {
          throw lastError
        }

        const delay = this.calculateDelay(attempt)

        if (onRetry) {
          onRetry(attempt + 1, delay, lastError)
        }

        await this.sleep(delay)
      }
    }

    throw lastError || new Error("Max retries exceeded")
  }

  private calculateDelay(attempt: number): number {
    let delay = Math.min(this.initialDelay * Math.pow(this.factor, attempt), this.maxDelay)

    if (this.jitter) {
      // Add random jitter (±25%)
      const jitterAmount = delay * 0.25
      delay = delay + (Math.random() * jitterAmount * 2 - jitterAmount)
    }

    return Math.floor(delay)
  }

  public getDelay(attempt: number): number {
    return this.calculateDelay(attempt)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Pre-configured instances for common use cases
export const defaultBackoff = new ExponentialBackoff()

export const aggressiveBackoff = new ExponentialBackoff({
  initialDelay: 500,
  maxDelay: 16000,
  maxRetries: 3,
  factor: 2,
})

export const conservativeBackoff = new ExponentialBackoff({
  initialDelay: 2000,
  maxDelay: 64000,
  maxRetries: 7,
  factor: 2,
})
