// Stripe API simulation for development
// This will be replaced with actual Stripe integration

export interface StripeCustomer {
  id: string
  email: string
  name?: string
  created: number
}

export interface StripePaymentMethod {
  id: string
  type: string
  card?: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
  }
}

export interface StripeSubscription {
  id: string
  customer: string
  status: "active" | "canceled" | "past_due" | "unpaid" | "trialing"
  current_period_start: number
  current_period_end: number
  cancel_at_period_end: boolean
  canceled_at?: number
  trial_start?: number
  trial_end?: number
  items: {
    data: Array<{
      price: {
        id: string
        recurring: {
          interval: "month" | "year"
        }
      }
    }>
  }
}

export interface StripeInvoice {
  id: string
  customer: string
  subscription?: string
  amount_due: number
  amount_paid: number
  currency: string
  status: "draft" | "open" | "paid" | "void" | "uncollectible"
  invoice_pdf?: string
  hosted_invoice_url?: string
  due_date?: number
  paid_at?: number
  lines: {
    data: Array<{
      description: string
      amount: number
    }>
  }
}

export interface StripeSetupIntent {
  id: string
  client_secret: string
  status: "requires_payment_method" | "requires_confirmation" | "succeeded"
}

class StripeSimulation {
  private customers: Map<string, StripeCustomer> = new Map()
  private paymentMethods: Map<string, StripePaymentMethod> = new Map()
  private subscriptions: Map<string, StripeSubscription> = new Map()
  private invoices: Map<string, StripeInvoice> = new Map()

  // Simulate network delay
  private async delay(ms = 1000): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms))
  }

  // Generate random IDs
  private generateId(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).substr(2, 24)}`
  }

  // Customer methods
  async createCustomer(email: string, name?: string): Promise<StripeCustomer> {
    await this.delay()

    const customer: StripeCustomer = {
      id: this.generateId("cus"),
      email,
      name,
      created: Math.floor(Date.now() / 1000),
    }

    this.customers.set(customer.id, customer)
    console.log("[STRIPE SIMULATION] Created customer:", customer)
    return customer
  }

  async retrieveCustomer(customerId: string): Promise<StripeCustomer | null> {
    await this.delay(500)
    return this.customers.get(customerId) || null
  }

  async updateCustomer(customerId: string, updates: Partial<StripeCustomer>): Promise<StripeCustomer | null> {
    await this.delay()

    const customer = this.customers.get(customerId)
    if (!customer) return null

    const updatedCustomer = { ...customer, ...updates }
    this.customers.set(customerId, updatedCustomer)
    console.log("[STRIPE SIMULATION] Updated customer:", updatedCustomer)
    return updatedCustomer
  }

  // Payment Method methods
  async createSetupIntent(customerId: string): Promise<StripeSetupIntent> {
    await this.delay()

    const setupIntent: StripeSetupIntent = {
      id: this.generateId("seti"),
      client_secret: `${this.generateId("seti")}_secret_${Math.random().toString(36).substr(2, 16)}`,
      status: "requires_payment_method",
    }

    console.log("[STRIPE SIMULATION] Created setup intent:", setupIntent)
    return setupIntent
  }

  async confirmSetupIntent(
    setupIntentId: string,
  ): Promise<StripeSetupIntent & { payment_method: StripePaymentMethod }> {
    await this.delay(2000) // Simulate payment processing time

    // Simulate payment method creation
    const paymentMethod: StripePaymentMethod = {
      id: this.generateId("pm"),
      type: "card",
      card: {
        brand: ["visa", "mastercard", "amex"][Math.floor(Math.random() * 3)] as any,
        last4: Math.floor(Math.random() * 9999)
          .toString()
          .padStart(4, "0"),
        exp_month: Math.floor(Math.random() * 12) + 1,
        exp_year: new Date().getFullYear() + Math.floor(Math.random() * 5) + 1,
      },
    }

    this.paymentMethods.set(paymentMethod.id, paymentMethod)

    const setupIntent: StripeSetupIntent & { payment_method: StripePaymentMethod } = {
      id: setupIntentId,
      client_secret: `${setupIntentId}_secret_confirmed`,
      status: "succeeded",
      payment_method: paymentMethod,
    }

    console.log("[STRIPE SIMULATION] Confirmed setup intent:", setupIntent)
    return setupIntent
  }

  async listPaymentMethods(customerId: string): Promise<StripePaymentMethod[]> {
    await this.delay(500)
    return Array.from(this.paymentMethods.values())
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<boolean> {
    await this.delay()
    const deleted = this.paymentMethods.delete(paymentMethodId)
    console.log("[STRIPE SIMULATION] Detached payment method:", paymentMethodId)
    return deleted
  }

  // Subscription methods
  async createSubscription(customerId: string, priceId: string, paymentMethodId?: string): Promise<StripeSubscription> {
    await this.delay(2000)

    const now = Math.floor(Date.now() / 1000)
    const isYearly = priceId.includes("yearly")
    const periodEnd = isYearly
      ? now + 365 * 24 * 60 * 60 // 1 year
      : now + 30 * 24 * 60 * 60 // 1 month

    const subscription: StripeSubscription = {
      id: this.generateId("sub"),
      customer: customerId,
      status: "active",
      current_period_start: now,
      current_period_end: periodEnd,
      cancel_at_period_end: false,
      items: {
        data: [
          {
            price: {
              id: priceId,
              recurring: {
                interval: isYearly ? "year" : "month",
              },
            },
          },
        ],
      },
    }

    this.subscriptions.set(subscription.id, subscription)
    console.log("[STRIPE SIMULATION] Created subscription:", subscription)

    // Create initial invoice
    await this.createInvoiceForSubscription(subscription)

    return subscription
  }

  async retrieveSubscription(subscriptionId: string): Promise<StripeSubscription | null> {
    await this.delay(500)
    return this.subscriptions.get(subscriptionId) || null
  }

  async updateSubscription(
    subscriptionId: string,
    updates: Partial<StripeSubscription>,
  ): Promise<StripeSubscription | null> {
    await this.delay()

    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return null

    const updatedSubscription = { ...subscription, ...updates }
    this.subscriptions.set(subscriptionId, updatedSubscription)
    console.log("[STRIPE SIMULATION] Updated subscription:", updatedSubscription)
    return updatedSubscription
  }

  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true): Promise<StripeSubscription | null> {
    await this.delay()

    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) return null

    const updates: Partial<StripeSubscription> = {
      cancel_at_period_end: cancelAtPeriodEnd,
    }

    if (!cancelAtPeriodEnd) {
      updates.status = "canceled"
      updates.canceled_at = Math.floor(Date.now() / 1000)
    }

    return this.updateSubscription(subscriptionId, updates)
  }

  // Invoice methods
  private async createInvoiceForSubscription(subscription: StripeSubscription): Promise<StripeInvoice> {
    const priceMap: Record<string, number> = {
      price_pro_monthly: 999,
      price_pro_yearly: 9999,
      price_business_monthly: 2999,
      price_business_yearly: 29999,
      price_enterprise_monthly: 9999,
      price_enterprise_yearly: 99999,
    }

    const priceId = subscription.items.data[0]?.price.id
    const amount = priceMap[priceId] || 999

    const invoice: StripeInvoice = {
      id: this.generateId("in"),
      customer: subscription.customer,
      subscription: subscription.id,
      amount_due: amount,
      amount_paid: amount,
      currency: "usd",
      status: "paid",
      paid_at: Math.floor(Date.now() / 1000),
      invoice_pdf: `https://invoice.stripe.com/i/${this.generateId("inv")}`,
      hosted_invoice_url: `https://invoice.stripe.com/i/${this.generateId("inv")}`,
      lines: {
        data: [
          {
            description: `Formatly ${priceId.includes("pro") ? "Pro" : priceId.includes("business") ? "Business" : "Enterprise"} Plan`,
            amount,
          },
        ],
      },
    }

    this.invoices.set(invoice.id, invoice)
    console.log("[STRIPE SIMULATION] Created invoice:", invoice)
    return invoice
  }

  async listInvoices(customerId: string): Promise<StripeInvoice[]> {
    await this.delay(500)
    return Array.from(this.invoices.values()).filter((inv) => inv.customer === customerId)
  }

  async retrieveInvoice(invoiceId: string): Promise<StripeInvoice | null> {
    await this.delay(500)
    return this.invoices.get(invoiceId) || null
  }
}

// Export singleton instance
export const stripeSimulation = new StripeSimulation()

// Simulated Stripe API functions
export const simulatedStripe = {
  customers: {
    create: (params: { email: string; name?: string }) => stripeSimulation.createCustomer(params.email, params.name),
    retrieve: (id: string) => stripeSimulation.retrieveCustomer(id),
    update: (id: string, params: Partial<StripeCustomer>) => stripeSimulation.updateCustomer(id, params),
  },
  setupIntents: {
    create: (params: { customer: string }) => stripeSimulation.createSetupIntent(params.customer),
    confirm: (id: string) => stripeSimulation.confirmSetupIntent(id),
  },
  paymentMethods: {
    list: (params: { customer: string; type: string }) => stripeSimulation.listPaymentMethods(params.customer),
    detach: (id: string) => stripeSimulation.detachPaymentMethod(id),
  },
  subscriptions: {
    create: (params: { customer: string; items: Array<{ price: string }>; default_payment_method?: string }) =>
      stripeSimulation.createSubscription(params.customer, params.items[0].price, params.default_payment_method),
    retrieve: (id: string) => stripeSimulation.retrieveSubscription(id),
    update: (id: string, params: Partial<StripeSubscription>) => stripeSimulation.updateSubscription(id, params),
    cancel: (id: string, params?: { cancel_at_period_end?: boolean }) =>
      stripeSimulation.cancelSubscription(id, params?.cancel_at_period_end),
  },
  invoices: {
    list: (params: { customer: string }) => stripeSimulation.listInvoices(params.customer),
    retrieve: (id: string) => stripeSimulation.retrieveInvoice(id),
  },
}
