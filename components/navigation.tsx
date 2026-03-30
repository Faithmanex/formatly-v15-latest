"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { LayoutDashboard, Shield, Menu } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useAuth } from "@/components/auth-provider"

export const Navigation = () => {
  const { user, profile, isLoading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, href: string) => {
    // Check if we are on the homepage
    if (typeof window !== "undefined" && window.location.pathname === "/") {
      if (href.startsWith("#")) {
        e.preventDefault()
        setIsOpen(false)
        const targetId = href.replace("#", "")
        const elem = document.getElementById(targetId)
        if (elem) {
          const headerOffset = 80
          const elementPosition = elem.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          })
        }
      }
    }
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 border-b"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo and Site Name - Left Aligned */}
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center">
            <Link href="/">
              <img src="/logo-dark.svg" alt="Formatly Logo" className="h-8 sm:h-10 dark:hidden" />
              <img src="/logo-white.svg" alt="Formatly Logo" className="h-8 sm:h-10 hidden dark:block" />
            </Link>
          </motion.div>

          {/* Navigation Links - Centered */}
          <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center gap-6 lg:gap-8">
            <Link
              href="/#features"
              onClick={(e) => handleScroll(e, "#features")}
              className="relative text-sm font-medium text-foreground/80 hover:text-foreground transition-colors group"
            >
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              href="/pricing"
              className="relative text-sm font-medium text-foreground/80 hover:text-foreground transition-colors group"
            >
              Pricing
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              href="/help"
              className="relative text-sm font-medium text-foreground/80 hover:text-foreground transition-colors group"
            >
              Help
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              href="/about"
              className="relative text-sm font-medium text-foreground/80 hover:text-foreground transition-colors group"
            >
              About
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </div>

          {/* Auth Buttons - Right Aligned */}
          <div className="hidden md:flex items-center gap-2 sm:gap-4">
            {!isLoading && user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <Button variant="ghost" size="sm" className="hidden sm:flex rounded-full" asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                {profile?.role === "admin" && (
                  <Button variant="outline" size="sm" className="hidden sm:flex rounded-full border-primary/50 text-primary hover:bg-primary/10" asChild>
                    <Link href="/dashboard/admin">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm rounded-full" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-xs sm:text-sm rounded-full" asChild>
                  <Link href="/auth/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-muted/80 transition-colors">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 flex flex-col">
                <SheetHeader className="border-b bg-muted/30 px-6 py-5">
                  <SheetTitle className="flex items-center justify-center py-2">
                    <img src="/logo-dark.svg" alt="Formatly Logo" className="h-8 dark:hidden" />
                    <img src="/logo-white.svg" alt="Formatly Logo" className="h-8 hidden dark:block" />
                  </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Navigation</p>
                    <Link href="/#features" onClick={(e) => handleScroll(e, "#features")} className="block py-2">Features</Link>
                    <Link href="/pricing" className="block py-2">Pricing</Link>
                    <Link href="/help" className="block py-2">Help</Link>
                    <Link href="/about" className="block py-2">About</Link>
                  </div>
                  
                  <div className="h-px bg-border" />

                  <div className="space-y-3">
                    {!isLoading && user ? (
                      <Button asChild className="w-full justify-start" variant="ghost">
                        <Link href="/dashboard"><LayoutDashboard className="mr-2 h-5 w-5" /> Dashboard</Link>
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" asChild className="w-full">
                          <Link href="/auth/login">Sign In</Link>
                        </Button>
                        <Button asChild className="w-full bg-primary hover:bg-primary/90">
                          <Link href="/auth/register">Get Started</Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
