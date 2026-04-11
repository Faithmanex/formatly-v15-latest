import { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { HelpFAQ } from "@/components/help-faq"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Help Center & FAQ | Formatly",
  description: "Find answers to frequently asked questions about Formatly, citation styles, and document formatting.",
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do I upload a document?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can upload documents by clicking the 'Upload Document' button on the dashboard, or by dragging and dropping files directly onto the upload zone. We support .docx files up to 10MB in size."
      }
    },
    {
      "@type": "Question",
      "name": "What file formats are supported?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Currently, we support Microsoft Word documents (.docx format). We do not support .doc, .pdf, or .txt files at this time."
      }
    },
    {
      "@type": "Question",
      "name": "What citation styles do you support?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We support APA, MLA, Harvard, Chicago, and Turabian citation styles. Each style includes proper in-text citations, reference formatting, and document structure according to official guidelines."
      }
    },
    {
      "@type": "Question",
      "name": "Can I switch my document to a different citation style?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! You can convert your document between any supported style — APA, MLA, Chicago, Harvard, and Turabian — in one click. All headings, citations, and references update automatically."
      }
    },
    {
      "@type": "Question",
      "name": "How accurate is the formatting?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Our AI-powered formatting engine follows official style guidelines with 100% accuracy. We continuously update our algorithms to match the latest formatting standards."
      }
    },
    {
      "@type": "Question",
      "name": "How long does processing take?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most documents are processed within 30 seconds, depending on length and complexity. You'll see real-time progress updates during processing."
      }
    },
    {
      "@type": "Question",
      "name": "Is Formatly free to use?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We offer a free tier for registered users with limited document processing. Premium plans offer unlimited processing and advanced features."
      }
    },
    {
      "@type": "Question",
      "name": "Can I cancel my subscription anytime?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, you can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your billing period."
      }
    }
  ]
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>
      <Navigation />

      <main>
        <HelpFAQ />
      </main>

      <Footer />
    </div>
  )
}
