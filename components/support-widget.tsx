'use client'

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { HelpCircle, MessageSquare, BookOpen, Mail, X, MessageCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()

  const menuItems = [
    {
      title: "Help Center",
      description: "Browse FAQs and guides",
      icon: BookOpen,
      href: "/help",
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    {
      title: "AI Support",
      description: "Chat with Formatly AI",
      icon: MessageCircle,
      href: "/dashboard?tab=chat", // Assuming dashboard has a chat tab or similar
      color: "text-purple-500",
      bg: "bg-purple-50"
    },
    {
      title: "Contact Us",
      description: "Send us a message",
      icon: Mail,
      href: "/contact",
      color: "text-green-500",
      bg: "bg-green-50"
    }
  ]

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-background/20 backdrop-blur-sm pointer-events-auto"
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute bottom-16 right-0 w-72 bg-card border rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b bg-muted/30">
                <h3 className="font-bold flex items-center gap-2 text-lg">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Support
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  How can we help you today?
                </p>
              </div>
              
              <div className="p-2">
                {menuItems.map((item, index) => (
                  <Link 
                    key={index} 
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                  >
                    <div className={`p-2 rounded-lg ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground italic">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              
              <div className="p-3 bg-muted/10 border-t text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                  Formatly Support System
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-colors ${
          isOpen ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'
        }`}
        aria-label="Toggle support menu"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <HelpCircle className="h-7 w-7" />
        )}
      </motion.button>
    </div>
  )
}
