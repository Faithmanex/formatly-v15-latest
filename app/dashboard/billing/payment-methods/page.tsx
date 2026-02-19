import { PaymentMethods } from "@/components/billing/payment-methods"

export default function PaymentMethodsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 min-h-[calc(100vh-4rem)]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Methods</h1>
        <p className="text-muted-foreground">Manage your payment methods and billing information.</p>
      </div>
      <PaymentMethods />
    </div>
  )
}
