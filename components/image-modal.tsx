"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

interface ImageModalProps {
  isOpen: boolean
  imageUrl: string
  title: string
  onClose: () => void
  onPrevious?: () => void
  onNext?: () => void
  canNavigatePrevious?: boolean
  canNavigateNext?: boolean
}

export function ImageModal({
  isOpen,
  imageUrl,
  title,
  onClose,
  onPrevious,
  onNext,
  canNavigatePrevious = false,
  canNavigateNext = false,
}: ImageModalProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8"
            onClick={(e) => {
              // Close only if clicking on the container, not the modal content
              if (e.target === e.currentTarget) {
                onClose()
              }
            }}
          >
            <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col">
              <button
                onClick={onClose}
                className="absolute -top-10 right-0 sm:top-4 sm:right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <div className="relative w-full bg-black rounded-lg overflow-hidden flex items-center justify-center">
                {/* Loading state */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  </div>
                )}

                <Image
                  src={imageUrl || "/placeholder.svg"}
                  alt={title}
                  onLoad={() => setIsLoading(false)}
                  fill
                  className="object-contain"
                />
              </div>

              <div className="mt-4 sm:mt-6 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-foreground truncate">{title}</h3>
                </div>

                {(onPrevious || onNext) && (
                  <div className="flex items-center gap-2 shrink-0">
                    {onPrevious && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={onPrevious}
                        disabled={!canNavigatePrevious}
                        className="h-9 w-9 sm:h-10 sm:w-10 bg-transparent"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                    )}
                    {onNext && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={onNext}
                        disabled={!canNavigateNext}
                        className="h-9 w-9 sm:h-10 sm:w-10 bg-transparent"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
                Press <kbd className="px-2 py-1 bg-muted rounded text-xs">ESC</kbd> to close
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
