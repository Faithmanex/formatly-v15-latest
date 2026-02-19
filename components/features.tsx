"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, FileText, Shield, BookOpen, Users, Award } from 'lucide-react'
import { useState } from "react"

// 3D Tilt Card Component
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

export function Features() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Format in under 60 seconds.",
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/50",
    },
    {
      icon: FileText,
      title: "All Citation Styles",
      description: "APA, MLA, Chicago, Harvard, IEEE, and 50+ more academic formats",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
    },
    {
      icon: Shield,
      title: "Enterprise-Grade Security",
      description: "Your documents are secure with end-to-end encryption",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/50",
    },
    {
      icon: BookOpen,
      title: "Smart AI Assistant",
      description: "Get intelligent suggestions and guidance on all formatting styles",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/50",
    },
    {
      icon: Users,
      title: "Collaborative Workspace",
      description: "Work with co-authors and editors in real time",
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/50",
    },
    {
      icon: Award,
      title: "Publisher-Ready Output",
      description: "Meets strict journal and institutions requirements.",
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
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <CardDescription className="text-sm sm:text-base leading-relaxed">
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
