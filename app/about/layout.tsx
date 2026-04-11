import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About | Formatly",
  description:
    "Learn about Formatly - the AI-powered document formatting tool that formats APA, MLA, Chicago, Harvard, and Turabian styles in seconds.",
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
