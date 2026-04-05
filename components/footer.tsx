"use client"

import Link from "next/link"
import Image from "next/image"
import TwitterIcon from "@/public/logo-white.svg"

export const Footer = () => {
  return (
    <footer className="border-t py-8 sm:py-10 px-3 sm:px-4 md:px-6 lg:px-8 bg-muted/10 backdrop-blur-sm relative">
      <div className="absolute inset-0 bg-dot-pattern opacity-[0.05] dark:opacity-[0.03]" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col items-center gap-6 mb-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-dark.svg"
              alt="Formatly Logo"
              className="h-8 sm:h-9 dark:hidden"
              width={36}
              height={36}
            />
            <Image
              src="/logo-white.svg"
              alt="Formatly Logo"
              className="h-8 sm:h-9 hidden dark:block"
              width={36}
              height={36}
            />
            <span className="text-xl sm:text-2xl font-bold text-foreground">Formatly</span>
          </Link>

          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="https://twitter.com/formatlyapp" target="_blank" rel="noopener noreferrer" className="group">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-muted hover:bg-primary transition-colors group-hover:text-primary-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-muted-foreground group-hover:text-primary-foreground transition-colors"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
            </Link>

            <Link href="mailto:formatlyapp@gmail.com" className="group">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-muted hover:bg-primary transition-colors group-hover:text-primary-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground group-hover:text-primary-foreground transition-colors"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
            </Link>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-muted-foreground pt-6 border-t">
          <div className="text-center md:text-left">
            <span>© {new Date().getFullYear()} Formatly. All rights reserved.</span>
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
