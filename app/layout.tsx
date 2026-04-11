import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SWRConfig } from "swr"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SupportWidget } from "@/components/support-widget"
import { AuthProvider } from "@/components/auth-provider"

import { Analytics } from "@vercel/analytics/react"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://formatlyapp.com"),
  title: "Formatly | Format APA, MLA, Chicago & Turabian in Seconds",
  description: "Instantly format your academic and professional research papers. Auto-apply APA, MLA, Chicago, Harvard, and Turabian styles in seconds.",
  icons: {
    icon: "/favicon.ico",
    apple: [
      { url: "/logo-180-light.svg", type: "image/svg+xml", sizes: "180x180" },
    ]
  },
  openGraph: {
    title: "Formatly | Format APA, MLA, Chicago & Turabian in Seconds",
    description: "Instantly format your academic and professional research papers. Auto-apply APA, MLA, Chicago, Harvard, and Turabian styles in seconds.",
    url: "https://formatlyapp.com",
    siteName: "Formatly",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Formatly - Format APA, MLA, Chicago & Turabian in Seconds",
      },
    ],
  },
  alternates: {
    canonical: "https://formatlyapp.com",
    languages: {
      en: "https://formatlyapp.com",
    },
  },
  twitter: {
    card: "summary_large_image",
    title: "Formatly | Format APA, MLA, Chicago & Turabian in Seconds",
    description: "Instantly format your academic and professional research papers. Auto-apply APA, MLA, Chicago, Harvard, and Turabian styles in seconds.",
    site: "@formatlyapp",
    creator: "@formatlyapp",
    images: [
      {
        url: "/twitter-card-light.svg",
        width: 800,
        height: 418,
        alt: "Formatly - Format APA, MLA, Chicago & Turabian in Seconds",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://formatlyapp.com"

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Formatly",
    url: baseUrl,
    description: "Instantly format your academic and professional research papers. Auto-apply APA, MLA, Chicago, Harvard, and Turabian styles.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Formatly",
    operatingSystem: "Web",
    applicationCategory: "BusinessApplication",
    description: "AI-powered academic document formatting tool supporting APA, MLA, Chicago, Harvard, and Turabian citation styles.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free plan available with 3 documents per month",
    },
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SWRConfig
          value={{
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
            shouldRetryOnError: true,
            errorRetryCount: 3,
            dedupingInterval: 30_000,
          }}
        >
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <AuthProvider>
              {children}
              <Toaster />
              <SupportWidget />
            </AuthProvider>
          </ThemeProvider>
        </SWRConfig>
        <Analytics />
      </body>
    </html>
  )
}
