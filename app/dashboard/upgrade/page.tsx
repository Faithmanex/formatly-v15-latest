import { SubscriptionPlans } from "@/components/billing/subscription-plans"

export default function UpgradePage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col p-4 md:p-6">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      
      <div className="flex-1 space-y-6 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Choose Your Plan
          </h1>
          <p className="text-base text-muted-foreground">
            Unlock the full potential of Formatly with our premium plans. No hidden fees, cancel anytime.
          </p>
        </div>
        <SubscriptionPlans />
      </div>
    </div>
  )
}
