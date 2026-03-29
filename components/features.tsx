"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, FileText, FileCheck, BookOpen, Users, Award } from 'lucide-react'
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
      description: "Format complete documents in about 30 seconds.",
      details: [
        "Upload and format in one step",
        "Process multiple documents at once",
        "No manual tweaking needed",
      ],
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/50",
    },
    {
      icon: FileText,
      title: "All Citation Styles",
      description: "Every major academic style, done right.",
      details: [
        "APA 7th, MLA 9th, Chicago, Harvard & Turabian",
        "Automatic in-text citations & reference lists",
        "Hanging indents, italics, and DOI formatting",
      ],
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
    },
    {
      icon: FileCheck,
      title: "Tracked Changes",
      description: "See every change, clearly marked.",
      details: [
        "Full transparency on every adjustment",
        "Compare original vs. formatted side by side",
        "Download tracked changes document alongside the final version",
      ],
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/50",
    },
    {
      icon: BookOpen,
      title: "Smart AI Assistant",
      description: "Real-time guidance to refine your document.",
      details: [
        "Smart suggestions as you work",
        "Catches formatting and structure issues",
        "Helps organise heading hierarchy and flow",
      ],
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/50",
    },
    {
      icon: Users,
      title: "Collaborative Workspace",
      description: "Work with co-authors and editors in real time.",
      details: [
        "Share styles and templates across your team",
        "See every change with full transparency",
        "Centralised billing and seat management",
      ],
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/50",
    },
    {
      icon: Award,
      title: "Publisher-Ready Output",
      description: "Submit with confidence.",
      details: [
        "Meets strict journal and institutional requirements",
        "Shows every adjustment made to your document",
        "Create custom styles for specific journals or departments",
      ],
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-950/50",
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
                <CardDescription className="text-sm sm:text-base leading-relaxed mt-1">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <ul className="space-y-2">
                  {feature.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${feature.bgColor}`} />
                      {detail}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TiltCard>
        </motion.div>
      ))}
    </div>
  )
}
