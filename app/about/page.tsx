"use client"

import { Metadata } from "next"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, ArrowRight, Zap, Shield, FileText, Clock, CheckCircle, Target, FileCheck } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
  title: "About | Formatly",
  description: "Learn about Formatly - the AI-powered document formatting tool that formats APA, MLA, Chicago, Harvard, and Turabian styles in seconds.",
}

const stats = [
  { label: "Accuracy", value: "99%", icon: Target },
  { label: "Faster formatting", value: "480x", icon: Zap },
  { label: "Style compliance", value: "100%", icon: FileCheck },
  { label: "Processing Time", value: "~30s", icon: Clock }
]

const values = [
  {
    title: "Speed Without Compromise",
    description: "Format documents in about 30 seconds. Every heading, citation, and reference is handled instantly.",
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-500/10"
  },
  {
    title: "AI-Powered, Human-Reviewed",
    description: "Powered by AI for context-aware formatting, with tracked revisions so you verify every change.",
    icon: Sparkles,
    color: "text-primary",
    bg: "bg-primary/10"
  },
  {
    title: "Your Documents Stay Yours",
    description: "End-to-end encryption and secure storage. Your research isn't our training data.",
    icon: Shield,
    color: "text-green-500",
    bg: "bg-green-500/10"
  },
  {
    title: "Built for Real Academic Work",
    description: "DOC, DOCX, PDF support. Publisher-ready output that meets journal and institutional rules.",
    icon: FileText,
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  }
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-primary/30">
      {/* Dynamic Backgrounds matching landing page */}
      <div className="fixed inset-0 -z-10 bg-background">
        <div className="absolute inset-0 bg-dot-pattern opacity-[0.15] dark:opacity-[0.08]" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.02]" />
        <div className="absolute inset-0 bg-radial-vignette" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 dark:bg-primary/5 rounded-full blur-[100px] animate-float-slow" />
        <div className="absolute bottom-0 right-1/4 w-[32rem] h-[32rem] bg-secondary/10 dark:bg-secondary/5 rounded-full blur-[120px] animate-float-slower" />
      </div>

      <Navigation />
      
      <main className="relative pt-24 pb-32">
        {/* Hero Section */}
        <section className="px-4 text-center space-y-6 mb-24 max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="px-4 py-1.5 rounded-full shadow-lg text-sm mb-4">
              <Sparkles className="h-4 w-4 mr-2 inline" />
              Our Mission
            </Badge>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            Format Smarter, <br className="hidden sm:block" /> 
            <span className="text-primary italic">Not Harder</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg sm:text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-medium"
          >
            Formatly is an AI-powered academic formatting platform built to handle 
            APA, MLA, Chicago, Harvard, and Turabian styles — automatically. 
          </motion.p>
        </section>

        {/* Stats Section with Glassmorphism */}
        <section className="px-4 mb-32 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="transition-base hover-lift"
              >
                <Card className="h-full bg-card/60 backdrop-blur-xl border-border hover:border-primary/50 transition-all shadow-lg hover:shadow-xl overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-6 sm:p-8 text-center space-y-4 relative z-10 flex flex-col items-center justify-center">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                      <stat.icon className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <div>
                      <div className="text-3xl sm:text-4xl font-bold tracking-tight mb-1">{stat.value}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider font-semibold">
                        {stat.label}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Product Showcase / Story */}
        <section className="px-4 mb-32 relative z-10">
          <div className="max-w-7xl mx-auto bg-card/40 backdrop-blur-md rounded-3xl border border-border/50 p-6 sm:p-12 lg:p-16 shadow-2xl">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Focus on your research. <br/> We'll handle the margins.</h2>
                <div className="space-y-6 text-lg text-muted-foreground">
                  <p>
                    Academic formatting rules are strict and time-consuming. APA 7th edition 
                    has specific heading levels, reference formats, and hanging indents. 
                    Chicago requires footnotes and bibliographies done right. 
                  </p>
                  <p>
                    Formatly was built out of frustration. Researchers spend countless hours 
                    nudging margins and standardizing citations instead of analyzing their 
                    discoveries. Our is designed to AI safely automates this exhaustive process, 
                    leaving you with a publisher-ready document.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button size="lg" className="rounded-full shadow-lg" asChild>
                    <Link href="/dashboard">
                      Start Formatting
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative h-[400px] w-full rounded-2xl overflow-hidden shadow-2xl border bg-muted/30"
              >
                <Image 
                  src="https://res.cloudinary.com/dtbdixfgf/image/upload/v1760632903/Neat_Copy_dsu2yd.png" 
                  alt="Formatted Document Example"
                  fill
                  className="object-cover object-left-top"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-background/90 backdrop-blur-md rounded-xl p-4 border shadow-lg flex items-center justify-between transition-base hover-lift cursor-default">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-500/20 text-green-500 p-2 rounded-full">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div className="text-sm font-medium">Formatting complete</div>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">00:28s</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values Bento Grid */}
        <section className="px-4 mb-32 max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">Core Principles</h2>
            <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto">
              We believe great software should disappear, leaving you to do your best work.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="transition-base hover-lift group h-full"
              >
                <Card className="h-full bg-card/60 backdrop-blur-md border border-border/50 hover:border-primary/30 transition-all overflow-hidden relative shadow-md hover:shadow-xl">
                   <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-6 md:p-8 space-y-4 relative z-10">
                    <div className={`p-3 w-fit rounded-2xl ${value.bg} ${value.color} group-hover:scale-110 transition-transform shadow-inner`}>
                      <value.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-xl leading-tight">{value.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Final CTA Showcase */}
        <section className="px-4 text-center max-w-5xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto space-y-8 p-8 sm:p-12 md:p-16 rounded-[40px] bg-primary text-primary-foreground relative overflow-hidden shadow-2xl shadow-primary/20"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 max-w-2xl mx-auto space-y-6 sm:space-y-8">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">Ready to stop fighting formatting?</h2>
              <p className="text-primary-foreground/90 text-lg sm:text-xl">
                Upload your document and get a properly formatted result in about 30 seconds. 
                Free plan includes 3 documents per month.
              </p>
              <div className="pt-4">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-2xl h-14 px-8 font-bold text-lg shadow-xl" asChild>
                  <Link href="/auth/register">Start Formatting for Free</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
