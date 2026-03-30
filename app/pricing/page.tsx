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
      
      <main className="py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 text-center mb-12 sm:mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Focus on your research, we'll handle the formatting. Choose a plan that works for you.
          </p>
        </div>
        
        <Pricing />
      </main>

      <Footer />
    </div>
  )
}
