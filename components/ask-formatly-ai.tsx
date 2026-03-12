"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Send, Plus, User, Copy, Check, Sparkles, Square } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
}

const MarkdownComponents = {
  code({ inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || "")
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
      navigator.clipboard.writeText(String(children).replace(/\n$/, ""))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }

    return !inline && match ? (
      <div className="relative group my-4 overflow-hidden rounded-lg border border-border/60">
        <div className="flex items-center justify-between bg-slate-900 text-slate-100 px-4 py-2 text-xs">
          <span className="font-mono uppercase tracking-wide">{match[1]}</span>
          <button onClick={handleCopy} className="p-1 rounded hover:bg-slate-700 transition-colors" title="Copy code">
            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <pre className="bg-slate-950 text-slate-100 p-4 overflow-x-auto">
          <code className="font-mono text-sm leading-relaxed" {...props}>
            {String(children).replace(/\n$/, "")}
          </code>
        </pre>
      </div>
    ) : (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
        {children}
      </code>
    )
  },
  p({ children }: any) {
    return <p className="mb-4 last:mb-0 leading-7 text-sm md:text-base">{children}</p>
  },
  ul({ children }: any) {
    return <ul className="list-disc ml-6 mb-4 space-y-2">{children}</ul>
  },
  ol({ children }: any) {
    return <ol className="list-decimal ml-6 mb-4 space-y-2">{children}</ol>
  },
  li({ children }: any) {
    return <li className="leading-7 text-sm md:text-base pl-1">{children}</li>
  },
  h1({ children }: any) {
    return <h1 className="text-lg md:text-xl font-bold mb-4 mt-6 first:mt-0 text-foreground">{children}</h1>
  },
  h2({ children }: any) {
    return <h2 className="text-base md:text-lg font-semibold mb-3 mt-5 first:mt-0 text-foreground">{children}</h2>
  },
  h3({ children }: any) {
    return <h3 className="text-sm md:text-base font-medium mb-2 mt-4 first:mt-0 text-foreground">{children}</h3>
  },
  blockquote({ children }: any) {
    return <blockquote className="border-l-4 border-primary/30 pl-4 py-2 italic mb-4 bg-muted/30 rounded-r-lg">{children}</blockquote>
  },
  table({ children }: any) {
    return (
      <div className="overflow-x-auto mb-4 rounded-lg border">
        <table className="min-w-full border-collapse">{children}</table>
      </div>
    )
  },
  th({ children }: any) {
    return <th className="border-b border-muted bg-muted/50 px-4 py-3 text-left font-semibold text-sm">{children}</th>
  },
  td({ children }: any) {
    return <td className="border-b border-muted/30 px-4 py-3 text-sm">{children}</td>
  },
}

export function AskFormatlyAI() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, isLoading])

  const handleStopStreaming = () => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setStreamingMessageId(null)
    setIsLoading(false)
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

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

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          context:
            "You are Formatly AI, an expert assistant for academic formatting, citation styles, and document structure. Provide helpful, accurate information about APA, MLA, Chicago, and other academic formats. Use markdown formatting for better readability, including code blocks for examples, bullet points for lists, and proper headings for organization.",
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error("Failed to get AI response")
      }

      if (!response.body) {
        throw new Error("Streaming not supported in this browser")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        if (!chunk) continue

        accumulated += chunk
        setMessages((prev) => prev.map((m) => (m.id === aiMessageId ? { ...m, content: accumulated } : m)))
      }

      accumulated += decoder.decode()
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMessageId
            ? { ...m, content: accumulated.trim() || "I'm sorry, I couldn't generate a response this time." }
            : m,
        ),
      )
    } catch (error) {
      const message = error instanceof Error && error.name === "AbortError"
        ? "Response stopped. You can ask a follow-up question anytime."
        : "I'm sorry, I'm having trouble connecting right now. Please try again in a moment."

      setMessages((prev) => prev.map((m) => (m.id === aiMessageId ? { ...m, content: message } : m)))
      if (!(error instanceof Error && error.name === "AbortError")) {
        console.error("Error getting AI response:", error)
      }
    } finally {
      abortControllerRef.current = null
      setIsLoading(false)
      setStreamingMessageId(null)
    }
  }

  const handleNewChat = () => {
    abortControllerRef.current?.abort()
    setMessages([])
    setInputValue("")
    setIsLoading(false)
    setStreamingMessageId(null)
  }

  const exampleQuestions = [
    "How do I format APA citations?",
    "What are the key differences between MLA and Chicago style?",
    "How do I structure a table of contents?",
    "Help with reference formatting",
  ]

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <div className="flex items-center justify-between border-b bg-background/80 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold md:text-2xl">Formatly AI</h1>
            <p className="text-xs text-muted-foreground md:text-sm">Formatting help with live streaming responses</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleNewChat} className="flex items-center gap-2 bg-transparent">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Chat</span>
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <div className="mx-auto flex h-full w-full max-w-4xl flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Bot className="h-8 w-8" />
            </div>
            <h2 className="mb-2 text-lg font-medium md:text-xl">How can I help you today?</h2>
            <p className="mb-8 max-w-md text-sm text-muted-foreground md:text-base">
              Ask me about academic formatting, citation styles, and document structure.
            </p>

            <div className="grid w-full max-w-2xl grid-cols-1 gap-3 md:grid-cols-2">
              {exampleQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => handleSendMessage(question)}
                  className="rounded-xl border border-border/70 bg-card p-4 text-left text-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm md:text-base"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`flex gap-3 ${
                      message.type === "user"
                        ? "max-w-[80%] flex-row-reverse sm:max-w-[70%]"
                        : "max-w-[92%] flex-row sm:max-w-[86%]"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {message.type === "user" ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          <Bot className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className={`flex min-w-0 flex-1 flex-col space-y-1 ${message.type === "user" ? "items-end" : "items-start"}`}>
                      <div className="text-xs text-muted-foreground">{message.type === "user" ? "You" : "Formatly AI"}</div>
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm md:text-base ${
                          message.type === "user"
                            ? "bg-primary text-primary-foreground"
                            : "border border-border/60 bg-card/80 text-foreground shadow-sm"
                        }`}
                      >
                        {message.type === "ai" ? (
                          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground [&>*]:break-words [&_code]:break-all [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap">
                            <ReactMarkdown components={MarkdownComponents}>{message.content || "..."}</ReactMarkdown>
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
                <div className="flex items-center justify-start gap-2 px-11 text-xs text-muted-foreground">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  Streaming response...
                </div>
              )}
              <div ref={endOfMessagesRef} />
            </div>
          </ScrollArea>
        )}
      </div>

      <div className="border-t bg-background/90 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex max-w-4xl gap-3">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about formatting, citations, or academic writing..."
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage(inputValue)}
            disabled={isLoading}
            className="flex-1"
          />
          {isLoading ? (
            <Button onClick={handleStopStreaming} variant="outline" size="sm" className="gap-1">
              <Square className="h-3.5 w-3.5" />
              Stop
            </Button>
          ) : (
            <Button onClick={() => handleSendMessage(inputValue)} disabled={!inputValue.trim()} size="sm">
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
