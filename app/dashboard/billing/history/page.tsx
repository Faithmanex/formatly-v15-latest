import { BillingHistory } from "@/components/billing/billing-history"

export default function BillingHistoryPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 p-3 sm:p-4 lg:p-6 min-h-[calc(100vh-4rem)]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing History</h1>
        <p className="text-muted-foreground">View and download your invoices and payment history.</p>
      </div>
      <BillingHistory />
    </div>
  )
}
