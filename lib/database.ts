import { getSupabaseBrowserClient } from "./supabase"
import { withTimeout } from "./utils"
import type { Database } from "./types"

const supabase = getSupabaseBrowserClient()

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type Document = Database["public"]["Tables"]["documents"]["Row"]
type CustomStyle = Database["public"]["Tables"]["custom_styles"]["Row"]
type Notification = Database["public"]["Tables"]["notifications"]["Row"]

// Added comprehensive document service with timeout handling
export const documentService = {
  async getDocuments(
    userId: string,
    filters?: { status?: string; style?: string; search?: string },
  ): Promise<Document[]> {
    try {
      let query = supabase.from("documents").select("*").eq("user_id", userId).order("updated_at", { ascending: false })

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status)
      }
      if (filters?.style && filters.style !== "all") {
        query = query.eq("style_applied", filters.style)
      }
      if (filters?.search) {
        query = query.or(`filename.ilike.%${filters.search}%,original_filename.ilike.%${filters.search}%`)
      }

      const { data, error } = await withTimeout(query, 10000, "Get documents")

      if (error) {
        console.error("Error fetching documents:", error)
        throw new Error(`Failed to fetch documents: ${error.message}`)
      }
      return data || []
    } catch (error) {
      console.error("Error in getDocuments:", error)
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new Error("Documents request timed out. Please try again.")
      }
      throw error
    }
  },

  async createDocument(document: Database["public"]["Tables"]["documents"]["Insert"]): Promise<Document | null> {
    try {
      const { data, error } = await withTimeout(
        supabase.from("documents").insert(document).select().single(),
        8000,
        "Create document",
      )

      if (error) {
        console.error("Error creating document:", error)
        return null
      }
      return data
    } catch (error) {
      console.error("Error in createDocument:", error)
      return null
    }
  },

  async updateDocument(
    id: string,
    updates: Database["public"]["Tables"]["documents"]["Update"],
  ): Promise<Document | null> {
    try {
      const { data, error } = await withTimeout(
        supabase.from("documents").update(updates).eq("id", id).select().single(),
        8000,
        "Update document",
      )

      if (error) {
        console.error("Error updating document:", error)
        return null
      }
      return data
    } catch (error) {
      console.error("Error in updateDocument:", error)
      return null
    }
  },

  async deleteDocument(id: string): Promise<boolean> {
    try {
      const { error } = await withTimeout(supabase.from("documents").delete().eq("id", id), 8000, "Delete document")

      if (error) {
        console.error("Error deleting document:", error)
        return false
      }
      return true
    } catch (error) {
      console.error("Error in deleteDocument:", error)
      return false
    }
  },
}

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    try {

      const { data, error } = await withTimeout(
        supabase.from("profiles").select("*").eq("id", userId).single(),
        5000, // Reduced timeout
        "Get profile",
      )

      if (error) {
        console.error("Error fetching profile:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in getProfile:", error)
      return null
    }
  },

  // NEW METHOD: Added specifically for auth operations (no timeout)
  async getProfileForAuth(userId: string): Promise<Profile | null> {
    try {

      // No timeout wrapper - let auth operations take as long as they need
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("Error fetching profile for auth:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in getProfileForAuth:", error)
      return null
    }
  },

  async getUserFormattingPreferences(userId: string): Promise<{
    defaultStyle?: string
    englishVariant?: string
    reportOnly?: boolean
    includeComments?: boolean
    preserveFormatting?: boolean
  } | null> {
    try {
      const { data, error } = await withTimeout(
        supabase.from("profiles").select("formatting_preferences").eq("id", userId).single(),
        8000,
        "Get user formatting preferences",
      )

      if (error) {
        console.error("Error fetching user formatting preferences:", error)
        return null
      }
      return data?.formatting_preferences || null
    } catch (error) {
      console.error("Error in getUserFormattingPreferences:", error)
      return null
    }
  },

  async incrementDocumentUsage(userId: string): Promise<boolean> {
    try {
      console.log(`Incrementing document usage for user: ${userId}`)

      const { data, error } = await withTimeout(
        supabase.rpc("increment_document_usage", {
          p_user_id: userId,
          p_increment: 1,
        }),
        8000,
        "Increment document usage",
      )

      if (error) {
        console.error("Error incrementing document usage:", error)
        try {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({ documents_used: supabase.raw("documents_used + 1") })
            .eq("id", userId)

          if (profileError) {
            console.error("Fallback increment also failed:", profileError)
            return false
          }

          return true
        } catch (fallbackError) {
          console.error("Fallback increment error:", fallbackError)
          return false
        }
      }

      console.log(`Document usage incremented successfully`)
      return true
    } catch (error) {
      console.error("Error in incrementDocumentUsage:", error)
      return false
    }
  },

  async getCurrentPlanUsage(userId: string): Promise<{
    plan_id: string
    plan_name: string
    document_limit: number
    documents_used: number
    remaining_documents: number
    usage_percentage: number
    billing_period_start: string
    billing_period_end: string
    days_until_reset: number
  } | null> {
    try {
      console.log(`Getting current plan usage for user: ${userId}`)

      const { data, error } = await withTimeout(
        supabase.rpc("get_user_usage_stats", {
          user_uuid: userId,
        }),
        5000,
        "Get current usage stats",
      )

      if (error) {
        console.error("Error fetching current usage stats:", error)
        console.log(`Attempting fallback query for usage stats`)
        return await this.getCurrentPlanUsageFallback(userId)
      }

      if (data && data.length > 0) {
        const stats = data[0]
        console.log(`Usage stats retrieved successfully`)

        const remainingDocuments =
          stats.documents_limit === -1 ? -1 : Math.max(0, stats.documents_limit - stats.documents_used)
        const usagePercentage =
          stats.documents_limit === -1
            ? 0
            : stats.documents_limit === 0
              ? 100
              : Math.round((stats.documents_used / stats.documents_limit) * 100)

        const periodEnd = new Date(stats.next_reset_date)
        const today = new Date()
        const daysUntilReset = Math.max(0, Math.ceil((periodEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

        return {
          plan_id: "", // Will be populated from subscription data if needed
          plan_name: stats.plan_name || "Free",
          document_limit: stats.documents_limit || 0,
          documents_used: stats.documents_used || 0,
          remaining_documents: remainingDocuments,
          usage_percentage: usagePercentage,
          billing_period_start: stats.next_reset_date
            ? new Date(
                new Date(stats.next_reset_date).getTime() -
                  (stats.billing_cycle === "yearly" ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000),
              ).toISOString()
            : new Date().toISOString(),
          billing_period_end: stats.next_reset_date || new Date().toISOString(),
          days_until_reset: daysUntilReset,
        }
      }

      console.log(`No usage stats found, using fallback`)
      return await this.getCurrentPlanUsageFallback(userId)
    } catch (error) {
      console.error("Error in getCurrentPlanUsage:", error)
      return await this.getCurrentPlanUsageFallback(userId)
    }
  },

  async getCurrentPlanUsageFallback(userId: string): Promise<{
    plan_id: string
    plan_name: string
    document_limit: number
    documents_used: number
    remaining_documents: number
    usage_percentage: number
    billing_period_start: string
    billing_period_end: string
    days_until_reset: number
  } | null> {
    try {
      console.log(`Using fallback method for usage stats`)

      const { data: subscription, error: subError } = await withTimeout(
        supabase
          .from("subscriptions")
          .select(`
            plan_id,
            documents_used,
            api_calls_used,
            storage_used_gb,
            current_period_start,
            current_period_end,
            subscription_plans!subscriptions_plan_id_fkey(name, document_limit)
          `)
          .eq("user_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
        3000,
        "Get subscription fallback",
      )

      if (subError || !subscription) {
        console.log(`No active subscription found in fallback`)
        return null
      }

      const documentsUsed = subscription.documents_used || 0
      const documentLimit = subscription.subscription_plans?.document_limit || 0
      const planName = subscription.subscription_plans?.name || "Unknown Plan"

      const remainingDocuments = documentLimit === -1 ? -1 : Math.max(0, documentLimit - documentsUsed)
      const usagePercentage =
        documentLimit === -1 ? 0 : documentLimit === 0 ? 100 : Math.round((documentsUsed / documentLimit) * 100)

      const periodEnd = new Date(subscription.current_period_end)
      const today = new Date()
      const daysUntilReset = Math.max(0, Math.ceil((periodEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

      console.log(`Fallback usage stats calculated successfully`)

      return {
        plan_id: subscription.plan_id,
        plan_name: planName,
        document_limit: documentLimit,
        documents_used: documentsUsed,
        remaining_documents: remainingDocuments,
        usage_percentage: usagePercentage,
        billing_period_start: subscription.current_period_start,
        billing_period_end: subscription.current_period_end,
        days_until_reset: daysUntilReset,
      }
    } catch (error) {
      console.error("Error in getCurrentPlanUsageFallback:", error)
      return null
    }
  },

  async updateProfile(
    userId: string,
    updates: Database["public"]["Tables"]["profiles"]["Update"],
  ): Promise<Profile | null> {
    try {
      const { data, error } = await withTimeout(
        supabase.from("profiles").update(updates).eq("id", userId).select().single(),
        8000,
        "Update profile",
      )

      if (error) {
        console.error("Error updating profile:", error)
        return null
      }
      return data
    } catch (error) {
      console.error("Error in updateProfile:", error)
      return null
    }
  },

  async canProcessDocument(userId: string): Promise<{
    canProcess: boolean
    reason?: string
    currentUsage?: number
    limit?: number
    planName?: string
    daysUntilReset?: number
  }> {
    try {
      const usage = await this.getCurrentPlanUsage(userId)

      if (!usage) {
        return {
          canProcess: false,
          reason: "No active subscription found",
        }
      }

      // Handle unlimited plans (document_limit = -1)
      if (usage.document_limit === -1) {
        return {
          canProcess: true,
          currentUsage: usage.documents_used,
          limit: usage.document_limit,
          planName: usage.plan_name,
          daysUntilReset: usage.days_until_reset,
        }
      }

      // Check if user has reached their limit
      const hasReachedLimit = usage.document_limit > 0 && usage.documents_used >= usage.document_limit

      if (hasReachedLimit) {
        // Special handling for free plan - permanent block until next billing cycle
        if (usage.plan_name.toLowerCase().includes("free")) {
          return {
            canProcess: false,
            reason: "Free plan quota reached - resets next billing cycle",
            currentUsage: usage.documents_used,
            limit: usage.document_limit,
            planName: usage.plan_name,
            daysUntilReset: usage.days_until_reset,
          }
        } else {
          return {
            canProcess: false,
            reason: "Monthly quota reached for current billing cycle",
            currentUsage: usage.documents_used,
            limit: usage.document_limit,
            planName: usage.plan_name,
            daysUntilReset: usage.days_until_reset,
          }
        }
      }

      return {
        canProcess: true,
        currentUsage: usage.documents_used,
        limit: usage.document_limit,
        planName: usage.plan_name,
        daysUntilReset: usage.days_until_reset,
      }
    } catch (error) {
      console.error("Error in canProcessDocument:", error)
      return {
        canProcess: false,
        reason: "Error checking document processing eligibility",
      }
    }
  },
}

// Added custom style service
export const customStyleService = {
  async getCustomStyles(userId?: string): Promise<CustomStyle[]> {
    try {
      let query = supabase.from("custom_styles").select("*").order("created_at", { ascending: false })

      if (userId) {
        query = query.or(`user_id.eq.${userId},is_global.eq.true`)
      } else {
        query = query.eq("is_global", true)
      }

      const { data, error } = await withTimeout(query, 8000, "Get custom styles")

      if (error) {
        console.error("Error fetching custom styles:", error)
        return []
      }
      return data || []
    } catch (error) {
      console.error("Error in getCustomStyles:", error)
      return []
    }
  },

  async getStyles(userId?: string): Promise<CustomStyle[]> {
    return this.getCustomStyles(userId)
  },

  async createCustomStyle(style: Database["public"]["Tables"]["custom_styles"]["Insert"]): Promise<CustomStyle | null> {
    try {
      const { data, error } = await withTimeout(
        supabase.from("custom_styles").insert(style).select().single(),
        8000,
        "Create custom style",
      )

      if (error) {
        console.error("Error creating custom style:", error)
        return null
      }
      return data
    } catch (error) {
      console.error("Error in createCustomStyle:", error)
      return null
    }
  },
}

// Added formatting style service for database-driven styles
export const formattingStyleService = {
  async getFormattingStyles(): Promise<Array<{ id: string; name: string; code: string; description?: string }>> {
    try {
      // For now, return static styles - can be moved to database later
      return [
        { id: "1", name: "APA (7th Edition)", code: "APA", description: "American Psychological Association style" },
        { id: "2", name: "MLA (9th Edition)", code: "MLA", description: "Modern Language Association style" },
        { id: "3", name: "Chicago (17th Edition)", code: "Chicago", description: "Chicago Manual of Style" },
        { id: "4", name: "Harvard", code: "Harvard", description: "Harvard referencing style" },
        { id: "5", name: "IEEE", code: "IEEE", description: "Institute of Electrical and Electronics Engineers" },
        { id: "6", name: "Vancouver", code: "Vancouver", description: "Vancouver citation style" },
        { id: "7", name: "Oxford", code: "Oxford", description: "Oxford referencing style" },
        { id: "8", name: "Turabian", code: "Turabian", description: "Turabian citation style" },
      ]
    } catch (error) {
      console.error("Error in getFormattingStyles:", error)
      return []
    }
  },
}

// Enhanced notification service with better timeout handling
export const notificationService = {
  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50),
        6000,
        "Get notifications",
      )

      if (error) {
        console.error("Error fetching notifications:", error)
        throw new Error(`Failed to fetch notifications: ${error.message}`)
      }
      return data || []
    } catch (error) {
      console.error("Error in getNotifications:", error)
      if (error instanceof Error && error.message.includes("timeout")) {
        throw new Error("Notifications request timed out. Please try again.")
      }
      throw error
    }
  },

  async createNotification(
    notification: Database["public"]["Tables"]["notifications"]["Insert"],
  ): Promise<Notification | null> {
    try {
      const { data, error } = await withTimeout(
        supabase.from("notifications").insert(notification).select().single(),
        5000,
        "Create notification",
      )

      if (error) {
        console.error("Error creating notification:", error)
        return null
      }
      return data
    } catch (error) {
      console.error("Error in createNotification:", error)
      return null
    }
  },

  async markAsRead(id: string): Promise<boolean> {
    try {
      const { error } = await withTimeout(
        supabase.from("notifications").update({ is_read: true }).eq("id", id),
        5000,
        "Mark notification as read",
      )

      if (error) {
        console.error("Error marking notification as read:", error)
        return false
      }
      return true
    } catch (error) {
      console.error("Error in markAsRead:", error)
      return false
    }
  },

  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await withTimeout(
        supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false),
        8000,
        "Mark all notifications as read",
      )

      if (error) {
        console.error("Error marking all notifications as read:", error)
        return false
      }
      return true
    } catch (error) {
      console.error("Error in markAllAsRead:", error)
      return false
    }
  },

  async clearAllNotifications(userId: string): Promise<boolean> {
    try {
      const { error } = await withTimeout(
        supabase.from("notifications").delete().eq("user_id", userId),
        10000,
        "Clear all notifications",
      )

      if (error) {
        console.error("Error clearing all notifications:", error)
        return false
      }
      return true
    } catch (error) {
      console.error("Error in clearAllNotifications:", error)
      return false
    }
  },
}

export const planUsageService = {
  async getUserPlanUsage(
    userId: string,
    subscriptionId: string,
  ): Promise<{
    user_id: string
    subscription_id: string
    documents_used: number
    api_calls_made: number
    storage_used_gb: number
    last_reset_date: string
    billing_period_start: string
    billing_period_end: string
  } | null> {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from("subscription_usage")
          .select("*")
          .eq("user_id", userId)
          .eq("subscription_id", subscriptionId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
        8000,
        "Get subscription usage",
      )

      if (error) {
        console.error("Error fetching subscription usage:", error)
        return null
      }

      return data
        ? {
            user_id: data.user_id,
            subscription_id: data.subscription_id,
            documents_used: data.documents_processed,
            api_calls_made: data.api_calls_made,
            storage_used_gb: Number.parseFloat(data.storage_used_gb),
            last_reset_date: data.last_reset_date,
            billing_period_start: data.billing_period_start,
            billing_period_end: data.billing_period_end,
          }
        : null
    } catch (error) {
      console.error("Error in getUserPlanUsage:", error)
      return null
    }
  },

  async incrementPlanUsage(userId: string, increment = 1): Promise<boolean> {
    try {
      const { data, error } = await withTimeout(
        supabase.rpc("increment_document_usage", {
          p_user_id: userId,
          p_increment: increment,
        }),
        8000,
        "Increment document usage",
      )

      if (error) {
        console.error("Error incrementing document usage:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error in incrementPlanUsage:", error)
      return false
    }
  },

  async resetPlanUsage(userId: string, oldPlanId: string, newPlanId: string): Promise<boolean> {
    try {
      const { data, error } = await withTimeout(
        supabase.rpc("reset_usage_for_plan_change", {
          p_user_id: userId,
          p_old_plan_id: oldPlanId,
          p_new_plan_id: newPlanId,
          p_reason: "plan_change",
        }),
        8000,
        "Reset usage for plan change",
      )

      if (error) {
        console.error("Error resetting usage for plan change:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error in resetPlanUsage:", error)
      return false
    }
  },

  async getAllUserPlanUsages(userId: string): Promise<
    Array<{
      plan_id: string
      plan_name: string
      documents_used: number
      api_calls_made: number
      storage_used_gb: number
      last_reset_date: string
      billing_period_start: string
      billing_period_end: string
      is_current_period: boolean
    }>
  > {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from("subscription_usage")
          .select(`
            plan_id,
            documents_processed,
            api_calls_made,
            storage_used_gb,
            last_reset_date,
            billing_period_start,
            billing_period_end,
            subscription_plans!subscription_usage_plan_id_fkey(name)
          `)
          .eq("user_id", userId)
          .order("billing_period_end", { ascending: false }),
        8000,
        "Get all subscription usage records",
      )

      if (error) {
        console.error("Error fetching all subscription usage records:", error)
        return []
      }

      const currentTime = new Date()

      return (data || []).map((item) => ({
        plan_id: item.plan_id,
        plan_name: item.subscription_plans?.name || "Unknown Plan",
        documents_used: item.documents_processed,
        api_calls_made: item.api_calls_made,
        storage_used_gb: Number.parseFloat(item.storage_used_gb),
        last_reset_date: item.last_reset_date,
        billing_period_start: item.billing_period_start,
        billing_period_end: item.billing_period_end,
        is_current_period: new Date(item.billing_period_end) > currentTime,
      }))
    } catch (error) {
      console.error("Error in getAllUserPlanUsages:", error)
      return []
    }
  },

  async getComprehensiveUsageStats(userId: string): Promise<{
    current_usage: {
      plan_name: string
      documents_used: number
      document_limit: number
      usage_percentage: number
      days_until_reset: number
    } | null
    usage_history: Array<{
      plan_name: string
      documents_used: number
      api_calls_made: number
      storage_used_gb: number
      period_start: string
      period_end: string
      is_current: boolean
    }>
  }> {
    try {
      // Get current usage stats
      const currentUsage = await profileService.getCurrentPlanUsage(userId)

      // Get usage history
      const usageHistory = await this.getAllUserPlanUsages(userId)

      return {
        current_usage: currentUsage
          ? {
              plan_name: currentUsage.plan_name,
              documents_used: currentUsage.documents_used,
              document_limit: currentUsage.document_limit,
              usage_percentage: currentUsage.usage_percentage,
              days_until_reset: currentUsage.days_until_reset,
            }
          : null,
        usage_history: usageHistory.map((item) => ({
          plan_name: item.plan_name,
          documents_used: item.documents_used,
          api_calls_made: item.api_calls_made,
          storage_used_gb: item.storage_used_gb,
          period_start: item.billing_period_start,
          period_end: item.billing_period_end,
          is_current: item.is_current_period,
        })),
      }
    } catch (error) {
      console.error("Error in getComprehensiveUsageStats:", error)
      return {
        current_usage: null,
        usage_history: [],
      }
    }
  },
}

// Added English variant service
export const englishVariantService = {
  async getEnglishVariants(): Promise<Array<{ id: string; name: string; code: string; description?: string }>> {
    try {
      // For now, return static variants - can be moved to database later
      return [
        { id: "1", name: "US English", code: "US", description: "American English spelling and grammar" },
        { id: "2", name: "UK English", code: "UK", description: "British English spelling and grammar" },
        { id: "3", name: "Canadian English", code: "CA", description: "Canadian English spelling and grammar" },
        { id: "4", name: "Australian English", code: "AU", description: "Australian English spelling and grammar" },
        { id: "5", name: "New Zealand English", code: "NZ", description: "New Zealand English spelling and grammar" },
        {
          id: "6",
          name: "South African English",
          code: "ZA",
          description: "South African English spelling and grammar",
        },
      ]
    } catch (error) {
      console.error("Error in getEnglishVariants:", error)
      return []
    }
  },
}
