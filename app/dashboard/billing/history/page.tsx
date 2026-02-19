import { BillingHistory } from "@/components/billing/billing-history"

export default function BillingHistoryPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 min-h-[calc(100vh-4rem)]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing History</h1>
        <p className="text-muted-foreground">View and download your invoices and payment history.</p>
      </div>
      <BillingHistory />
    </div>
  )
}
