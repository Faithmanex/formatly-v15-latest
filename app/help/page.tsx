import { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { HelpFAQ } from "@/components/help-faq"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Help Center & FAQ | Formatly",
  description: "Find answers to frequently asked questions about Formatly, citation styles, and document formatting.",
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">How can we help?</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Search our help center or browse frequently asked questions below.
          </p>
        </div>
        
        <HelpFAQ />
      </main>

      <Footer />
    </div>
  )
}
