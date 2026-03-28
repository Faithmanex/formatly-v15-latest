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
import { Loader2, Download, Printer, X, FileText, AlertCircle, Eye, EyeOff } from "lucide-react"
import mammoth from "mammoth"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

interface DocumentViewerProps {
  documentId: string | null
  filename: string
  onClose: () => void
}

export function DocumentViewer({ documentId, filename, onClose }: DocumentViewerProps) {
  const [content, setContent] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const { getToken } = useAuth()
  const { toast } = useToast()
  const viewerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (documentId) {
      loadDocument()
    } else {
      setContent("")
      setError(null)
    }
  }, [documentId])

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
      if (!data.success || !data.content) {
        throw new Error(data.error || "No content found")
      }

      // Convert base64 to ArrayBuffer for mammoth
      const binaryString = atob(data.content)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const result = await mammoth.convertToHtml(
        { arrayBuffer: bytes.buffer },
        { 
          styleMap: [
            "p[style-name='Title'] => h1:fresh",
            "p[style-name='Heading 1'] => h2:fresh",
            "p[style-name='Heading 2'] => h3:fresh",
          ]
        }
      )
      
      setContent(result.value)
      
      if (result.messages.length > 0) {
        console.warn("Mammoth warnings:", result.messages)
      }
    } catch (err) {
      console.error("Error loading document:", err)
      setError(err instanceof Error ? err.message : "Failed to load document preview")
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
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
          <title>${filename}</title>
          <style>
            body { 
              font-family: 'Times New Roman', serif; 
              padding: 40px; 
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
              color: #000;
              background: #fff;
            }
            h1, h2, h3 { color: #000; font-family: 'Times New Roman', serif; }
            h1 { font-size: 24pt; text-align: center; margin-bottom: 24pt; }
            h2 { font-size: 18pt; margin-top: 18pt; }
            p { font-size: 12pt; margin-bottom: 12pt; text-align: justify; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            img { max-width: 100%; height: auto; }
            @media print {
              body { padding: 0; margin: 0; }
              @page { size: auto; margin: 2.54cm; }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `)
    printWindow.document.close()
    
    // Wait for content (especially images) to load before printing
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
      <DialogContent className="max-w-5xl w-[95vw] h-[95vh] sm:h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-4 bg-background border-b flex flex-row items-center justify-between space-y-0 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold line-clamp-1">{filename}</DialogTitle>
              <DialogDescription className="text-xs">PDF Preview Mode</DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 pr-8">
            <div className="hidden md:flex items-center gap-2 mr-4 bg-muted/50 rounded-full px-3 py-1">
                <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(50, zoom - 10))} className="h-6 w-6 rounded-full">-</Button>
                <span className="text-[10px] font-medium w-8 text-center">{zoom}%</span>
                <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(200, zoom + 10))} className="h-6 w-6 rounded-full">+</Button>
            </div>
            <Button 
                variant="default" 
                size="sm" 
                onClick={handlePrint} 
                disabled={loading || !!error || !content}
                className="gap-2 shadow-sm"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print / Save as PDF</span>
              <span className="sm:hidden text-xs">PDF</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted/80">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-slate-100/50 p-4 md:p-8 flex justify-center items-start dark:bg-slate-900/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full w-full py-20 gap-4">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <FileText className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary/50" />
              </div>
              <div className="text-center">
                <p className="text-base font-semibold">Generating Preview</p>
                <p className="text-sm text-muted-foreground animate-pulse mt-1">Applying formatting rules...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full w-full py-20 text-center max-w-md mx-auto gap-4">
              <div className="bg-destructive/10 p-4 rounded-full">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Preview Unavailable</h3>
                <p className="text-sm text-muted-foreground mt-2">{error}</p>
              </div>
              <Button onClick={loadDocument} variant="outline" size="sm" className="mt-2">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Loading
              </Button>
            </div>
          ) : (
            <div 
              className="bg-white shadow-2xl dark:bg-slate-50 text-black overflow-hidden flex-shrink-0 origin-top transition-transform duration-200"
              style={{
                width: `${(8.5 * 96 * zoom) / 100}px`, // 8.5 inches at 96dpi
                minHeight: `${(11 * 96 * zoom) / 100}px`, // 11 inches
                padding: `${(1 * 96 * zoom) / 100}px`, // 1 inch margins
                transform: `scale(1)`,
                boxShadow: "0 0 40px rgba(0,0,0,0.15)",
                borderRadius: "1px"
              }}
            >
              <div 
                ref={viewerRef}
                className="h-full w-full preview-content"
                dangerouslySetInnerHTML={{ __html: content }}
                style={{
                    fontSize: `${(12 * zoom) / 100}pt`,
                    lineHeight: "1.6",
                    fontFamily: "'Times New Roman', serif"
                }}
              />
              
              <style 
                dangerouslySetInnerHTML={{ __html: `
                .preview-content h1 { text-align: center; margin-bottom: 1em; font-size: 2em; font-weight: bold; }
                .preview-content h2 { margin-top: 1.5em; margin-bottom: 0.5em; font-size: 1.5em; font-weight: bold; }
                .preview-content h3 { margin-top: 1.25em; margin-bottom: 0.5em; font-size: 1.25em; font-weight: bold; }
                .preview-content p { margin-bottom: 1em; text-align: justify; text-indent: 0.5in; }
                .preview-content table { border-collapse: collapse; width: 100%; margin: 1em 0; }
                .preview-content td, .preview-content th { border: 1px solid #000; padding: 0.5em; }
                .preview-content img { max-width: 100%; height: auto; display: block; margin: 1em auto; }
              `}} />
            </div>
          )}
        </div>
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
