"use client"

import Link from "next/link"
import { Twitter, Linkedin, Mail } from "lucide-react"

export const Footer = () => {
  return (
    <footer className="border-t py-8 sm:py-10 px-3 sm:px-4 md:px-6 lg:px-8 bg-muted/10 backdrop-blur-sm relative">
      <div className="absolute inset-0 bg-dot-pattern opacity-[0.05] dark:opacity-[0.03]" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
              <span className="text-base sm:text-lg font-bold">F</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-foreground">Formatly</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="https://twitter.com/formatlyapp" target="_blank" rel="noopener noreferrer" className="group">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-muted hover:bg-primary transition-colors">
                <Twitter className="h-5 w-5 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
              </div>
            </Link>

            <Link href="https://linkedin.com/company/formatly" target="_blank" rel="noopener noreferrer" className="group">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-muted hover:bg-primary transition-colors">
                <Linkedin className="h-5 w-5 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
              </div>
            </Link>


            <Link href="mailto:formatlyapp@gmail.com" className="group">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-muted hover:bg-primary transition-colors">
                <Mail className="h-5 w-5 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
              </div>
            </Link>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-muted-foreground pt-6 border-t">
          <div className="text-center md:text-left">
            <span>&copy; {new Date().getFullYear()} Formatly. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap gap-4 sm:gap-6 justify-center">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
