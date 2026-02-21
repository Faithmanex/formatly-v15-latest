import { getSupabaseBrowserClient } from "./supabase"

const getSupabase = () => getSupabaseBrowserClient()

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price_monthly: number
  price_yearly: number
  currency: string
  features: string[]
  document_limit: number
  api_calls_limit: number
  storage_limit_gb: number
  priority_support: boolean
  custom_styles: boolean
  team_collaboration: boolean
  is_popular: boolean
  is_active: boolean
  billing_cycles: string[]
  paypal_plan_id_monthly?: string
  paypal_plan_id_yearly?: string
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  paypal_subscription_id?: string
  status: "active" | "canceled" | "past_due" | "unpaid" | "trialing"
  billing_cycle: "monthly" | "yearly"
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  trial_end?: string
  created_at: string
  updated_at: string
  plan?: SubscriptionPlan
}

export interface Invoice {
  id: string
  user_id: string
  subscription_id?: string
  paypal_transaction_id?: string
  invoice_number?: string
  amount_due: number
  amount_paid?: number
  currency: string
  status: "draft" | "open" | "paid" | "void" | "uncollectible"
  description?: string
  billing_reason?: string
  line_items?: any[]
  invoice_pdf_url?: string
  due_date?: string
  paid_at?: string
  created_at: string
  updated_at?: string
}

export interface PaymentMethod {
  id: string
  user_id: string
  paypal_payment_method_id?: string
  type: "card"
  card_brand: string
  card_last4: string
  card_exp_month: number
  card_exp_year: number
  is_default: boolean
  created_at: string
}

export interface UsageStats {
  documents_processed: number
  api_calls_made: number
  storage_used_gb: number
  document_limit: number
  api_calls_limit: number
  storage_limit_gb: number
  plan_name: string
  current_period_start: string
  current_period_end: string
  usage_percentage: number
}

export interface SubscriptionChangeResult {
  success: boolean
  subscription_id?: string
  new_plan_name?: string
  new_document_limit?: number
  effective_immediately?: boolean
  effective_date?: string
  scheduled_downgrade?: boolean
  current_plan_name?: string
  error?: string
}

export interface SubscriptionStatusWithPending {
  subscription_id: string
  current_plan: {
    id: string
    name: string
    document_limit: number
    price_monthly: number
    features: string[]
  }
  pending_plan?: {
    id: string
    name: string
    document_limit: number
    price_monthly: number
    effective_date: string
    change_reason: string
  }
  status: string
  billing_cycle: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  documents_used: number
  current_document_limit: number
}

// Cache for subscription plans to avoid redundant fetches
let cachedPlans: SubscriptionPlan[] | null = null
let plansLastFetched = 0
const PLANS_CACHE_TTL = 10 * 60 * 1000 // 10 minutes

// Subscription Plans
export async function getSubscriptionPlans(forceRefresh = false): Promise<SubscriptionPlan[]> {
  try {
    const now = Date.now()
    if (!forceRefresh && cachedPlans && now - plansLastFetched < PLANS_CACHE_TTL) {
      return cachedPlans
    }

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("price_monthly", { ascending: true })

    if (error) {
      console.error("Error fetching subscription plans:", error)
      return cachedPlans || []
    }

    cachedPlans = data || []
    plansLastFetched = now
    return cachedPlans
  } catch (error) {
    console.error("Error fetching subscription plans:", error)
    return cachedPlans || []
  }
}

export async function getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.from("subscription_plans").select("*").eq("id", planId).single()

    if (error) {
      console.error("Error fetching subscription plan:", error)
      return null
    }
    return data
  } catch (error) {
    console.error("Error fetching subscription plan:", error)
    return null
  }
}

// User Subscriptions
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
      *,
      subscription_plans!subscriptions_plan_id_fkey(*)
    `)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle()

    if (error) {
      console.error("Error fetching user subscription:", error)
      return null
    }

    if (data) {
      return {
        ...data,
        plan: data.subscription_plans,
      }
    }

    return null
  } catch (error) {
    console.error("Error fetching user subscription:", error)
    return null
  }
}

export async function createSubscription(
  userId: string,
  planId: string,
  billingCycle: "monthly" | "yearly" = "monthly",
  paypalSubscriptionId?: string,
): Promise<Subscription> {
  const supabase = getSupabase()
  const now = new Date()
  const periodEnd = new Date(now.getTime() + (billingCycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000)

  // First, cancel any existing active subscriptions
  const { error: cancelError } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: true,
      updated_at: now.toISOString(),
    })
    .eq("user_id", userId)
    .eq("status", "active")

  if (cancelError) {
    console.error("Error canceling existing subscriptions:", cancelError)
  }

  const subscriptionData = {
    user_id: userId,
    plan_id: planId,
    paypal_subscription_id: paypalSubscriptionId,
    status: "active" as const,
    billing_cycle: billingCycle,
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    cancel_at_period_end: false,
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .insert(subscriptionData)
    .select(`
      *,
      subscription_plans!subscriptions_plan_id_fkey(*)
    `)
    .single()

  if (error) {
    console.error("Error creating subscription:", error)
    throw error
  }

  return {
    ...data,
    plan: data.subscription_plans,
  }
}

export async function updateSubscription(
  subscriptionId: string,
  updates: Partial<Subscription>,
): Promise<Subscription> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("subscriptions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", subscriptionId)
    .select(`
      *,
      subscription_plans!subscriptions_plan_id_fkey(*)
    `)
    .single()

  if (error) {
    console.error("Error updating subscription:", error)
    throw error
  }

  return {
    ...data,
    plan: data.subscription_plans,
  }
}

export async function cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from("subscriptions")
    .update({
      cancel_at_period_end: cancelAtPeriodEnd,
      status: cancelAtPeriodEnd ? "active" : "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId)

  if (error) {
    console.error("Error canceling subscription:", error)
    throw error
  }
}

// Billing History
export async function getBillingHistory(userId: string): Promise<Invoice[]> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching billing history:", error)
      return []
    }
    return data || []
  } catch (error) {
    console.error("Error fetching billing history:", error)
    return []
  }
}

export async function createInvoice(invoice: Omit<Invoice, "id" | "created_at">): Promise<Invoice> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from("invoices").insert(invoice).select().single()

  if (error) {
    console.error("Error creating invoice:", error)
    throw error
  }
  return data
}

// Payment Methods
export async function getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })

    if (error) {
      console.error("Error fetching payment methods:", error)
      return []
    }
    return data || []
  } catch (error) {
    console.error("Error fetching payment methods:", error)
    return []
  }
}

export async function addPaymentMethod(
  userId: string,
  paymentMethod: {
    number: string
    exp_month: number
    exp_year: number
    cvc: string
    name: string
  },
): Promise<PaymentMethod> {
  const supabase = getSupabase()
  const last4 = paymentMethod.number.slice(-4)
  const brand = "visa" // This would be determined by the card number

  const { data, error } = await supabase
    .from("payment_methods")
    .insert({
      user_id: userId,
      type: "card",
      card_brand: brand,
      card_last4: last4,
      card_exp_month: paymentMethod.exp_month,
      card_exp_year: paymentMethod.exp_year,
      is_default: false,
    })
    .select()
    .single()

  if (error) {
    console.error("Error adding payment method:", error)
    throw error
  }
  return data
}

export async function removePaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from("payment_methods").delete().eq("id", paymentMethodId).eq("user_id", userId)

  if (error) {
    console.error("Error removing payment method:", error)
    throw error
  }
}

export async function setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
  const supabase = getSupabase()
  // First, unset all default payment methods
  await supabase.from("payment_methods").update({ is_default: false }).eq("user_id", userId)

  // Then set the new default
  const { error } = await supabase
    .from("payment_methods")
    .update({ is_default: true })
    .eq("id", paymentMethodId)
    .eq("user_id", userId)

  if (error) {
    console.error("Error setting default payment method:", error)
    throw error
  }
}

// Usage Statistics - Get real data from database
export async function getUserUsageStats(userId: string): Promise<UsageStats> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc("get_user_usage_stats", {
      user_uuid: userId,
    })

    if (error) {
      console.error("Error fetching usage stats:", error)
      // Return default stats on error
      return {
        documents_processed: 0,
        api_calls_made: 0,
        storage_used_gb: 0,
        document_limit: 0,
        api_calls_limit: 0,
        storage_limit_gb: 0,
        plan_name: "No Plan",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date().toISOString(),
        usage_percentage: 0,
      }
    }

    if (data && data.length > 0) {
      const stats = data[0]
      return {
        documents_processed: stats.documents_used || 0,
        api_calls_made: stats.api_calls_used || 0,
        storage_used_gb: Number.parseFloat(stats.storage_used_gb) || 0,
        document_limit: stats.documents_limit || 0,
        api_calls_limit: stats.api_calls_limit || 0,
        storage_limit_gb: stats.storage_limit_gb || 0,
        plan_name: stats.plan_name || "No Plan",
        current_period_start:
          stats.billing_cycle === "yearly"
            ? new Date(new Date(stats.next_reset_date).getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(new Date(stats.next_reset_date).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        current_period_end: stats.next_reset_date,
        usage_percentage:
          stats.documents_limit > 0 ? Math.round((stats.documents_used / stats.documents_limit) * 100) : 0,
      }
    }

    // Return default stats if no data
    return {
      documents_processed: 0,
      api_calls_made: 0,
      storage_used_gb: 0,
      document_limit: 0,
      api_calls_limit: 0,
      storage_limit_gb: 0,
      plan_name: "No Plan",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date().toISOString(),
      usage_percentage: 0,
    }
  } catch (error) {
    console.error("Error in getUserUsageStats:", error)
    return {
      documents_processed: 0,
      api_calls_made: 0,
      storage_used_gb: 0,
      document_limit: 0,
      api_calls_limit: 0,
      storage_limit_gb: 0,
      plan_name: "No Plan",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date().toISOString(),
      usage_percentage: 0,
    }
  }
}

// Increment document usage - updated function name
export async function incrementDocumentUsage(userId: string, increment = 1): Promise<void> {
  try {
    const supabase = getSupabase()
    const { error } = await supabase.rpc("track_document_usage", {
      user_uuid: userId,
    })

    if (error) {
      console.error("Error incrementing document usage:", error)
    }
  } catch (error) {
    console.error("Error in incrementDocumentUsage:", error)
  }
}

// Update storage usage - updated function name
export async function updateStorageUsage(userId: string, storageGb: number): Promise<void> {
  try {
    const supabase = getSupabase()
    const { error } = await supabase.rpc("track_storage_usage", {
      user_uuid: userId,
      storage_gb: storageGb,
    })

    if (error) {
      console.error("Error updating storage usage:", error)
    }
  } catch (error) {
    console.error("Error in updateStorageUsage:", error)
  }
}

// Increment API usage
export async function incrementApiUsage(userId: string, increment = 1): Promise<void> {
  try {
    const supabase = getSupabase()
    const { error } = await supabase.rpc("track_api_usage", {
      user_uuid: userId,
      calls_count: increment,
    })

    if (error) {
      console.error("Error incrementing API usage:", error)
    }
  } catch (error) {
    console.error("Error in incrementApiUsage:", error)
  }
}

// Check if user has reached limits
export async function checkUsageLimits(
  userId: string,
  preFetchedStats?: UsageStats,
): Promise<{
  documentsAtLimit: boolean
  apiCallsAtLimit: boolean
  storageAtLimit: boolean
  currentUsage?: {
    documents_used: number
    document_limit: number
    plan_name: string
    api_calls_made: number
    api_calls_limit: number
    storage_used_gb: number
    storage_limit_gb: number
    usage_percentage: number
  }
}> {
  try {
    const stats = preFetchedStats || (await getUserUsageStats(userId))

    const documentsAtLimit = stats.document_limit > 0 && stats.documents_processed >= stats.document_limit
    const apiCallsAtLimit = stats.api_calls_limit > 0 && stats.api_calls_made >= stats.api_calls_limit
    const storageAtLimit = stats.storage_limit_gb > 0 && stats.storage_used_gb >= stats.storage_limit_gb

    return {
      documentsAtLimit,
      apiCallsAtLimit,
      storageAtLimit,
      currentUsage: {
        documents_used: stats.documents_processed,
        document_limit: stats.document_limit,
        plan_name: stats.plan_name,
        api_calls_made: stats.api_calls_made,
        api_calls_limit: stats.api_calls_limit,
        storage_used_gb: stats.storage_used_gb,
        storage_limit_gb: stats.storage_limit_gb,
        usage_percentage: stats.usage_percentage,
      },
    }
  } catch (error) {
    console.error("Error in checkUsageLimits:", error)
    return {
      documentsAtLimit: false,
      apiCallsAtLimit: false,
      storageAtLimit: false,
    }
  }
}


// Handle subscription upgrades
export async function handleSubscriptionUpgrade(
  userId: string,
  newPlanId: string,
  billingCycle: "monthly" | "yearly" = "monthly",
): Promise<SubscriptionChangeResult> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc("handle_subscription_upgrade", {
      p_user_id: userId,
      p_new_plan_id: newPlanId,
      p_billing_cycle: billingCycle,
    })

    if (error) {
      console.error("Error handling subscription upgrade:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: data.success,
      subscription_id: data.subscription_id,
      new_plan_name: data.new_plan_name,
      new_document_limit: data.new_document_limit,
      effective_immediately: data.effective_immediately,
    }
  } catch (error) {
    console.error("Error in handleSubscriptionUpgrade:", error)
    return {
      success: false,
      error: "An unexpected error occurred during upgrade",
    }
  }
}

// Handle subscription downgrades
export async function handleSubscriptionDowngrade(
  userId: string,
  newPlanId: string,
): Promise<SubscriptionChangeResult> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc("handle_subscription_downgrade", {
      p_user_id: userId,
      p_new_plan_id: newPlanId,
    })

    if (error) {
      console.error("Error handling subscription downgrade:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: data.success,
      subscription_id: data.subscription_id,
      current_plan_name: data.current_plan_name,
      new_plan_name: data.new_plan_name,
      effective_date: data.effective_date,
      scheduled_downgrade: data.scheduled_downgrade,
    }
  } catch (error) {
    console.error("Error in handleSubscriptionDowngrade:", error)
    return {
      success: false,
      error: "An unexpected error occurred during downgrade",
    }
  }
}

// Get subscription status with pending changes
export async function getSubscriptionStatusWithPending(userId: string): Promise<SubscriptionStatusWithPending | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc("get_subscription_status", {
      p_user_id: userId,
    })

    if (error) {
      console.error("Error fetching subscription status:", error)
      return null
    }

    if (data?.error) {
      return null
    }

    return data as SubscriptionStatusWithPending
  } catch (error) {
    console.error("Error in getSubscriptionStatusWithPending:", error)
    return null
  }
}

// Process pending plan changes (for cron jobs)
export async function processPendingPlanChanges(): Promise<{
  processed_count: number
  timestamp: string
}> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc("process_pending_plan_changes")

    if (error) {
      console.error("Error processing pending plan changes:", error)
      throw error
    }

    return {
      processed_count: data.processed_count || 0,
      timestamp: data.timestamp,
    }
  } catch (error) {
    console.error("Error in processPendingPlanChanges:", error)
    throw error
  }
}

// Check if a plan change is an upgrade or downgrade
export function isPlanUpgrade(currentPlan: SubscriptionPlan | null, newPlan: SubscriptionPlan): boolean {
  if (!currentPlan || currentPlan.name === "Free") {
    return true
  }

  return newPlan.price_monthly > currentPlan.price_monthly
}

// Get plan change preview
export async function getPlanChangePreview(
  userId: string,
  newPlanId: string,
): Promise<{
  isUpgrade: boolean
  currentPlan: SubscriptionPlan | null
  newPlan: SubscriptionPlan
  effectiveImmediately: boolean
  effectiveDate?: string
  priceDifference: number
}> {
  const [currentSubscription, newPlan] = await Promise.all([
    getUserSubscription(userId),
    getSubscriptionPlan(newPlanId),
  ])

  if (!newPlan) {
    throw new Error("Invalid plan selected")
  }

  const currentPlan = currentSubscription?.plan || null
  const isUpgrade = isPlanUpgrade(currentPlan, newPlan)
  const effectiveImmediately = isUpgrade
  const effectiveDate = !effectiveImmediately ? currentSubscription?.current_period_end : undefined

  const currentPrice = currentPlan?.price_monthly || 0
  const newPrice = newPlan.price_monthly
  const priceDifference = newPrice - currentPrice

  return {
    isUpgrade,
    currentPlan,
    newPlan,
    effectiveImmediately,
    effectiveDate,
    priceDifference,
  }
}

// Export the missing services that are imported elsewhere
export const usageTrackingService = {
  getUserUsageStats,
  incrementDocumentUsage,
  updateStorageUsage,
  incrementApiUsage,
  checkUsageLimits,
}

export const subscriptionService = {
  getSubscriptionPlans,
  getSubscriptionPlan,
  getUserSubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  handleSubscriptionUpgrade,
  handleSubscriptionDowngrade,
  getSubscriptionStatusWithPending,
  processPendingPlanChanges,
  isPlanUpgrade,
  getPlanChangePreview,
}
