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
import { 
  Loader2, 
  Download, 
  Printer, 
  X, 
  FileText, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Undo2, 
  Redo2, 
  ChevronDown, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  List, 
  ListOrdered 
} from "lucide-react"
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
      <DialogContent className="max-w-6xl w-[98vw] h-[95vh] sm:h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-none sm:rounded-lg">
        {/* Main Ribbon / Header */}
        <div className="bg-[#f9fbfd] dark:bg-slate-900 border-b flex flex-col">
          <div className="p-3 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-4 px-2">
              <div className="bg-blue-600 p-2 rounded text-white hidden sm:block">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 line-clamp-1 truncate max-w-[200px] sm:max-w-md">
                    {filename}
                  </DialogTitle>
                  <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 uppercase font-bold tracking-wider">DOCX</span>
                </div>
                {/* Mock Menu Bar */}
                <div className="hidden md:flex items-center gap-3 mt-0.5">
                  {["File", "Edit", "View", "Insert", "Format", "Tools", "Extensions", "Help"].map((menu) => (
                    <span key={menu} className="text-xs text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 px-1 rounded cursor-default transition-colors">
                      {menu}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 pr-2">
              <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handlePrint} 
                  disabled={loading || !!error || !content}
                  className="bg-blue-600 hover:bg-blue-700 h-8 gap-2 rounded-full shadow-sm text-xs font-medium"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden md:inline">Print / Export</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mock Formatting Toolbar */}
          <div className="bg-[#edf2fa] dark:bg-slate-800/50 px-4 py-1.5 border-t border-b flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
            <div className="hidden lg:flex items-center gap-1 border-r border-slate-300 dark:border-slate-700 pr-2 mr-1">
              <Button variant="ghost" size="icon" className="h-7 w-7"><Undo2 className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7"><Redo2 className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7"><Printer size={14} /></Button>
            </div>
            
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded px-2 py-0.5 border border-slate-200 dark:border-slate-700 text-xs font-medium min-w-[100px] cursor-default">
              Times New Roman <ChevronDown className="h-3 w-3 ml-auto opacity-50" />
            </div>

            <div className="flex items-center gap-1 border-r border-slate-300 dark:border-slate-700 pr-2 mx-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 font-bold">B</Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 italic">I</Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 underline underline-offset-4 decoration-2">U</Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600">A</Button>
            </div>

            <div className="hidden sm:flex items-center gap-1 border-r border-slate-300 dark:border-slate-700 pr-2 mx-1">
              <Button variant="ghost" size="icon" className="h-7 w-7"><AlignLeft className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7"><AlignCenter className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7"><AlignRight className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7"><AlignJustify className="h-3.5 w-3.5" /></Button>
            </div>

            <div className="hidden md:flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7"><List className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7"><ListOrdered className="h-3.5 w-3.5" /></Button>
            </div>

            <div className="ml-auto md:flex items-center gap-2 mr-2 bg-white dark:bg-slate-800 rounded-px px-2 py-0.5 border border-slate-200 dark:border-slate-700 hidden">
                <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(50, zoom - 10))} className="h-5 w-5">-</Button>
                <span className="text-[10px] font-medium w-8 text-center">{zoom}%</span>
                <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(200, zoom + 10))} className="h-5 w-5">+</Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-100/50 p-2 sm:p-4 md:p-8 flex justify-center items-start dark:bg-slate-900/50">
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
            /* Error state unchanged */
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
              className="bg-white shadow-2xl dark:bg-slate-50 text-black overflow-hidden flex-shrink-0 origin-top transition-all duration-200 mx-auto"
              style={{
                width: "100%",
                maxWidth: `${(8.5 * 96 * zoom) / 100}px`,
                minHeight: `${(11 * 96 * zoom) / 100}px`,
                padding: `clamp(1rem, 5vw, ${(1 * 96 * zoom) / 100}px)`,
                boxShadow: "0 0 40px rgba(0,0,0,0.15)",
                borderRadius: "1px",
                marginBottom: "2rem"
              }}
            >
              <div 
                ref={viewerRef}
                className="h-full w-full preview-content"
                dangerouslySetInnerHTML={{ __html: content }}
                style={{
                    fontSize: `clamp(10pt, 2vw, ${(12 * zoom) / 100}pt)`,
                    lineHeight: "1.6",
                    fontFamily: "'Times New Roman', serif"
                }}
              />
              
              <style 
                dangerouslySetInnerHTML={{ __html: `
                .preview-content h1 { text-align: center; margin-bottom: 1em; font-size: 1.8em; font-weight: bold; }
                .preview-content h2 { margin-top: 1.5em; margin-bottom: 0.5em; font-size: 1.4em; font-weight: bold; }
                .preview-content h3 { margin-top: 1.25em; margin-bottom: 0.5em; font-size: 1.2em; font-weight: bold; }
                .preview-content p { margin-bottom: 1em; text-align: justify; }
                
                @media (min-width: 640px) {
                  .preview-content p { text-indent: 0.5in; }
                }

                .preview-content table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 0.9em; overflow-x: auto; display: block; }
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
