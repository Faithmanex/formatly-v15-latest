import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact | Formatly",
  description:
    "Get in touch with the Formatly team. We're here to help with any questions about document formatting, pricing, or technical support.",
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
