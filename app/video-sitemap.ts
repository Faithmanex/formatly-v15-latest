import type { MetadataRoute } from "next"

export default function video(): MetadataRoute.Video {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://formatlyapp.com"

  return [
    {
      url: `${baseUrl}/`,
      title: "Formatly - AI-Powered Document Formatting",
      description: "Instantly format your academic and professional research papers. Auto-apply APA, MLA, Chicago, Harvard, and Turabian styles in seconds.",
      thumbnailUrl: `${baseUrl}/og-image.png`,
      uploadDate: "2026-04-10T00:00:00+00:00",
      duration: "120",
      platform: {
        platformName: "YouTube",
        videoUrl: "https://www.youtube.com/watch?v=YRWLfOx_g34",
      },
    },
  ]
}