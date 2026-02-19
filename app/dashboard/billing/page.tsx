import { BillingDashboard } from "@/components/billing/billing-dashboard"

export default function BillingPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 min-h-[calc(100vh-4rem)]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription, view usage, and update billing information.</p>
      </div>
      <BillingDashboard />
    </div>
  )
}
