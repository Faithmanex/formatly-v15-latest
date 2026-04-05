import { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Pricing } from "@/components/pricing"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Pricing | Formatly",
  description: "Transparent pricing for researchers, students, and institutions. Choose the plan that fits your needs.",
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main>
        <Pricing />
      </main>

      <Footer />
    </div>
  )
}
