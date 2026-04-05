'use client'

import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Sparkles, Zap, Users, GraduationCap, FileCheck, ArrowRight, Lightbulb, Heart, Target } from "lucide-react"
import Link from "next/link"

const stats = [
  { label: "Processing Time", value: "30s", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { label: "Major Formats", value: "5+", icon: FileCheck, color: "text-green-500", bg: "bg-green-500/10" },
  { label: "Researchers Helping", value: "10k+", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Accuracy Rate", value: "100%", icon: Shield, color: "text-purple-500", bg: "bg-purple-500/10" }
]

const values = [
  {
    title: "Intelligence First",
    description: "We leverage cutting-edge AI to understand document context, ensuring citation accuracy that rules-based systems miss.",
    icon: Lightbulb
  },
  {
    title: "Mission Centric",
    description: "Our goal is simple: eliminate formatting friction to accelerate scientific discovery across the globe.",
    icon: Target
  },
  {
    title: "User Empathy",
    description: "Built by researchers for researchers. We understand the high-stakes pressure of publication deadlines.",
    icon: Heart
  }
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Navigation />
      
      {/* Decorative background blobs */}
      <div className="absolute top-0 right-0 -z-10 translate-x-1/2 -translate-y-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 -z-10 -translate-x-1/4 translate-y-1/4 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <main className="relative pt-20 pb-32">
        {/* Header Section */}
        <section className="px-4 text-center space-y-6 mb-24 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="px-4 py-1.5 rounded-full bg-primary/5 text-primary border-primary/20 backdrop-blur-sm mb-4">
              <Sparkles className="h-3.5 w-3.5 mr-2 inline" />
              Our Mission
            </Badge>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black tracking-tight"
          >
            Empowering Minds to <br /> 
            <span className="text-primary italic">Focus on Discovery</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto"
          >
            Formatly was founded with a clear vision: to eradicate the manual burden 
            of academic formatting. We believe researchers should spend their time 
            innovating, not fighting citation indents.
          </motion.p>
        </section>

        {/* Stats Grid */}
        <section className="px-4 mb-32">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-card/50 backdrop-blur-xl border-border/50 hover:border-primary/30 transition-all group">
                  <CardContent className="p-8 text-center space-y-4">
                    <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} inline-block group-hover:scale-110 transition-transform`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-4xl font-black">{stat.value}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">
                        {stat.label}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* The Problem & Solution */}
        <section className="px-4 mb-32 bg-primary/5 py-24 relative">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl font-bold">Why we built Formatly</h2>
              <div className="space-y-6">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Academic writing is a high-stakes endeavor. Between complex citations, strictly mandated 
                  reference lists, and evolving institutional style guides, researchers often lose days 
                  of productivity during the final stages of document preparation.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We saw brilliant scholars struggling with manual formatting when they could be pushing 
                  the boundaries of human knowledge. We decided to bridge that gap with intelligent 
                  automation that understands style as well as the rules.
                </p>
              </div>
              <div className="flex gap-4">
                <Button className="rounded-xl h-12 px-6 group" asChild>
                  <Link href="/dashboard">
                    Get Started Now
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="outline" className="rounded-xl h-12 px-6" asChild>
                  <Link href="/pricing">View Plans</Link>
                </Button>
              </div>
            </div>
            
            <div className="grid gap-6">
              {values.map((value, i) => (
                <div key={i} className="p-6 bg-card border rounded-3xl space-y-3 group hover:shadow-xl transition-shadow">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary inline-block group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <value.icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-xl">{value.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8 p-12 rounded-[40px] bg-primary text-primary-foreground relative overflow-hidden shadow-2xl shadow-primary/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <h2 className="text-4xl font-bold relative z-10">Ready to accelerate your research?</h2>
            <p className="text-primary-foreground/90 text-lg max-w-xl mx-auto relative z-10">
              Join thousands of doctoral students and researchers who have reclaimed 
              their time with Formatly's intelligent formatting engine.
            </p>
            <div className="relative z-10">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-2xl h-14 px-8 font-bold text-lg shadow-xl" asChild>
                <Link href="/auth/register">Join 10k+ Researchers</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
