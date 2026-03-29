"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Download, Printer, X, FileText, AlertCircle, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react"
import * as docx from "docx-preview"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

interface DocumentViewerProps {
  documentId: string | null
  filename: string
  onClose: () => void
}

export function DocumentViewer({ documentId, filename, onClose }: DocumentViewerProps) {
  const [finalBlob, setFinalBlob] = useState<Blob | null>(null)
  const [trackedBlob, setTrackedBlob] = useState<Blob | null>(null)
  const [currentView, setCurrentView] = useState<"final" | "tracked">("final")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(80)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { getToken } = useAuth()
  const { toast } = useToast()
  const viewerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (documentId) {
      loadDocument()
      if (window.innerWidth < 1000) {
        // docx-preview tends to scale itself well, but we can set a zoom preference
        setZoom(Math.floor((window.innerWidth / 1000) * 80))
      }
    } else {
      setFinalBlob(null)
      setTrackedBlob(null)
      setCurrentView("final")
      setError(null)
    }
  }, [documentId])

  useEffect(() => {
    // Re-render when view changes or blobs load
    const renderCurrentDoc = async () => {
        if (!viewerRef.current) return
        
        const activeBlob = currentView === "final" ? finalBlob : trackedBlob
        
        if (activeBlob) {
            try {
                // Clear the container first
                viewerRef.current.innerHTML = ""
                await docx.renderAsync(activeBlob, viewerRef.current, viewerRef.current, {
                    className: "docx", 
                    inWrapper: true, 
                    breakPages: true
                })
                
                // Adjust zoom
                const wrapper = viewerRef.current.querySelector('.docx-wrapper') as HTMLElement
                if (wrapper) {
                    wrapper.style.transform = `scale(${zoom / 100})`
                    wrapper.style.transformOrigin = "top center"
                    // Add smooth transition for zooming
                    wrapper.style.transition = "transform 0.2s ease"
                }

                // Update pages
                setTimeout(() => {
                    const pages = viewerRef.current?.querySelectorAll('.docx')
                    if (pages && pages.length > 0) {
                        setTotalPages(pages.length)
                    }
                }, 100)
            } catch (err) {
                console.error("Error rendering docx:", err)
            }
        }
    }
    
    renderCurrentDoc()
  }, [currentView, finalBlob, trackedBlob, zoom])

  const loadDocument = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = await getToken()

      const response = await fetch(`/api/documents/download/${documentId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!response.ok) {
        throw new Error("Failed to fetch document content")
      }

      const data = await response.json()
      if (!data.success || (!data.content && !data.tracked_changes_content)) {
        throw new Error(data.error || "No content found")
      }

      const createBlob = (base64: string) => {
          const binaryString = atob(base64)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          return new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })
      }

      if (data.content) {
          setFinalBlob(createBlob(data.content))
      }
      
      if (data.tracked_changes_content) {
          setTrackedBlob(createBlob(data.tracked_changes_content))
      } else {
          setTrackedBlob(null)
          setCurrentView("final")
      }
      
    } catch (err) {
      console.error("Error loading document:", err)
      setError(err instanceof Error ? err.message : "Failed to load document preview")
    } finally {
      setLoading(false)
    }
  }

  // Handle scroll to update current page indicator
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget
    const pageHeight = 1056 * (zoom / 100)
    const newPage = Math.floor(container.scrollTop / pageHeight) + 1
    
    // Calculate total pages more accurately
    const total = Math.max(1, Math.ceil(container.scrollHeight / pageHeight))
    setTotalPages(total)
    
    if (newPage !== page) setPage(newPage)
  }

  const navigatePage = (direction: "next" | "prev") => {
    if (!viewerRef.current || !scrollContainerRef.current) return
    const pages = viewerRef.current.querySelectorAll('.docx')
    if (pages.length === 0) return

    // Each page is rendered as a section. Find the height of one page + its margins.
    const firstPage = pages[0] as HTMLElement
    // docx-preview wrapper adds padding, calculate effective scroll height per page
    const style = window.getComputedStyle(firstPage)
    const pageHeightWithMargins = firstPage.offsetHeight + parseInt(style.marginTop || '0') + parseInt(style.marginBottom || '0')
    const zoomedHeight = pageHeightWithMargins * (zoom / 100)
    
    const container = scrollContainerRef.current
    const targetScroll = direction === "next" 
      ? container.scrollTop + zoomedHeight
      : container.scrollTop - zoomedHeight
    
    container.scrollTo({
      top: targetScroll,
      behavior: "smooth"
    })
  }

  // Same print logic but uses current view
  const handlePrint = () => {
    // Trigger print window, docx-preview output needs to be styled for printing
    const printWindow = window.open("", "_blank")
    if (!printWindow || !viewerRef.current) {
      toast({
        title: "Error",
        description: "Please allow popups to print the document",
        variant: "destructive",
      })
      return
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${filename} - ${currentView === "tracked" ? "Tracked Changes" : "Final"}</title>
          <style>
             /* Print styles for docx-preview content */
            body { font-family: 'Times New Roman', serif; margin: 0; padding: 0; background: #fff; }
            .docx-wrapper { padding: 0 !important; background: transparent !important; }
            .docx { box-shadow: none !important; margin: 0 auto !important; width: 100% !important; min-height: auto !important; }
            @media print { 
                body { padding: 0; margin: 0; } 
                .docx { page-break-after: always; break-after: page; max-width: 100% !important;}
                /* Ensure no background colors get printed unless requested */
                * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
            }
          </style>
        </head>
        <body>
          ${viewerRef.current.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.onload = () => {
        printWindow.focus()
        setTimeout(() => {
            printWindow.print()
            printWindow.close()
        }, 500)
    }
  }

  return (
    <Dialog open={!!documentId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[95vw] lg:max-w-[1200px] w-[95vw] h-[95vh] sm:h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl bg-background outline-none">
        <DialogHeader className="p-3 bg-background border-b flex flex-row items-center justify-between space-y-0 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg hidden xs:block">
              <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-sm sm:text-base font-bold line-clamp-1 max-w-[150px] sm:max-w-md">
                    {filename}
                </DialogTitle>
                <div className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 text-[10px] font-bold px-1.5 py-0.5 rounded leading-none">
                    FORMATTED
                </div>
              </div>
              <DialogDescription className="text-[10px]">
                {loading ? "Checking status..." : currentView === "tracked" ? "Tracked Changes View" : "Final Formatted Document"}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 mr-6 sm:mr-8">
            {!loading && !error && finalBlob && (
              <div className="flex items-center gap-1 bg-muted/30 px-2 py-1 rounded-full border border-border mr-1 sm:mr-2">
                <Button variant="ghost" size="icon" onClick={() => navigatePage("prev")} disabled={page <= 1} className="h-6 w-6 rounded-full"><ChevronLeft className="h-4 w-4" /></Button>
                <div className="text-[10px] font-bold min-w-[50px] text-center">Page {page} of {totalPages}</div>
                <Button variant="ghost" size="icon" onClick={() => navigatePage("next")} disabled={page >= totalPages} className="h-6 w-6 rounded-full"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            )}

            {trackedBlob && !loading && !error && (
                <div className="hidden md:flex items-center bg-muted/30 p-0.5 rounded-lg border border-border mr-2">
                    <Button 
                        variant={currentView === "final" ? "secondary" : "ghost"} 
                        size="sm" 
                        onClick={() => setCurrentView("final")}
                        className="h-7 text-[10px] px-3 font-semibold rounded-md shadow-none"
                    >
                        Final Copy
                    </Button>
                    <Button 
                        variant={currentView === "tracked" ? "secondary" : "ghost"} 
                        size="sm" 
                        onClick={() => setCurrentView("tracked")}
                        className="h-7 text-[10px] px-3 font-semibold rounded-md shadow-none"
                    >
                        Track Changes
                    </Button>
                </div>
            )}

            <div className="flex items-center gap-1 bg-muted/50 rounded-full px-2 py-1 mr-1">
                <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(25, zoom - 10))} className="h-6 w-6 rounded-full text-xs">-</Button>
                <span className="text-[10px] font-bold w-10 text-center">{zoom}%</span>
                <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(300, zoom + 10))} className="h-6 w-6 rounded-full text-xs">+</Button>
            </div>

            <Button 
                variant="default" 
                size="sm" 
                onClick={handlePrint} 
                disabled={loading || !!error || (!finalBlob && !trackedBlob)}
                className="gap-2 shadow-sm h-8 px-3"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save PDF</span>
            </Button>
            
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted/80">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-auto bg-[#525659] p-4 sm:p-8 flex justify-center items-start outline-none"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full w-full py-20 gap-4">
              <div className="relative">
                <Loader2 className="h-10 w-10 animate-spin text-white" />
                <FileText className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/50" />
              </div>
              <p className="text-white/70 text-[11px] font-medium tracking-wide uppercase animate-pulse">Processing Formatted Content</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full w-full py-20 text-center max-w-md mx-auto gap-6 bg-background/5 rounded-xl p-8 border border-white/10">
              <div className="bg-destructive/20 p-4 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Preview Failed</h3>
                <p className="text-sm text-white/50 leading-relaxed">{error}</p>
              </div>
              <Button onClick={loadDocument} variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10 px-8 h-10">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
            </div>
          ) : (
            <div 
              ref={viewerRef}
              className="flex-shrink-0 origin-top transition-transform duration-300 ease-in-out w-full docx-preview-container"
            />
          )}
        </div>
        
        {/* Custom scrollbar styles for the preview container */}
        <style dangerouslySetInnerHTML={{ __html: `
            .docx-preview-container .docx-wrapper {
                background: transparent !important;
                padding: 0 !important;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 24px;
                padding-bottom: 60px !important;
                margin: 0 auto;
            }
            .docx-preview-container .docx {
                box-shadow: 0 0 20px rgba(0,0,0,0.4) !important;
                border-radius: 2px !important;
            }
            ::-webkit-scrollbar { width: 8px; height: 8px; }
            ::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
            ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
            ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
        `}} />
      </DialogContent>
    </Dialog>
  )
}

function RefreshCw(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
        </svg>
    )
}
