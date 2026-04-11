"use client"

import { useState } from "react"
import { motion, type Variants } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, MessageSquare, Send, CheckCircle2, Loader2, Clock, Sparkles, BookOpen, HelpCircle, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { getSupabase } from "@/lib/supabase"
import { getUserSubscription } from "@/lib/billing"
import useSWR from "swr"
import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

// Explicit typing to resolve framer-motion variants issues during build
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: i * 0.1,
      ease: "easeOut"
    },
  }),
}

const contactMethods = [
  {
    icon: Mail,
    title: "Email Us",
    description: "Drop us a line anytime",
    detail: "formatlyapp@gmail.com",
    badge: "< 24hr response",
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500",
  },
  {
    icon: MessageSquare,
    title: "Live Chat",
    description: "Real-time help for Premium users",
    detail: "Mon – Fri, 9am – 5pm GMT",
    badge: "Premium",
    gradient: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-500",
  },
  {
    icon: BookOpen,
    title: "Help Center",
    description: "Browse FAQs and guides",
    detail: "Self-serve answers, 24/7",
    badge: "Instant",
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-500",
    href: "/help",
  },
]

export default function ContactPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const { data: subscription } = useSWR(
    user?.id ? ["subscription", user.id] : null,
    ([, id]: [string, string]) => getUserSubscription(id),
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  )
  const planName = subscription?.plan?.name ?? "Free"

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const nameValue = formData.get("full_name") as string
    const emailValue = formData.get("email") as string
    const subjectValue = formData.get("subject") as string || "Contact Form Submission"
    const messageValue = formData.get("message") as string

    let aiPriority = "medium"

    // AI Urgency Classification
    try {
      const response = await fetch("/api/support/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          subject: subjectValue, 
          message: messageValue, 
          planName 
        }),
      })
      const result = await response.json()
      if (result.priority) {
        aiPriority = result.priority
      }
    } catch (error) {
      console.error("AI classification error:", error)
    }

    // Apply Plan-based priority floor
    let finalPriority = aiPriority as "low" | "medium" | "high" | "urgent"
    if (planName === "Business") {
      if (finalPriority !== "urgent") finalPriority = "urgent"
    } else if (planName === "Pro") {
      if (finalPriority === "low" || finalPriority === "medium") finalPriority = "high"
    }

    const ticketData = {
      full_name: nameValue,
      email: emailValue,
      message: messageValue,
      subject: subjectValue,
      user_id: user?.id || null,
      status: "open" as const,
      priority: finalPriority,
    }

    try {
      const { error } = await getSupabase().from("support_tickets").insert(ticketData)
      if (error) throw error

      setSubmitted(true)
      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
      })
    } catch (error) {
      console.error("Error submitting contact form:", error)
      toast({
        title: "Submission failed",
        description: "There was an error sending your message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      {/* Hero */}
      <section className="relative pt-16 pb-10 sm:pt-24 sm:pb-14 px-4 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-dot-pattern opacity-[0.08] dark:opacity-[0.04]" />
        </div>

        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
          >
            <Sparkles className="h-4 w-4" />
            We typically respond within a few hours
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-5"
          >
            How can we{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">help you?</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeUp}
            className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto"
          >
            Whether it's a question about formatting, your account, or feedback — we're here for you.
          </motion.p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="px-4 pb-12 sm:pb-16">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-4 sm:gap-6">
          {contactMethods.map((method, i) => (
            <motion.div
              key={method.title}
              initial="hidden"
              animate="visible"
              custom={i + 3}
              variants={fadeUp}
            >
              <ContactCard method={method} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Form Section */}
      <section className="px-4 pb-20 sm:pb-28">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-start">
            {/* Left info panel */}
            <motion.div
              initial="hidden"
              animate="visible"
              custom={6}
              variants={fadeUp}
              className="lg:col-span-2 space-y-8"
            >
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">Send us a message</h2>
                <p className="text-muted-foreground">
                  Fill out the form and our team will get back to you within 24 hours. Pro and Business users get priority support.
                </p>
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Fast Response</p>
                    <p className="text-xs text-muted-foreground">Average reply time under 6 hours</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">AI-Powered Routing</p>
                    <p className="text-xs text-muted-foreground">Your message is prioritized intelligently</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                    <HelpCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Need quick answers?</p>
                    <p className="text-xs text-muted-foreground">
                      <Link href="/help" className="text-primary hover:underline">Visit our Help Center →</Link>
                    </p>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block p-5 rounded-2xl bg-muted/40 border border-border/50 relative">
                <div className="absolute -top-3 left-5 text-4xl text-primary/30 font-serif">"</div>
                <p className="text-sm text-muted-foreground italic leading-relaxed pt-2">
                  Formatly saved me hours of formatting work. When I had a question, their support team responded within minutes.
                </p>
                <p className="text-xs font-semibold mt-3">— Graduate Researcher, Stanford University</p>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div
              initial="hidden"
              animate="visible"
              custom={7}
              variants={fadeUp}
              className="lg:col-span-3"
            >
              <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-primary/5 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="min-h-[420px] flex flex-col items-center justify-center text-center space-y-5 relative z-10"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
                      <div className="relative w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                        <CheckCircle2 className="h-10 w-10 text-green-500" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold">Message Sent!</h2>
                      <p className="text-muted-foreground max-w-[300px] text-sm">
                        Thank you for reaching out. We've received your message and our team will respond shortly.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="mt-2 rounded-xl"
                      onClick={() => setSubmitted(false)}
                    >
                      Send another message
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="full_name" className="text-xs font-bold uppercase tracking-wider ml-1">
                          Full Name
                        </Label>
                        <Input
                          id="full_name"
                          name="full_name"
                          placeholder="Your name"
                          required
                          className="h-12 rounded-xl bg-background/50 border-border/60 focus:border-primary/50 transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider ml-1">
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="name@example.com"
                          required
                          className="h-12 rounded-xl bg-background/50 border-border/60 focus:border-primary/50 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-xs font-bold uppercase tracking-wider ml-1">
                        Subject
                      </Label>
                      <Input
                        id="subject"
                        name="subject"
                        placeholder="What's this about?"
                        className="h-12 rounded-xl bg-background/50 border-border/60 focus:border-primary/50 transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-xs font-bold uppercase tracking-wider ml-1">
                        Your Message
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Tell us how we can help..."
                        required
                        className="min-h-[160px] rounded-xl bg-background/50 border-border/60 resize-none focus:border-primary/50 transition-colors"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-all shadow-lg shadow-primary/20 group"
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Send Message
                          <Send className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </span>
                      )}
                    </Button>

                    <p className="text-[11px] text-center text-muted-foreground">
                      By submitting, you agree to our{" "}
                      <Link href="/privacy" className="underline hover:text-foreground transition-colors">
                        Privacy Policy
                      </Link>
                    </p>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  )
}

function ContactCard({ method }: { method: any }) {
  const CardContent = (
    <div className="group h-full p-5 sm:p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-default">
      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${method.gradient} mb-4`}>
        <method.icon className={`h-5 w-5 ${method.iconColor}`} />
      </div>
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-bold text-sm">{method.title}</h3>
        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {method.badge}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{method.description}</p>
      <p className="text-xs font-medium text-foreground/80">{method.detail}</p>
      {method.href && (
        <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
          Visit <ArrowRight className="h-3 w-3" />
        </div>
      )}
    </div>
  )

  if (method.href) {
    return (
      <Link href={method.href} className="block h-full">
        {CardContent}
      </Link>
    )
  }

  return CardContent
}
