"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/contexts/subscription-context";
import useSWR from "swr"
import { getUserUsageStats } from "@/lib/billing"
import {
  FileText,
  Zap,
  ArrowRight,
  Shield,
  Target,
} from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useAuth } from "@/components/auth-provider"
import { ImageModal } from "@/components/image-modal"
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

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { AIChatbotFAB } from "@/components/ai-chatbot-fab"


// Flip Card Carousel Component - Enhanced with Momentum Scrolling, Keyboard Nav, Auto-Pause
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
      imageUrl: "/download-card.svg",
    },
  ]

  useEffect(() => {
    const startAutoPlay = () => {
      autoPlayIntervalRef.current = setInterval(() => {
        setCurrentCard((prev) => (prev + 1) % cards.length)
      }, 3000)
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
      if (e.key === "ArrowLeft") {
        handlePrevious()
      } else if (e.key === "ArrowRight") {
        handleNext()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    dragStartRef.current = e.clientX
    lastTimeRef.current = Date.now()
    dragVelocityRef.current = 0
    dragOffset.set(0)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return

    const offset = e.clientX - dragStartRef.current
    const now = Date.now()
    const deltaTime = Math.max(now - lastTimeRef.current, 16) // At least 16ms
    dragVelocityRef.current = offset / deltaTime

    dragOffset.set(offset)
    lastTimeRef.current = now
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    const offset = dragOffset.get()

    const thresholdDistance = 50
    const minVelocity = 0.5

    if (Math.abs(dragVelocityRef.current) > minVelocity || Math.abs(offset) > thresholdDistance) {
      if (offset > 0 || dragVelocityRef.current > minVelocity) {
        handlePrevious()
      } else {
        handleNext()
      }
    }

    dragOffset.set(0)
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true)
    dragStartRef.current = e.touches[0].clientX
    lastTimeRef.current = Date.now()
    dragVelocityRef.current = 0
    dragOffset.set(0)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return

    const offset = e.touches[0].clientX - dragStartRef.current
    const now = Date.now()
    const deltaTime = Math.max(now - lastTimeRef.current, 16)
    dragVelocityRef.current = offset / deltaTime

    dragOffset.set(offset)
    lastTimeRef.current = now
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    const offset = dragOffset.get()

    const thresholdDistance = 50
    const minVelocity = 0.5

    if (Math.abs(dragVelocityRef.current) > minVelocity || Math.abs(offset) > thresholdDistance) {
      if (offset > 0 || dragVelocityRef.current > minVelocity) {
        handlePrevious()
      } else {
        handleNext()
      }
    }

    dragOffset.set(0)
  }

  const handlePrevious = () => {
    setCurrentCard((prev) => (prev - 1 + cards.length) % cards.length)
  }

  const handleNext = () => {
    setCurrentCard((prev) => (prev + 1) % cards.length)
  }

  const handleModalPrevious = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((prev) => (prev! - 1 + cards.length) % cards.length)
    }
  }

  const handleModalNext = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((prev) => (prev! + 1) % cards.length)
    }
  }

  const getCardPosition = (index: number) => {
    const diff = index - currentCard
    const xOffset = typeof window !== "undefined" && window.innerWidth < 768 ? 200 : 350

    if (diff === 0) return { x: 0, scale: 1, opacity: 1, zIndex: 30 }
    if (diff === -1 || diff === cards.length - 1) return { x: -xOffset, scale: 0.7, opacity: 0.5, zIndex: 20 }
    if (diff === 1 || diff === -(cards.length - 1)) return { x: xOffset, scale: 0.7, opacity: 0.5, zIndex: 20 }
    return { x: 0, scale: 0.7, opacity: 0, zIndex: 10 }
  }

  return (
    <>
      <div
        ref={carouselRef}
        className="relative w-full max-w-7xl mx-auto h-[400px] sm:h-[480px] md:h-[550px] flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          handleMouseUp()
          setIsHovering(false)
        }}
      >
        <div className="relative w-full h-80 sm:h-96 md:h-[420px] flex items-center justify-center">
          {cards.map((card, index) => {
            const position = getCardPosition(index)
            const currentDragOffset = isDragging && currentCard === index ? dragOffset : 0

            return (
              <motion.div
                key={index}
                initial={false}
                animate={{
                  x: position.x,
                  scale: position.scale,
                  opacity: position.opacity,
                  zIndex: position.zIndex,
                }}
                transition={{
                  duration: isDragging ? 0 : 0.5,
                  ease: "easeInOut",
                }}
                className="absolute"
              >
                <motion.div style={{ x: currentDragOffset }}>
                  <TiltCard className={currentCard === index ? "" : ""}>
                    <Card
                      className={`group w-[280px] h-64 sm:w-[380px] sm:h-72 md:w-[500px] md:h-[380px] lg:w-[550px] lg:h-[400px] bg-card backdrop-blur-xl border border-border/50 shadow-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-105 ${currentCard !== index ? "opacity-60 saturate-50" : "ring-1 ring-primary/30"}`}
                      onClick={() => {
                        if (currentCard === index) {
                          setSelectedImageIndex(index)
                        } else {
                          setCurrentCard(index)
                        }
                      }}
                    >
                      <CardContent className="h-full p-0 relative">
                        <div className="absolute top-2 left-3 sm:top-4 sm:left-6 text-6xl sm:text-8xl md:text-9xl font-black text-white/20 z-10 select-none drop-shadow-xl">
                          {card.number}
                        </div>
                        <Image
                          src={card.imageUrl || "/placeholder.svg"}
                          alt={card.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          draggable={false}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
                        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay z-10" />
                        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 text-white z-20">
                          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 text-white/95">
                            {card.title}
                          </h3>
                          <p className="text-sm sm:text-base text-white/80 font-medium">{card.subtitle}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TiltCard>
                </motion.div>
              </motion.div>
            )
          })}
        </div>

        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex items-center gap-3 sm:gap-4 md:gap-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            className="bg-background/80 backdrop-blur text-xs sm:text-sm px-2 sm:px-3 hover:bg-primary hover:text-primary-foreground transition-colors rounded-full"
            title="Previous slide (or press ←)"
          >
            <motion.span whileHover={{ x: -2 }} className="flex items-center gap-1 sm:gap-2">
              <span className="text-base sm:text-lg">‹</span>
              <span className="hidden sm:inline">Previous</span>
            </motion.span>
          </Button>

          <div className="flex gap-2 sm:gap-3">
            {cards.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentCard(index)}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.95 }}
                className={`rounded-full transition-all ${
                  currentCard === index
                    ? "bg-foreground w-3 h-3 sm:w-3.5 sm:h-3.5"
                    : "bg-muted-foreground/30 w-2.5 h-2.5 sm:w-3 sm:h-3 hover:bg-muted-foreground/60"
                }`}
                title={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            className="bg-background/80 backdrop-blur text-xs sm:text-sm px-2 sm:px-3 hover:bg-primary hover:text-primary-foreground transition-colors rounded-full"
            title="Next slide (or press →)"
          >
            <motion.span whileHover={{ x: 2 }} className="flex items-center gap-1 sm:gap-2">
              <span className="hidden sm:inline">Next</span>
              <span className="text-base sm:text-lg">›</span>
            </motion.span>
          </Button>
        </div>
      </div>

      {selectedImageIndex !== null && (
        <ImageModal
          isOpen={selectedImageIndex !== null}
          imageUrl={cards[selectedImageIndex].imageUrl}
          title={cards[selectedImageIndex].title}
          onClose={() => setSelectedImageIndex(null)}
          onPrevious={handleModalPrevious}
          onNext={handleModalNext}
          canNavigatePrevious={selectedImageIndex > 0 || selectedImageIndex === cards.length - 1}
          canNavigateNext={selectedImageIndex < cards.length - 1 || selectedImageIndex === 0}
        />
      )}
    </>
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
  const { data: usage } = useSWR(
    user?.id ? ["usage", user.id] : null,
    ([, id]: [string, string]) => getUserUsageStats(id),
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 -z-10 bg-background">
        {/* Dot pattern */}
        <div className="absolute inset-0 bg-dot-pattern opacity-[0.15] dark:opacity-[0.08]" />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.02]" />

        {/* Subtle radial vignette */}
        <div className="absolute inset-0 bg-radial-vignette" />

        {/* Animated accent areas */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 dark:bg-primary/3 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-0 right-1/4 w-[32rem] h-[32rem] bg-secondary/5 dark:bg-secondary/3 rounded-full blur-3xl animate-float-slower" />
      </div>

      {/* Updated Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-6 lg:px-8 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-primary/5 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute bottom-20 right-10 w-64 h-64 sm:w-96 sm:h-96 bg-secondary/5 rounded-full blur-3xl animate-float-slower" />
          
          {/* Floating Citation Style Bubbles */}
          <div className="absolute inset-0 overflow-visible pointer-events-none">
            {[
              { label: "APA", x: "3%", y: "15%", delay: "0s", duration: "15s" },
              { label: "MLA", x: "85%", y: "12%", delay: "2s", duration: "18s" },
              { label: "Chicago", x: "75%", y: "55%", delay: "4s", duration: "16s" },
              { label: "Harvard", x: "5%", y: "60%", delay: "3s", duration: "20s" },
              { label: "Turabian", x: "45%", y: "80%", delay: "5s", duration: "17s" },
            ].map((style) => (
              <motion.div
                key={style.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: [0.5, 0.9, 0.5],
                  y: [0, -25, 0],
                  x: [0, 15, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  opacity: { repeat: Infinity, duration: 4, ease: "easeInOut" },
                  y: { repeat: Infinity, duration: parseFloat(style.duration), ease: "easeInOut" },
                  x: { repeat: Infinity, duration: parseFloat(style.duration) * 1.3, ease: "easeInOut" },
                  scale: { repeat: Infinity, duration: 5, ease: "easeInOut" },
                  delay: parseFloat(style.delay),
                }}
                className="absolute z-0"
                style={{ left: style.x, top: style.y }}
              >
                <div className="bg-primary/20 dark:bg-primary/15 border border-primary/40 rounded-full px-4 py-2 shadow-lg backdrop-blur-md sm:px-5 sm:py-2.5">
                  <span className="text-xs font-bold text-primary whitespace-nowrap sm:text-sm">
                    {style.label}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

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
                    New feature: Tracked changes
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
              // Default hero - shown immediately on load, no waiting for auth
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
                    New: Tracked Changes
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
                  className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto px-4"
                >
                  Let Formatly handle the formatting while you focus on your research. Our rule-based engine ensures precision and speed—APA, MLA, Chicago, Harvard, and Turabian.
                </motion.p>

                {/* Value Propositions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                  className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-8 sm:mb-12 px-4"
                >
                  <div className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <span>100% Privacy</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <span>Up to 3 documents free</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <span>Guaranteed accuracy</span>
                  </div>
                </motion.div>

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
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-12 sm:mb-20"
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
            className="text-center mb-8 sm:mb-12 px-4"
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

      {/* How It Works Video Section */}
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-6 lg:px-8 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12 px-4"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              See Formatly in Action
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Watch how Formatly transforms your documents in seconds
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-border/50 group"
          >
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/YRWLfOx_g34"
              title="Formatly Demo - AI-Powered Document Formatting"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </motion.div>

          {/* How It Works Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 sm:mt-12"
          >
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8">
              {[
                { step: 1, label: "Create Account" },
                { step: 2, label: "Select Style" },
                { step: 3, label: "Upload Document" },
                { step: 4, label: "Preview" },
                { step: 5, label: "Download" },
              ].map((item, index) => (
                <div key={item.step} className="flex items-center">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm sm:text-base font-bold">
                      {item.step}
                    </div>
                    <span className="text-sm sm:text-base font-medium text-foreground">
                      {item.label}
                    </span>
                  </div>
                  {index < 4 && (
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 mx-2 sm:mx-3 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Testimonials />

      {/* Pricing Section - only show for non-authenticated users */}
      {isInitialized && (!user || !isLoading) && <Pricing />}

      <FAQ />

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-24 px-4 text-center max-w-5xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto space-y-8 p-8 sm:p-12 md:p-16 rounded-[40px] bg-primary text-primary-foreground relative overflow-hidden shadow-2xl shadow-primary/20"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-6 sm:space-y-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">Focus on Research, Not Formatting</h2>
            <p className="text-primary-foreground/90 text-lg sm:text-xl">
              Formatly takes care of every citation, margin, and reference—so you can spend your time pushing
              boundaries, not fixing styles.
            </p>
            <div className="pt-4">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-2xl h-14 px-8 font-bold text-lg shadow-xl" asChild>
                <Link href="/auth/register">
                  Try Formatly Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
      <AIChatbotFAB position="bottom-right" />
    </div>
  )
}
