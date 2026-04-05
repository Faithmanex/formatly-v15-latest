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

      <main>
        <HelpFAQ />
      </main>

      <Footer />
    </div>
  )
}
