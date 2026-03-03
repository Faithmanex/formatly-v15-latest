"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, MessageSquare, Send, ArrowLeft, CheckCircle2, Loader2, MapPin, Phone } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function ContactPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setLoading(false)
    setSubmitted(true)
    toast({
      title: "Message sent!",
      description: "We'll get back to you as soon as possible.",
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 -z-10 overflow-hidden opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl z-10"
      >
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to home
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Left Column: Info */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-4">Get in touch</h1>
              <p className="text-lg text-muted-foreground">
                Have questions or need assistance? Our team is here to help you get the most out of Formatly.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold">Email us</h3>
                  <p className="text-muted-foreground">formatlyapp@gmail.com</p>
                  <p className="text-sm text-primary font-medium mt-1">Response time: &lt; 24 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold">Live Support</h3>
                  <p className="text-muted-foreground">Available for Premium users</p>
                  <p className="text-sm text-primary font-medium mt-1">Mon - Fri, 9am - 5pm GMT</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-muted/30 border border-border/50">
              <h4 className="font-bold mb-2">Technical Issues?</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Check our Status page or visit the documentation for quick troubleshooting steps.
              </p>
              <Button variant="outline" size="sm" className="rounded-xl w-full" asChild>
                <Link href="/faq">Visit FAQ</Link>
              </Button>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl relative">
            {submitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-[400px] flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold">Message Sent!</h2>
                <p className="text-muted-foreground max-w-[250px]">
                  Thank you for reaching out. We've received your message and will get back to you soon.
                </p>
                <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setSubmitted(false)}>
                  Send another message
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider ml-1">Full Name</Label>
                  <Input id="name" placeholder="Enter your name" required className="h-12 rounded-xl bg-background/50 border-border/60" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider ml-1">Email Address</Label>
                  <Input id="email" type="email" placeholder="name@example.com" required className="h-12 rounded-xl bg-background/50 border-border/60" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-xs font-bold uppercase tracking-wider ml-1">Your Message</Label>
                  <Textarea id="message" placeholder="How can we help you?" required className="min-h-[150px] rounded-xl bg-background/50 border-border/60 resize-none" />
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-all shadow-lg shadow-primary/20 group"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <div className="flex items-center justify-center gap-2 group-hover:translate-x-1 transition-transform">
                      Send Message
                      <Send className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </motion.div>

      <footer className="mt-20 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Formatly. Built with precision for researchers.</p>
      </footer>
    </div>
  )
}
