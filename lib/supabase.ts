import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "./types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") {
    // For SSR, create a new client each time
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
      db: {
        schema: "public",
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      global: {
        headers: {
          "x-client-timeout": "30000",
        },
      },
    })
  }

  if (!browserClient || !(window as any).__supabase_client) {
    browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
      db: {
        schema: "public",
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      global: {
        headers: {
          "x-client-timeout": "30000",
        },
      },
    })
    ;(window as any).__supabase_client = browserClient
  } else {
    browserClient = (window as any).__supabase_client
  }

  return browserClient
}

export const supabase = getSupabaseBrowserClient()

export type { Database }
