"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { X, ChevronRight, ChevronLeft, Sparkles, Upload, FileText, Settings } from "lucide-react"

interface Step {
  title: string
  description: string
  targetId?: string
  icon: React.ReactNode
}

const steps: Step[] = [
  {
    title: "Welcome to Formatly!",
    description: "Let's take a quick tour to help you get started with professional document formatting.",
    icon: <Sparkles className="h-6 w-6 text-primary" />,
  },
  {
    title: "Upload Documents",
    description: "Start by uploading your documents here. We support multiple formats and bulk uploads.",
    targetId: "walkthrough-upload",
    icon: <Upload className="h-6 w-6 text-primary" />,
  },
  {
    title: "My Documents",
    description: "All your processed and draft documents will appear here. You can download or reformat them anytime.",
    targetId: "walkthrough-documents",
    icon: <FileText className="h-6 w-6 text-primary" />,
  },
  {
    title: "Style Preferences",
    description: "Customize your formatting rules, citations, and language variants in the preferences section.",
    targetId: "walkthrough-preferences",
    icon: <Settings className="h-6 w-6 text-primary" />,
  },
]

export function Walkthrough({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const updateTargetRect = useCallback(() => {
    const targetId = steps[currentStep]?.targetId
    if (targetId) {
      const element = document.getElementById(targetId)
      if (element) {
        setTargetRect(element.getBoundingClientRect())
        return
      }
    }
    setTargetRect(null)
  }, [currentStep])

  useEffect(() => {
    updateTargetRect()
    window.addEventListener("resize", updateTargetRect)
    window.addEventListener("scroll", updateTargetRect)
    return () => {
      window.removeEventListener("resize", updateTargetRect)
      window.removeEventListener("scroll", updateTargetRect)
    }
  }, [updateTargetRect])

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/60 backdrop-blur-[2px] pointer-events-auto"
        onClick={onComplete}
      />

      {/* Spotlight Effect */}
      {targetRect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
          className="absolute border-2 border-primary rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] z-[101]"
        />
      )}

      {/* Popover */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="pointer-events-auto w-full max-w-sm"
          style={
            targetRect
              ? {
                  position: "absolute",
                  top: Math.min(window.innerHeight - 300, Math.max(20, targetRect.bottom + 24)),
                  left: Math.max(20, Math.min(window.innerWidth - 380, targetRect.left + targetRect.width / 2 - 190)),
                }
              : {}
          }
        >
          <Card className="shadow-2xl border-primary/20 backdrop-blur-md bg-card/95">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {steps[currentStep].icon}
                  <CardTitle className="text-lg">{steps[currentStep].title}</CardTitle>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onComplete}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <CardDescription className="text-sm sm:text-base text-foreground/80">
                {steps[currentStep].description}
              </CardDescription>
            </CardContent>
            <CardFooter className="flex items-center justify-between pt-2">
              <div className="flex gap-1">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${
                      i === currentStep ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button variant="outline" size="sm" onClick={prevStep}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}
                <Button size="sm" onClick={nextStep}>
                  {currentStep === steps.length - 1 ? "Get Started" : "Next"}
                  {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
