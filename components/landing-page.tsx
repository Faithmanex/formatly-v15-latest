"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/contexts/subscription-context";
import {
  FileText,
  Zap,
  Shield,
  CheckCircle,
  Star,
  ArrowRight,
  BookOpen,
  Users,
  Award,
  LayoutDashboard,
  TrendingUp,
  Target,
  Twitter,
  Linkedin,
  Github,
  Mail,
  GraduationCap,
  FileCheck,
  BookMarked,
  ChevronDown,
  Menu,
} from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useAuth } from "@/components/auth-provider"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { ImageModal } from "@/components/image-modal"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { features, stats, testimonials, pricingPlans, useCases, faqs } from "@/lib/landing-data"

const Features = dynamic(() => import("@/components/features").then((mod) => mod.Features), {
  loading: () => <div className="h-96 animate-pulse bg-muted/20 rounded-xl" />,
})

const Testimonials = dynamic(() => import("@/components/testimonials").then((mod) => mod.Testimonials), {
  loading: () => <div className="h-96 animate-pulse bg-muted/20 rounded-xl" />,
})

const Pricing = dynamic(() => import("@/components/pricing").then((mod) => mod.Pricing), {
  loading: () => <div className="h-96 animate-pulse bg-muted/20 rounded-xl" />,
})

const FAQ = dynamic(() => import("@/components/faq").then((mod) => mod.FAQ), {
  loading: () => <div className="h-96 animate-pulse bg-muted/20 rounded-xl" />,
})

// 3D Tilt Card Component
const TiltCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  return <div className={`transition-base hover-lift ${className}`}>{children}</div>
}

const Navigation = () => {
  const { user, profile, isLoading, isInitialized } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, href: string) => {
    e.preventDefault()
    setIsOpen(false)
    const targetId = href.replace("#", "")
    const elem = document.getElementById(targetId)
    if (elem) {
      // Add offset for sticky header
      const headerOffset = 80
      const elementPosition = elem.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
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
            <img src="/logo-dark.svg" alt="Formatly Logo" className="h-8 sm:h-10 dark:hidden" />
            <img src="/logo-white.svg" alt="Formatly Logo" className="h-8 sm:h-10 hidden dark:block" />
          </motion.div>

          {/* Navigation Links - Centered */}
          <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center gap-6 lg:gap-8">
            <a
              href="#features"
              onClick={(e) => handleScroll(e, "#features")}
              className="relative text-sm font-medium text-foreground/80 hover:text-foreground transition-colors group"
            >
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a
              href="#pricing"
              onClick={(e) => handleScroll(e, "#pricing")}
              className="relative text-sm font-medium text-foreground/80 hover:text-foreground transition-colors group"
            >
              Pricing
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a
              href="#faq"
              onClick={(e) => handleScroll(e, "#faq")}
              className="relative text-sm font-medium text-foreground/80 hover:text-foreground transition-colors group"
            >
              FAQ
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </a>
          </div>

          {/* Auth Buttons - Right Aligned */}
          <div className="hidden md:flex items-center gap-2 sm:gap-4">
            {!isLoading && user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="text-xs sm:text-sm text-muted-foreground hidden lg:block">Welcome back!</span>
                <Button variant="ghost" size="sm" className="hidden sm:flex rounded-full" title="Go to Dashboard" asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                {profile?.role === "admin" && (
                  <Button variant="outline" size="sm" className="hidden sm:flex rounded-full border-primary/50 text-primary hover:bg-primary/10" title="Go to Admin Panel" asChild>
                    <Link href="/dashboard/admin">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm rounded-full" title="Sign In" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-xs sm:text-sm rounded-full" title="Get Started" asChild>
                  <Link href="/auth/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-muted/80 transition-colors" title="Open Menu">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[90vw] max-w-sm sm:w-[400px] p-0 flex flex-col">
                {/* Header with logo */}
                <SheetHeader className="border-b bg-muted/30 px-6 py-5">
                  <SheetTitle className="flex items-center justify-center py-2">
                    <img src="/logo-dark.svg" alt="Formatly Logo" className="h-8 dark:hidden" />
                    <img src="/logo-white.svg" alt="Formatly Logo" className="h-8 hidden dark:block" />
                  </SheetTitle>
                </SheetHeader>

                {/* Main content */}
                <div className="flex-1 overflow-y-auto">
                  <div className="px-6 py-6 space-y-8">
                    {/* Navigation Links */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                        Navigation
                      </p>
                      <a
                        href="#features"
                        onClick={(e) => handleScroll(e, "#features")}
                        className="block text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                      >
                        Features
                      </a>
                      <a
                        href="#pricing"
                        onClick={(e) => handleScroll(e, "#pricing")}
                        className="block text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                      >
                        Pricing
                      </a>
                      <a
                        href="#faq"
                        onClick={(e) => handleScroll(e, "#faq")}
                        className="block text-base font-medium text-foreground hover:text-primary transition-colors py-2"
                      >
                        FAQ
                      </a>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-border" />

                    {/* Auth Section */}
                    <div className="space-y-3">
                      {!isLoading && user ? (
                        <>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Account
                          </p>
                          <div className="bg-muted/50 rounded-lg p-3 mb-3">
                            <p className="text-xs text-muted-foreground">Signed in as</p>
                            <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                          </div>
                            <Button
                              asChild
                              variant="ghost"
                              className="w-full h-11 mb-2 justify-start px-4"
                              size="lg"
                              title="Go to Dashboard"
                            >
                              <Link href="/dashboard" className="flex items-center gap-2">
                                <LayoutDashboard className="h-5 w-5" />
                                Dashboard
                              </Link>
                            </Button>
                          {profile?.role === "admin" && (
                            <Button
                              asChild
                              variant="outline"
                              className="w-full h-11 border-primary/30 text-primary hover:bg-primary/5 justify-start px-4"
                              size="lg"
                            >
                              <Link href="/dashboard/admin" className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Admin Dashboard
                              </Link>
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Get Started
                          </p>
                          <Button
                            variant="outline"
                            asChild
                            className="w-full h-11 border-border hover:bg-muted/50 transition-colors bg-transparent"
                            size="lg"
                          >
                            <Link href="/auth/login" className="flex items-center justify-center">
                              Sign In
                            </Link>
                          </Button>
                          <Button
                            asChild
                            className="w-full h-11 bg-primary hover:bg-primary/90 transition-all"
                            size="lg"
                          >
                            <Link href="/auth/register" className="flex items-center justify-center">
                              Create Account
                            </Link>
                          </Button>
                        </>
                      )}
                    </div>
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


// Flip Card Carousel Component - Enhanced with Floating Navigation and Premium Dark Aesthetic
const FlipCardCarousel = () => {
  const [currentCard, setCurrentCard] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef(0)
  const dragVelocityRef = useRef(0)
  const lastTimeRef = useRef(0)
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const dragOffset = useMotionValue(0)

  const cards = [
    {
      title: "Upload Your Document",
      subtitle: "Import your draft directly into Formatly.",
      number: 1,
      imageUrl: "https://res.cloudinary.com/dtbdixfgf/image/upload/v1760632904/Original_Doc_i1mb8f.png",
    },
    {
      title: "AI Formatting Applied",
      subtitle: "Every heading, citation, and reference perfected.",
      number: 2,
      imageUrl: "https://res.cloudinary.com/dtbdixfgf/image/upload/v1760632903/Neat_Copy_dsu2yd.png",
    },
    {
      title: "With Tracked Revisions",
      subtitle: "Instantly see and approve every change.",
      number: 3,
      imageUrl: "https://res.cloudinary.com/dtbdixfgf/image/upload/v1760632903/Tracked_Changes_vsgmpt.png",
    },
    {
      title: "Export Instantly",
      subtitle: "Download clean, publication-ready files.",
      number: 4,
      imageUrl: "https://ladyknightediting.com/wp-content/uploads/2018/04/track-changes.png",
    },
    {
      title: "Share & Collaborate",
      subtitle: "Share, review, and finalize with your team.",
      number: 5,
      imageUrl: "https://ladyknightediting.com/wp-content/uploads/2018/04/track-changes.png",
    },
  ]

  useEffect(() => {
    const startAutoPlay = () => {
      autoPlayIntervalRef.current = setInterval(() => {
        setCurrentCard((prev) => (prev + 1) % cards.length)
      }, 5000)
    }

    const stopAutoPlay = () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current)
        autoPlayIntervalRef.current = null
      }
    }

    if (isHovering || isDragging) {
      stopAutoPlay()
    } else {
      startAutoPlay()
    }

    return () => stopAutoPlay()
  }, [isHovering, isDragging, cards.length])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrevious()
      else if (e.key === "ArrowRight") handleNext()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handlePrevious = () => setCurrentCard((prev) => (prev - 1 + cards.length) % cards.length)
  const handleNext = () => setCurrentCard((prev) => (prev + 1) % cards.length)

  const getCardPosition = (index: number) => {
    const diff = index - currentCard
    const xOffset = typeof window !== "undefined" && window.innerWidth < 768 ? 220 : 420

    if (diff === 0) return { x: 0, scale: 1, opacity: 1, zIndex: 30, filter: "blur(0px)" }
    if (diff === -1 || diff === cards.length - 1) return { x: -xOffset, scale: 0.8, opacity: 0.4, zIndex: 20, filter: "blur(2px)" }
    if (diff === 1 || diff === -(cards.length - 1)) return { x: xOffset, scale: 0.8, opacity: 0.4, zIndex: 20, filter: "blur(2px)" }
    return { x: 0, scale: 0.6, opacity: 0, zIndex: 10, filter: "blur(4px)" }
  }

  return (
    <div className="relative w-full max-w-[1600px] mx-auto group">
      {/* Floating Navigation Arrows */}
      <div className="absolute top-1/2 left-4 sm:left-8 -translate-y-1/2 z-40 hidden sm:block">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevious}
          title="Previous slide"
          className="h-12 w-12 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white transition-all hover:scale-110 active:scale-95"
        >
          <motion.span whileHover={{ x: -2 }}>
            <span className="text-2xl font-light">‹</span>
          </motion.span>
        </Button>
      </div>

      <div className="absolute top-1/2 right-4 sm:right-8 -translate-y-1/2 z-40 hidden sm:block">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          title="Next slide"
          className="h-12 w-12 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white transition-all hover:scale-110 active:scale-95"
        >
          <motion.span whileHover={{ x: 2 }}>
            <span className="text-2xl font-light">›</span>
          </motion.span>
        </Button>
      </div>

      {/* Main Carousel Area */}
      <div
        ref={carouselRef}
        className="relative w-full h-[450px] sm:h-[550px] md:h-[650px] lg:h-[750px] flex items-center justify-center overflow-visible cursor-grab active:cursor-grabbing select-none"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          {cards.map((card, index) => {
            const position = getCardPosition(index)
            const isActive = currentCard === index

            return (
              <motion.div
                key={index}
                initial={false}
                animate={{
                  x: position.x,
                  scale: position.scale,
                  opacity: position.opacity,
                  zIndex: position.zIndex,
                  filter: position.filter,
                }}
                transition={{
                  duration: 0.7,
                  ease: [0.32, 0.72, 0, 1],
                }}
                className="absolute"
                onClick={() => {
                  if (!isActive) setCurrentCard(index)
                  else setSelectedImageIndex(index)
                }}
              >
                <div className={`relative transition-all duration-700 ${isActive ? "drop-shadow-[0_0_50px_rgba(139,92,246,0.3)]" : ""}`}>
                  <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm shadow-2xl">
                    <div className="relative w-[300px] h-[200px] sm:w-[450px] sm:h-[300px] md:w-[650px] md:h-[420px] lg:w-[850px] lg:h-[550px]">
                      <Image
                        src={card.imageUrl || "/placeholder.svg"}
                        alt={card.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        draggable={false}
                        priority={isActive}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Number Indicator */}
                      <div className="absolute top-4 left-6 text-6xl md:text-8xl lg:text-9xl font-bold text-white/5 select-none font-sans">
                        0{card.number}
                      </div>

                      {/* Content Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
                        <motion.div
                          initial={false}
                          animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
                          transition={{ delay: 0.2 }}
                        >
                          <h3 className="text-xl md:text-3xl lg:text-4xl font-bold mb-2 tracking-tight">
                            {card.title}
                          </h3>
                          <p className="text-sm md:text-lg text-white/60 max-w-xl">
                            {card.subtitle}
                          </p>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Bottom Indicators */}
      <div className="absolute bottom-4 sm:bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3 z-40 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
        {cards.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentCard(index)}
            title={`Go to slide ${index + 1}`}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              currentCard === index ? "w-8 bg-primary shadow-[0_0_10px_rgba(139,92,246,0.5)]" : "w-2 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>

      {selectedImageIndex !== null && (
        <ImageModal
          isOpen={selectedImageIndex !== null}
          imageUrl={cards[selectedImageIndex].imageUrl}
          title={cards[selectedImageIndex].title}
          onClose={() => setSelectedImageIndex(null)}
          onPrevious={() => setSelectedImageIndex((prev) => (prev! - 1 + cards.length) % cards.length)}
          onNext={() => setSelectedImageIndex((prev) => (prev! + 1) % cards.length)}
          canNavigatePrevious={true}
          canNavigateNext={true}
        />
      )}
    </div>
  )
}

const AnimatedCounter = ({ value, label }: { value: string; label: string }) => {
  const [displayValue, setDisplayValue] = useState("0")
  const nodeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Extract numeric value
          const numericValue = Number.parseInt(value.replace(/[^0-9]/g, ""))
          const suffix = value.replace(/[0-9]/g, "")

          // Animate counter
          let current = 0
          const increment = Math.ceil(numericValue / 50)
          const interval = setInterval(() => {
            current += increment
            if (current >= numericValue) {
              setDisplayValue(value)
              clearInterval(interval)
            } else {
              setDisplayValue(current + suffix)
            }
          }, 30)

          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.5 },
    )

    if (nodeRef.current) {
      observer.observe(nodeRef.current)
    }

    return () => observer.disconnect()
  }, [value])

  return (
    <div ref={nodeRef}>
      <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">{displayValue}</h3>
      <p className="text-muted-foreground text-sm sm:text-base md:text-lg">{label}</p>
    </div>
  )
}

const TypewriterHeadline = () => {
  const headlines = useMemo(() => [
    "Flawless Research Formatting",
    "Perfect Citations & Referencing",
    "Tailored Style Guide Compliance",
    "Publication-Ready Documents"
  ], [])

  const [index, setIndex] = useState(0)
  const [subIndex, setSubIndex] = useState(headlines[0].length)
  const [isDeleting, setIsDeleting] = useState(false)
  const [pause, setPause] = useState(true)

  useEffect(() => {
    // Initial pause on the first fully typed headline
    if (pause && index === 0 && subIndex === headlines[0].length && !isDeleting) {
      const initialTimer = setTimeout(() => {
        setPause(false)
        setIsDeleting(true)
      }, 2000)
      return () => clearTimeout(initialTimer)
    }

    if (pause) return

    if (isDeleting) {
      if (subIndex === 0) {
        setIsDeleting(false)
        setIndex((prev) => (prev + 1) % headlines.length)
        setPause(true)
        setTimeout(() => setPause(false), 300)
        return
      }
    } else {
      if (subIndex === headlines[index].length) {
        setPause(true)
        setTimeout(() => {
          setPause(false)
          setIsDeleting(true)
        }, 2000)
        return
      }
    }

    const timer = setTimeout(() => {
      setSubIndex((prev) => prev + (isDeleting ? -1 : 1))
    }, isDeleting ? 30 : 60)

    return () => clearTimeout(timer)
  }, [subIndex, isDeleting, index, headlines, pause])

  return (
    <span className="relative">
      {headlines[index].substring(0, subIndex)}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        className="inline-block border-r-2 border-primary h-[1em] translate-y-1 ml-1"
      />
    </span>
  )
}


export function LandingPage() {
  const { user, isLoading, isInitialized } = useAuth()
  const { usage } = useSubscription()

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 -z-10 bg-[#050505]">
        {/* Deep Purple Bottom Glow */}
        <div className="absolute bottom-0 left-0 right-0 h-[60vh] bg-gradient-to-t from-primary/25 via-primary/5 to-transparent pointer-events-none" />
        
        {/* Subtle radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(91,33,182,0.08)_0%,transparent_70%)] pointer-events-none" />

        {/* Grid pattern with low opacity */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
        
        {/* Animated accent areas */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-float-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[32rem] h-[32rem] bg-secondary/5 rounded-full blur-[160px] animate-float-slower" />
      </div>

      {/* Updated Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 sm:pt-24 sm:pb-40 md:pt-32 md:pb-48 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            {isInitialized && user ? (
              // Logged in user hero - only show when auth is fully initialized
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Badge
                    variant="secondary"
                    className="mb-4 sm:mb-6 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-full shadow-lg"
                  >
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 inline" />
                    Welcome back to Formatly
                  </Badge>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 sm:mb-6 px-2"
                >
                  Ready to Format Your
                  <span className="block text-primary">Next Document?</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-3xl mx-auto px-4"
                >
                  Continue where you left off. You have {
                    (() => {
                      if (!usage) return 0;
                      if (usage.document_limit === -1) return "unlimited";
                      return Math.max(0, usage.document_limit - usage.documents_processed);
                    })()
                  } documents remaining this month.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-20 px-4"
                >
                  <Button
                    size="lg"
                    className="text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 bg-primary hover:bg-primary/90 rounded-full"
                    asChild
                  >
                    <Link href="/dashboard">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 bg-transparent rounded-full"
                    asChild
                  >
                    <Link href="/dashboard/documents">
                      My Documents
                      <FileText className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </Link>
                  </Button>
                </motion.div>
              </>
            ) : (
              // Guest hero - shown immediately on load, no waiting for auth
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Badge
                    variant="secondary"
                    className="mb-4 sm:mb-6 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-full shadow-lg"
                  >
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 inline" />
                    New: AI-Powered Formatting
                  </Badge>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-4 sm:mb-6 px-2"
                >
                  <TypewriterHeadline />
                  <span className="block text-primary">in Seconds</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-3xl mx-auto px-4"
                >
                  Let Formatly handle the formatting while you focus on your research. Our AI ensures precision, speed,
                  and compliance with every major academic style—APA, MLA, Chicago, Harvard, and Turabian.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-20 px-4"
                >
                  <Button
                    size="lg"
                    className="text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 bg-primary hover:bg-primary/90 shadow-xl rounded-full"
                    asChild
                  >
                    <Link href="/auth/register">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </Link>
                  </Button>
                </motion.div>
              </>
            )}
          </div>

          {/* Demo Preview */}
          {isInitialized && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mb-24 sm:mb-32 md:mb-40"
            >
              <FlipCardCarousel />
            </motion.div>
          )}

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center mb-8 sm:mb-12 px-4"
          >
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
              Built for researchers and academics who take formatting seriously
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8 opacity-60">
              <span className="text-base sm:text-xl md:text-2xl font-bold">APA</span>
              <span className="text-base sm:text-xl md:text-2xl font-bold">MLA</span>
              <span className="text-base sm:text-xl md:text-2xl font-bold">Chicago</span>
              <span className="text-base sm:text-xl md:text-2xl font-bold">Harvard</span>
              <span className="text-base sm:text-xl md:text-2xl font-bold">Turabian</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section - Updated with AnimatedCounter */}
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-6 lg:px-8 bg-muted/20 backdrop-blur-sm relative">
        <div className="absolute inset-0 bg-dot-pattern dark:opacity-[0.04] opacity-40" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <TiltCard>
                  <Card className="text-center p-6 sm:p-8 border-2 hover:shadow-xl transition-shadow">
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 mb-3 sm:mb-4">
                      <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                    </div>
                    <AnimatedCounter value={stat.value} label={stat.label} />
                  </Card>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-6 lg:px-8 relative scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16 px-4"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Why Choose Formatly?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to create perfectly formatted academic documents
            </p>
          </motion.div>

          <Features />
        </div>
      </section>

      <Testimonials />

      {/* Pricing Section - only show for non-authenticated users */}
      {isInitialized && (!user || !isLoading) && <Pricing />}

      <FAQ />

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center p-6 sm:p-8 md:p-12 rounded-xl border bg-card"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2">
              Focus on Research, Not Formatting
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Formatly takes care of every citation, margin, and reference—so you can spend your time pushing
              boundaries, not fixing styles.
            </p>
            <Button
              size="lg"
              className="text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 bg-primary hover:bg-primary/90 rounded-full"
              asChild
            >
              <Link href="/auth/register">
                Try Formatly Now
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
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
              <Link href="https://twitter.com/formatly" target="_blank" rel="noopener noreferrer" className="group">
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-muted hover:bg-primary transition-colors">
                  <Twitter className="h-5 w-5 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
                </div>
              </Link>

              <Link
                href="https://linkedin.com/company/formatly"
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-muted hover:bg-primary transition-colors">
                  <Linkedin className="h-5 w-5 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
                </div>
              </Link>

              <Link href="https://github.com/formatly" target="_blank" rel="noopener noreferrer" className="group">
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-muted hover:bg-primary transition-colors">
                  <Github className="h-5 w-5 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
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
    </div>
  )
}
