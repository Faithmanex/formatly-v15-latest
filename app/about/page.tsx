'use client'

import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, ArrowRight, Shield, Zap, FileText, Globe, CheckCircle2, Star } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const stats = [
  { label: "Processing Speed", value: "~30s", icon: Zap, color: "text-amber-500" },
  { label: "Citation Styles", value: "5+", icon: FileText, color: "text-blue-500" },
  { label: "Format Accuracy", value: "99%", icon: CheckCircle2, color: "text-emerald-500" },
  { label: "Global Researchers", value: "10k+", icon: Globe, color: "text-purple-500" }
]

const features = [
  {
    title: "AI-Powered Precision",
    description: "Built on Google's Gemini AI, our engine understands the nuances of APA, MLA, Chicago, and more, ensuring every comma is in its place.",
    icon: Sparkles,
    gradient: "from-blue-500/20 to-cyan-500/20"
  },
  {
    title: "Bank-Grade Security",
    description: "Your research is your intellectual property. We use end-to-end encryption and don't use your files for AI training.",
    icon: Shield,
    gradient: "from-emerald-500/20 to-teal-500/20"
  },
  {
    title: "Instant Revisions",
    description: "Get your document back with tracked changes. See exactly what was modified and maintain total control over your final draft.",
    icon: Zap,
    gradient: "from-amber-500/20 to-orange-500/20"
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      <Navigation />
      
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-dot-pattern opacity-[0.05] dark:opacity-[0.03]" />
      </div>

      <main className="relative">
        {/* Modern Hero Section */}
        <section className="pt-24 pb-20 px-4">
          <div className="max-w-6xl mx-auto text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="outline" className="px-5 py-2 rounded-full bg-primary/5 text-primary border-primary/20 backdrop-blur-md mb-6">
                <Star className="h-3.5 w-3.5 mr-2 inline fill-primary" />
                The Future of Academic Writing
              </Badge>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] pb-2"
            >
              Redefining <span className="text-primary relative inline-block">
                Precision
                <svg className="absolute -bottom-2 left-0 w-full h-2 text-primary/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
                </svg>
              </span> <br className="hidden md:block" />
              for Global Researchers.
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto"
            >
              Formatly was born from a simple frustration: formatting takes more time than the actual research. 
              We've combined state-of-the-art AI with academic rigor to give you hours of your life back.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-4 pt-4"
            >
              <Button size="lg" className="rounded-full h-14 px-8 text-lg font-bold shadow-xl shadow-primary/20 group" asChild>
                <Link href="/auth/register">
                  Start Formatting Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-lg font-medium backdrop-blur-sm" asChild>
                <Link href="/pricing">View Plan Comparison</Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Dynamic States Grid */}
        <section className="py-20 px-4 bg-muted/30 relative">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {stats.map((stat) => (
                <motion.div key={stat.label} variants={itemVariants}>
                  <Card className="bg-card/50 backdrop-blur-xl border-border/50 hover:border-primary/40 transition-all duration-300 group hover:shadow-2xl hover:-translate-y-2 overflow-hidden relative">
                    <div className={`absolute top-0 right-0 w-24 h-24 -translate-y-1/2 translate-x-1/2 opacity-10 rounded-full blur-2xl transition-colors duration-500 ${stat.color.replace('text', 'bg')}`} />
                    <CardContent className="p-8 space-y-4">
                      <div className={`p-3 rounded-2xl bg-muted/50 inline-flex ${stat.color} group-hover:scale-110 transition-transform`}>
                        <stat.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="text-4xl font-bold tracking-tight mb-1">{stat.value}</div>
                        <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                          {stat.label}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Core Methodology Section */}
        <section className="py-24 px-4 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                    The Science Behind <br />
                    <span className="text-primary italic">Automated Rigor</span>
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Generic AI often hallucinates citation details. Formatly is different. 
                    We use a multi-layered verification system that cross-references 
                    official style manuals from APA, MLA, and the University of Chicago Press.
                  </p>
                </div>

                <div className="grid gap-6">
                  {features.map((feature, i) => (
                    <motion.div 
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className={`p-6 rounded-3xl bg-gradient-to-br ${feature.gradient} border border-white/10 flex gap-5 items-start group hover:scale-[1.02] transition-transform`}
                    >
                      <div className="shrink-0 p-3 bg-background/80 rounded-2xl shadow-sm">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-xl">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute inset-0 bg-primary/10 blur-[100px] animate-pulse -z-10 rounded-full" />
                <div className="relative rounded-[2.5rem] overflow-hidden border-8 border-background shadow-2xl skew-y-1">
                  <Image 
                    src="https://res.cloudinary.com/dtbdixfgf/image/upload/v1760632903/Tracked_Changes_vsgmpt.png"
                    alt="Formatly In Action"
                    width={800}
                    height={600}
                    className="w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 p-6 bg-background/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
                    <div className="flex items-center gap-3 mb-2 text-primary font-bold">
                      <CheckCircle2 className="h-5 w-5" />
                      AI Review Complete
                    </div>
                    <p className="text-xs text-muted-foreground">
                      "Every heading level, hanging indent, and bibliographic reference is verified against current standards."
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Premium CTA Bento Section */}
        <section className="py-24 px-4">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto rounded-[3rem] bg-primary p-12 md:p-20 text-primary-foreground relative overflow-hidden text-center space-y-10"
          >
            <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
            
            <div className="space-y-6 relative z-10">
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Done with the Busywork? <br />
                <span className="text-white/80">Get Done Faster.</span>
              </h2>
              <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
                Join 10,000+ researchers who trust Formatly to handle the mechanics 
                while they handle the ideas.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 relative z-10">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-2xl h-16 px-10 font-bold text-xl shadow-2xl transition-all hover:scale-105" asChild>
                <Link href="/auth/register">Start Now — It's Free</Link>
              </Button>
            </div>

            <div className="pt-10 flex flex-wrap justify-center gap-x-12 gap-y-4 text-sm font-medium text-white/60 relative z-10 border-t border-white/10">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> No Credit Card Required</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> 3 Free Docs Every Month</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Journal-Ready Output</span>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
