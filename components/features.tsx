"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, FileText, FileCheck, BookOpen, Award, RefreshCw } from 'lucide-react'
import { useState } from "react"

const TiltCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

export const Features = () => {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Upload and format complete documents in about 30 seconds — no manual tweaking needed.",
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/50",
    },
    {
      icon: FileText,
      title: "All Citation Styles",
      description: "APA 7th, MLA 9th, Chicago, Harvard & Turabian — with automatic in-text citations, reference lists, hanging indents, and DOI formatting.",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
    },
    {
      icon: FileCheck,
      title: "Tracked Changes",
      description: "Full transparency on every adjustment. Compare original vs. formatted side by side, and download the tracked changes document alongside your final version.",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/50",
    },
    {
      icon: BookOpen,
      title: "Smart AI Assistant",
      description: "Real-time guidance that catches formatting and structure issues, suggests improvements, and helps organise your heading hierarchy and flow.",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/50",
    },
    {
      icon: Award,
      title: "Publisher-Ready Output",
      description: "Meets strict journal and institutional requirements. Create custom styles for specific journals or departments and submit with confidence.",
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-950/50",
    },
    {
      icon: RefreshCw,
      title: "Instant Style Conversion",
      description: "Convert between APA, MLA, Chicago, Harvard & Turabian in one click. Headings, citations, and references adjust automatically — no need to re-upload.",
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/50",
    },
  ]

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {features.map((feature, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          onMouseEnter={() => setHoveredFeature(index)}
          onMouseLeave={() => setHoveredFeature(null)}
        >
          <TiltCard>
            <Card
              className={`h-full transition-all duration-300 hover:shadow-2xl ${
                hoveredFeature === index ? "scale-105 border-primary" : ""
              }`}
            >
              <CardHeader className="p-4 sm:p-6">
                <motion.div
                  animate={{
                    scale: hoveredFeature === index ? 1.1 : 1,
                    rotate: hoveredFeature === index ? 360 : 0,
                  }}
                  transition={{ duration: 0.5 }}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-3 sm:mb-4`}
                >
                  <feature.icon className={`h-6 w-6 sm:h-7 sm:w-7 ${feature.color}`} />
                </motion.div>
                <CardTitle className="text-lg sm:text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <CardDescription className="text-base sm:text-lg leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          </TiltCard>
        </motion.div>
      ))}
    </div>
  )
}
