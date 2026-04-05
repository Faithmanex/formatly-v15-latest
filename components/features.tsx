"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Zap, FileText, FileCheck, Sparkles, Award, RefreshCw } from 'lucide-react'

export const Features = () => {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Upload and format complete documents in about 30 seconds.",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      icon: FileText,
      title: "All Citation Styles",
      description: "APA 7th, MLA 9th, Chicago, Harvard & Turabian. Reference lists, hanging indents, and DOI formatting handled for you.",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: FileCheck,
      title: "Tracked Changes",
      description: "Full transparency on every adjustment. Compare original vs. formatted side by side, and download the tracked changes document alongside your final version.",
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      icon: RefreshCw,
      title: "Instant Style Conversion",
      description: "Convert between APA, MLA, Chicago, Harvard & Turabian in one click. Headings, citations, and references adjust automatically, no need to re-upload.",
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      icon: Sparkles,
      title: "Smart AI Assistant",
      description: "Real-time guidance to help refine your document's structure, flow, and overall presentation.",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      icon: Award,
      title: "Publisher-Ready Output",
      description: "Meets strict journal and institutional requirements. Create custom styles for specific journals or departments and submit with confidence.",
      color: "text-rose-500",
      bg: "bg-rose-500/10",
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
          className="transition-base hover-lift group h-full"
        >
          <Card className="h-full bg-card/60 backdrop-blur-md border border-border/50 hover:border-primary/30 transition-all overflow-hidden relative shadow-md hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 md:p-8 space-y-4 relative z-10">
              <div className={`p-4 w-fit rounded-2xl ${feature.bg} ${feature.color} group-hover:scale-110 transition-transform shadow-inner`}>
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl sm:text-2xl leading-tight">{feature.title}</h3>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
