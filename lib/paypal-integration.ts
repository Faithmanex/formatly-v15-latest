// PayPal API integration for subscription management
// Replaces Stripe with PayPal Subscriptions API

export interface PayPalCustomer {
  id: string
  email: string
  name?: string
  created: number
}

export interface PayPalPaymentMethod {
  id: string
  type: string
  card?: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
  }
}

export interface PayPalSubscription {
  id: string
  customer: string
  status: "APPROVAL_PENDING" | "APPROVED" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | "EXPIRED"
  current_period_start: number
  current_period_end: number
  cancel_at_period_end: boolean
  canceled_at?: number
  trial_start?: number
  trial_end?: number
  plan_id: string
}

export interface PayPalInvoice {
  id: string
  customer: string
  subscription?: string
  amount_due: number
  amount_paid: number
  currency: string
  status: "DRAFT" | "SENT" | "VIEWED" | "PAID" | "MARKED_AS_PAID" | "CANCELLED" | "REFUNDED"
  invoice_pdf?: string
  hosted_invoice_url?: string
  due_date?: number
  paid_at?: number
}

class PayPalIntegration {
  private customers: Map<string, PayPalCustomer> = new Map()
  private subscriptions: Map<string, PayPalSubscription> = new Map()
  private invoices: Map<string, PayPalInvoice> = new Map()

  // PayPal Plan IDs
  private planIds = {
    pro_monthly: "P-91A156471R160720SND2UYJQ",
    pro_yearly: "P-6LC13956890715232ND2V5QA",
    business_monthly: "P-33Y990793W873362UND2VB7A",
    business_yearly: "P-990649366E456620KND2WEKA",
  }

  private async delay(ms = 1000): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms))
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).substr(2, 24)}`
  }

  // Customer methods
  async createCustomer(email: string, name?: string): Promise<PayPalCustomer> {
    await this.delay()

    const customer: PayPalCustomer = {
      id: this.generateId("paypal_cus"),
      email,
      name,
      created: Math.floor(Date.now() / 1000),
    }

    this.customers.set(customer.id, customer)
    console.log("[PAYPAL] Created customer:", customer)
    return customer
  }

  async retrieveCustomer(customerId: string): Promise<PayPalCustomer | null> {
    await this.delay(500)
    return this.customers.get(customerId) || null
  }

  // Subscription methods
  async createSubscription(customerId: string, planKey: keyof typeof this.planIds): Promise<PayPalSubscription> {
    await this.delay(2000)

    const now = Math.floor(Date.now() / 1000)
    const isYearly = planKey.includes("yearly")
    const periodEnd = isYearly
      ? now + 365 * 24 * 60 * 60 // 1 year
      : now + 30 * 24 * 60 * 60 // 1 month

    const subscription: PayPalSubscription = {
      id: this.generateId("I"),
      customer: customerId,
      status: "ACTIVE",
      current_period_start: now,
      current_period_end: periodEnd,
      cancel_at_period_end: false,
      plan_id: this.planIds[planKey],
    }

    this.subscriptions.set(subscription.id, subscription)
    console.log("[PAYPAL] Created subscription:", subscription)

    // Create initial invoice
    await this.createInvoiceForSubscription(subscription, planKey)

    return subscription
  }

  async retrieveSubscription(subscriptionId: string): Promise<PayPalSubscription | null> {
    await this.delay(500)
    return this.subscriptions.get(subscriptionId) || null
  }

  async updateSubscription(
    subscriptionId: string,
    updates: Partial<PayPalSubscription>,
  ): Promise<PayPalSubscription | null> {
    await this.delay()

    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return null

    const updatedSubscription = { ...subscription, ...updates }
    this.subscriptions.set(subscriptionId, updatedSubscription)
    console.log("[PAYPAL] Updated subscription:", updatedSubscription)
    return updatedSubscription
  }

  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true): Promise<PayPalSubscription | null> {
    await this.delay()

    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return null

    const updates: Partial<PayPalSubscription> = {
      cancel_at_period_end: cancelAtPeriodEnd,
    }

    if (!cancelAtPeriodEnd) {
      updates.status = "CANCELLED"
      updates.canceled_at = Math.floor(Date.now() / 1000)
    }

    return this.updateSubscription(subscriptionId, updates)
  }

  // Invoice methods
  private async createInvoiceForSubscription(
    subscription: PayPalSubscription,
    planKey: keyof typeof this.planIds,
  ): Promise<PayPalInvoice> {
    const priceMap: Record<string, number> = {
      pro_monthly: 999,
      pro_yearly: 9999,
      business_monthly: 2999,
      business_yearly: 29999,
    }

    const amount = priceMap[planKey] || 999

    const invoice: PayPalInvoice = {
      id: this.generateId("INV"),
      customer: subscription.customer,
      subscription: subscription.id,
      amount_due: amount,
      amount_paid: amount,
      currency: "USD",
      status: "PAID",
      paid_at: Math.floor(Date.now() / 1000),
      invoice_pdf: `https://invoice.paypal.com/${this.generateId("inv")}`,
      hosted_invoice_url: `https://invoice.paypal.com/${this.generateId("inv")}`,
    }

    this.invoices.set(invoice.id, invoice)
    console.log("[PAYPAL] Created invoice:", invoice)
    return invoice
  }

  async listInvoices(customerId: string): Promise<PayPalInvoice[]> {
    await this.delay(500)
    return Array.from(this.invoices.values()).filter((inv) => inv.customer === customerId)
  }

  async retrieveInvoice(invoiceId: string): Promise<PayPalInvoice | null> {
    await this.delay(500)
    return this.invoices.get(invoiceId) || null
  }

  // Get plan ID by key
  getPlanId(planKey: keyof typeof this.planIds): string {
    return this.planIds[planKey]
  }

  // Get all plan IDs
  getAllPlanIds() {
    return this.planIds
  }
}

export const paypalIntegration = new PayPalIntegration()

export const simulatedPayPal = {
  customers: {
    create: (params: { email: string; name?: string }) => paypalIntegration.createCustomer(params.email, params.name),
    retrieve: (id: string) => paypalIntegration.retrieveCustomer(id),
  },
  subscriptions: {
    create: (params: { customer: string; plan_key: keyof (typeof paypalIntegration)["getAllPlanIds"] }) =>
      paypalIntegration.createSubscription(params.customer, params.plan_key),
    retrieve: (id: string) => paypalIntegration.retrieveSubscription(id),
    update: (id: string, params: Partial<PayPalSubscription>) => paypalIntegration.updateSubscription(id, params),
    cancel: (id: string, params?: { cancel_at_period_end?: boolean }) =>
      paypalIntegration.cancelSubscription(id, params?.cancel_at_period_end),
  },
  invoices: {
    list: (params: { customer: string }) => paypalIntegration.listInvoices(params.customer),
    retrieve: (id: string) => paypalIntegration.retrieveInvoice(id),
  },
}
