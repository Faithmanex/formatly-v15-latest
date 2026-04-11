"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Send, X, Minimize2, Loader2, Sparkles, User } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
}

const KNOWLEDGE_BASE = {
  about: "Formatly is an AI-powered academic document formatting tool. It formats research papers in APA, MLA, Chicago, Harvard, and Turabian citation styles in seconds. Founded to help researchers and students focus on content rather than formatting.",
  
  pricing: {
    free: "Free plan: 3 documents per month, APA style only, standard email support.",
    pro: "Pro plan: $12/month ($120/year), 50 documents, all styles (MLA, Chicago, Harvard, Turabian), tracked changes, custom styles, AI assistant, priority support.",
    business: "Business plan: $39/month ($390/year), unlimited documents, team collaboration, centralized billing, SSO, enterprise security."
  },
  
  supported_styles: "APA 7th edition, MLA 9th edition, Chicago Manual of Style, Harvard, and Turabian. You can convert between styles in one click.",
  
  file_formats: "Formatly supports Word (.docx) files only. Upload your .docx document and download the formatted version.",
  
  security: "Yes, we use enterprise-grade end-to-end encryption. Files are not stored longer than necessary. We comply with GDPR and CCPA.",
  
  speed: "Most documents format in about 30 seconds. Time depends on document size.",
  
  supported_features: {
    free: ["3 documents per month", "APA Style formatting only", "Standard Email Support"],
    pro: ["50 documents per month", "All formatting styles", "Tracked Changes", "Custom styles", "AI Assistant", "Priority support"],
    business: ["Unlimited documents", "Team collaboration", "Centralized billing", "SSO & Enterprise Security"]
  },
  
  uploading: "Go to the dashboard, click Upload, select your .docx file, choose your citation style, and click Format. Your document will be ready in about 30 seconds.",
  
  switching_styles: "You can convert between any supported style in one click. All headings, citations, and references update automatically.",
  
  collaboration: "Team collaboration is available on the Business plan. Invite team members, share documents, and track changes together.",
  
  ai_assistant: "The AI Assistant is available on Pro and Business plans. It provides intelligent suggestions for formatting and document structure.",
}

const FAQ = [
  { q: "How do I upload documents?", a: KNOWLEDGE_BASE.uploading },
  { q: "What file formats are supported?", a: KNOWLEDGE_BASE.file_formats },
  { q: "How does pricing work?", a: `Free: ${KNOWLEDGE_BASE.pricing.free} Pro: ${KNOWLEDGE_BASE.pricing.pro} Business: ${KNOWLEDGE_BASE.pricing.business}` },
  { q: "What citation styles are supported?", a: KNOWLEDGE_BASE.supported_styles },
  { q: "Is my data secure?", a: KNOWLEDGE_BASE.security },
  { q: "How long does formatting take?", a: KNOWLEDGE_BASE.speed },
  { q: "Can I switch to a different style?", a: KNOWLEDGE_BASE.switching_styles },
  { q: "How does the AI assistant work?", a: KNOWLEDGE_BASE.ai_assistant },
]

const findRelevantInfo = (query: string): string => {
  const q = query.toLowerCase()
  
  if (q.includes("upload") || q.includes("file") || q.includes("docx") || q.includes("document")) {
    return KNOWLEDGE_BASE.uploading
  }
  if (q.includes("price") || q.includes("cost") || q.includes("pay") || q.includes("plan") || q.includes("free") || q.includes("pro") || q.includes("business")) {
    return `Pricing:\n- Free: ${KNOWLEDGE_BASE.pricing.free}\n- Pro: ${KNOWLEDGE_BASE.pricing.pro}\n- Business: ${KNOWLEDGE_BASE.pricing.business}`
  }
  if (q.includes("style") || q.includes("apa") || q.includes("mla") || q.includes("chicago") || q.includes("harvard") || q.includes("turabian") || q.includes("citation")) {
    return KNOWLEDGE_BASE.supported_styles
  }
  if (q.includes("secure") || q.includes("privacy") || q.includes("encrypt") || q.includes("gdpr")) {
    return KNOWLEDGE_BASE.security
  }
  if (q.includes("time") || q.includes("fast") || q.includes("quick") || q.includes("seconds")) {
    return KNOWLEDGE_BASE.speed
  }
  if (q.includes("convert") || q.includes("switch") || q.includes("change style")) {
    return KNOWLEDGE_BASE.switching_styles
  }
  if (q.includes("team") || q.includes("collaborat") || q.includes("business")) {
    return KNOWLEDGE_BASE.collaboration
  }
  if (q.includes("ai") || q.includes("assistant") || q.includes("help")) {
    return KNOWLEDGE_BASE.ai_assistant
  }
  if (q.includes("about") || q.includes("what is")) {
    return KNOWLEDGE_BASE.about
  }
  
  return ""
}

const MarkdownComponents = {
  code({ inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || "")
    return !inline && match ? (
      <pre className="bg-slate-950 text-slate-100 p-3 rounded-lg overflow-x-auto my-2">
        <code className="font-mono text-sm" {...props}>{children}</code>
      </pre>
    ) : (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
    )
  },
  p({ children }: any) {
    return <p className="mb-2 last:mb-0 leading-6 text-sm">{children}</p>
  },
  ul({ children }: any) {
    return <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>
  },
  ol({ children }: any) {
    return <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>
  },
  li({ children }: any) {
    return <li className="leading-6 text-sm">{children}</li>
  },
  h1({ children }: any) {
    return <h1 className="text-lg font-bold mb-2 mt-4">{children}</h1>
  },
  h2({ children }: any) {
    return <h2 className="text-base font-semibold mb-2 mt-3">{children}</h2>
  },
  h3({ children }: any) {
    return <h3 className="text-sm font-medium mb-1 mt-2">{children}</h3>
  },
  blockquote({ children }: any) {
    return <blockquote className="border-l-2 border-primary/30 pl-3 py-1 italic mb-2 text-sm text-muted-foreground">{children}</blockquote>
  },
}

interface AIChatbotFABProps {
  context?: string
  position?: "bottom-right" | "bottom-left"
}

declare global {
  interface Window {
    puter: {
      ai: {
        chat: (message: string, options?: { model?: string; stream?: boolean }) => Promise<any>
      }
    }
  }
}

export function AIChatbotFAB({ context = "You are Formatly Support AI. Help users with general support questions about Formatly - how to use the app, uploading documents, formatting issues, account questions, billing, and troubleshooting. Keep responses brief and helpful.", position = "bottom-right" }: AIChatbotFABProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const handleStopStreaming = () => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setStreamingMessageId(null)
    setIsLoading(false)
  }

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading || !window.puter) return

    setError(null)
    const userMessage: Message = {
      id: crypto.randomUUID(),
      type: "user",
      content,
      timestamp: new Date(),
    }

    const aiMessageId = crypto.randomUUID()
    const aiPlaceholder: Message = {
      id: aiMessageId,
      type: "ai",
      content: "",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage, aiPlaceholder])
    setInputValue("")
    setIsLoading(true)
    setStreamingMessageId(aiMessageId)

    try {
      const relevantInfo = findRelevantInfo(content)
      const knowledgeContext = relevantInfo 
        ? `Relevant information from our knowledge base:\n${relevantInfo}\n\n${context}`
        : context
      
      const fullPrompt = `${knowledgeContext}\n\nUser question: ${content}\n\nProvide a helpful, concise response based on the knowledge base. Be friendly and helpful.`

      const response = await window.puter.ai.chat(fullPrompt, {
        model: "nvidia/nemotron-3-nano-30b-a3b:free",
        stream: true,
      })

      let accumulated = ""

      if (response && typeof response[Symbol.asyncIterator] === "function") {
        for await (const part of response) {
          if (part?.text) {
            accumulated += part.text
            setMessages((prev) => prev.map((m) => (m.id === aiMessageId ? { ...m, content: accumulated } : m)))
          }
        }
      } else if (typeof response === "string") {
        accumulated = response
        setMessages((prev) => prev.map((m) => (m.id === aiMessageId ? { ...m, content: accumulated } : m)))
      }

      if (!accumulated.trim()) {
        accumulated = "I'm sorry, I couldn't generate a response this time. Please try again."
        setMessages((prev) => prev.map((m) => (m.id === aiMessageId ? { ...m, content: accumulated } : m)))
      }
    } catch (err) {
      const errorMessage = err instanceof Error && err.name === "AbortError"
        ? "Response stopped."
        : "I'm having trouble connecting right now. Please try again."

      setMessages((prev) => prev.map((m) => (m.id === aiMessageId ? { ...m, content: errorMessage } : m)))
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("AI Error:", err)
        setError(err.message)
      }
    } finally {
      abortControllerRef.current = null
      setIsLoading(false)
      setStreamingMessageId(null)
    }
  }, [isLoading, context])

  const handleClose = () => {
    setIsOpen(false)
    setIsMinimized(false)
  }

  const exampleQuestions = [
    "How do I upload documents?",
    "What are the pricing plans?",
    "What citation styles are supported?",
  ]

  return (
    <>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`fixed ${position === "bottom-right" ? "right-4" : "left-4"} bottom-4 z-50`}
      >
        {!isOpen ? (
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
            onClick={() => setIsOpen(true)}
          >
            <Bot className="h-6 w-6" />
            <span className="sr-only">Open AI Chat</span>
          </Button>
        ) : (
          <div className="flex flex-col">
            <div className="flex justify-end mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed ${position === "bottom-right" ? "right-4" : "left-4"} bottom-20 z-40 w-[350px] max-w-[calc(100vw-2rem)]`}
          >
            <div className="bg-background border border-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Formatly AI</h3>
                    <p className="text-xs text-muted-foreground">Powered by NVIDIA Nemotron</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-7 w-7 p-0"
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {!isMinimized && (
                <>
                  <div className="h-[300px] overflow-y-auto">
                    {messages.length === 0 ? (
                      <div className="p-4 space-y-4">
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground mb-4">Ask me about academic formatting!</p>
                          <div className="space-y-2">
                            {exampleQuestions.map((question) => (
                              <button
                                key={question}
                                onClick={() => handleSendMessage(question)}
                                className="w-full text-left text-xs p-2 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/50 transition-colors"
                              >
                                {question}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <ScrollArea className="h-full p-3">
                        <div className="space-y-3">
                          {messages.map((message) => (
                            <div key={message.id} className={`flex gap-2 ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                              <div className={`flex gap-2 max-w-[90%] ${message.type === "user" ? "flex-row-reverse" : ""}`}>
                                <div className="flex-shrink-0 mt-0.5">
                                  {message.type === "user" ? (
                                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                      <User className="h-3 w-3 text-primary-foreground" />
                                    </div>
                                  ) : (
                                    <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                                      <Sparkles className="h-3 w-3 text-primary" />
                                    </div>
                                  )}
                                </div>
                                <div className={`flex-1 min-w-0 ${message.type === "user" ? "text-right" : ""}`}>
                                  <div className={`px-3 py-2 rounded-lg text-sm ${
                                    message.type === "user"
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted"
                                  }`}>
                                    {message.type === "ai" ? (
                                      <div className="prose prose-sm max-w-none dark:prose-invert [&>*]:break-words [&_code]:break-all">
                                        <ReactMarkdown components={MarkdownComponents}>
                                          {message.content || "..."}
                                        </ReactMarkdown>
                                      </div>
                                    ) : (
                                      <div className="whitespace-pre-wrap break-words">{message.content}</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          {isLoading && streamingMessageId && (
                            <div className="flex gap-2">
                              <div className="flex-shrink-0 mt-0.5">
                                <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Loader2 className="h-3 w-3 text-primary animate-spin" />
                                </div>
                              </div>
                              <div className="bg-muted px-3 py-2 rounded-lg">
                                <div className="flex gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                                </div>
                              </div>
                            </div>
                          )}
                          <div ref={endOfMessagesRef} />
                        </div>
                      </ScrollArea>
                    )}
                  </div>

                  <div className="border-t p-3">
                    <div className="flex gap-2">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type your message..."
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage(inputValue)}
                        disabled={isLoading || !window.puter}
                        className="flex-1"
                      />
                      {isLoading ? (
                        <Button onClick={handleStopStreaming} variant="outline" size="sm" className="px-3">
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleSendMessage(inputValue)}
                          disabled={!inputValue.trim() || !window.puter}
                          size="sm"
                          className="px-3"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}