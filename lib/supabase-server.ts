import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Creates a Supabase client for server-side operations (Server Components, Route Handlers, Server Actions)
 * This client properly handles cookie-based session management for SSR
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set(name, value, options)
        } catch (error) {
          // Handle cookie setting errors in middleware
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set(name, "", { ...options, maxAge: 0 })
        } catch (error) {
          // Handle cookie removal errors in middleware
        }
      },
    },
  })
}

/**
 * Gets the authenticated user from server-side context
 * Returns null if not authenticated
 */
export async function getServerUser() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Verifies user authentication and returns user or throws error
 * Use this in API routes that require authentication
 */
export async function requireServerAuth() {
  const user = await getServerUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  return user
}
