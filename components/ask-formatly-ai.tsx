"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Bot, Send, Plus, User, Copy, Check, Sparkles } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
}

const MarkdownComponents = {
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || "")
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
      navigator.clipboard.writeText(String(children).replace(/\n$/, ""))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }

    return !inline && match ? (
      <div className="relative group my-4">
        <div className="flex items-center justify-between bg-gray-800 text-gray-200 px-4 py-2 rounded-t-lg text-sm">
          <span className="font-mono">{match[1]}</span>
          <button onClick={handleCopy} className="p-1 rounded hover:bg-gray-700 transition-colors" title="Copy code">
            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto">
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
    return (
      <blockquote className="border-l-4 border-primary/30 pl-4 py-2 italic mb-4 bg-muted/30 rounded-r-lg">
        {children}
      </blockquote>
    )
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
  strong({ children }: any) {
    return <strong className="font-semibold text-foreground">{children}</strong>
  },
  em({ children }: any) {
    return <em className="italic text-muted-foreground">{children}</em>
  },
}

export function AskFormatlyAI() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, isLoading])

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content,
      timestamp: new Date(),
    }

    const aiMessageId = `${Date.now() + 1}`

    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: aiMessageId,
        type: "ai",
        content: "",
        timestamp: new Date(),
      },
    ])
    setInputValue("")
    setIsLoading(true)

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
      })

      if (!response.ok) {
        throw new Error("Failed to get AI response")
      }

      const contentType = response.headers.get("content-type") ?? ""

      let responseContent = ""

      if (contentType.includes("application/json")) {
        const data = await response.json()
        responseContent = data.response ?? data.error ?? ""
      } else {
        responseContent = await response.text()
      }

      if (!responseContent.trim()) {
        throw new Error("Received empty AI response")
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: responseContent,
        timestamp: new Date(),
      }
    } catch (error) {
      console.error("Error getting AI response:", error)
      setMessages((prev) =>
        prev.map((message) =>
          message.id === aiMessageId
            ? {
                ...message,
                content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
              }
            : message,
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setInputValue("")
  }

  const exampleQuestions = [
    "How do I format APA citations?",
    "What's the difference between MLA and APA?",
    "How to create a table of contents?",
    "Help with reference formatting",
  ]

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
      <div className="flex items-center justify-between p-4 border-b bg-background/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">Formatly AI</h1>
            <p className="text-xs text-muted-foreground">Streaming support for fast academic writing help</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleNewChat} className="flex items-center gap-2 bg-transparent">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Chat</span>
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <Bot className="h-12 w-12 md:h-16 md:w-16 text-primary mb-4" />
            <h2 className="text-lg md:text-xl font-medium mb-2">How can I help you today?</h2>
            <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-md">
              Ask me about academic formatting, citation styles, and document structure
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
              {exampleQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(question)}
                  className="p-4 text-left border rounded-xl bg-card hover:bg-muted/50 transition-colors text-sm md:text-base"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6 max-w-5xl mx-auto">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`flex gap-3 ${
                      message.type === "user"
                        ? "flex-row-reverse max-w-[75%] sm:max-w-[65%] lg:max-w-[55%]"
                        : "flex-row max-w-[85%] sm:max-w-[80%] lg:max-w-[75%]"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {message.type === "user" ? (
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div
                      className={`flex flex-col space-y-1 min-w-0 flex-1 ${message.type === "user" ? "items-end" : "items-start"}`}
                    >
                      <div className="text-xs text-muted-foreground">
                        {message.type === "user" ? "You" : "Formatly AI"}
                      </div>
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm md:text-base break-words shadow-sm ${
                          message.type === "user" ? "bg-primary text-primary-foreground" : "bg-card border text-foreground"
                        }`}
                      >
                        {message.type === "ai" ? (
                          message.content ? (
                            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground [&>*]:break-words [&_code]:break-all [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap">
                              <ReactMarkdown components={MarkdownComponents}>{message.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                              <span className="text-sm">Streaming response...</span>
                            </div>
                          )
                        ) : (
                          <div className="whitespace-pre-wrap break-words">{message.content}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={scrollAnchorRef} />
            </div>
          </ScrollArea>
        )}
      </div>

      <div className="border-t p-4 bg-background/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto space-y-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about formatting, citations, or academic writing..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage(inputValue)
              }
            }}
            disabled={isLoading}
            className="min-h-20"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Press Enter to send • Shift+Enter for a new line</p>
            <Button onClick={() => handleSendMessage(inputValue)} disabled={isLoading || !inputValue.trim()} size="sm">
              <Send className="h-4 w-4 mr-1" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
