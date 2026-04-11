import { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Pricing } from "@/components/pricing"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Pricing | Formatly",
  description: "Transparent pricing for researchers, students, and institutions. Choose the plan that fits your needs.",
}

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Choose the Right Plan",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Assess Your Needs",
      "text": "Consider how many documents you need to format per month. Free users get 3 documents, while paid plans offer unlimited processing."
    },
    {
      "@type": "HowToStep",
      "name": "Compare Plan Features",
      "text": "Review the features of each plan: citation styles supported, file size limits, priority processing, and custom style options."
    },
    {
      "@type": "HowToStep",
      "name": "Choose Billing Cycle",
      "text": "Select monthly or yearly billing. Yearly plans include 2 months free, saving you 20% on your subscription."
    },
    {
      "@type": "HowToStep",
      "name": "Sign Up & Subscribe",
      "text": "Create an account or log in, select your preferred plan, and complete payment through PayPal."
    }
  ]
}

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Formatly Premium",
  "description": "Unlimited document formatting with all citation styles, priority processing, and custom style features.",
  "offers": [
    {
      "@type": "Offer",
      "name": "Monthly",
      "price": "9.99",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    {
      "@type": "Offer",
      "name": "Yearly",
      "price": "99.99",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "1250"
  }
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      </head>
      <Navigation />

      <main>
        <Pricing />
      </main>

      <Footer />
    </div>
  )
}
