import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { getUserSubscription } from "@/lib/billing"
import { canAccessFeature } from "@/lib/billing"

export const dynamic = "force-dynamic"

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const subscription = await getUserSubscription(user.id)
    const planName = subscription?.plan?.name || null

    if (!canAccessFeature(planName, "ai_assistant")) {
      return NextResponse.json(
        {
          error: "AI Assistant requires Pro subscription",
          details: "The AI Assistant feature is available for Pro plan users. Please upgrade to access this feature.",
          plan: planName,
        },
        { status: 403 }
      )
    }

    const { message, context, temperature = 0.7, maxTokens = 2000 } = await request.json()

    const apiKey = process.env.NVIDIA_API_KEY
    const model = process.env.NVIDIA_MODEL
    
    if (!apiKey) {
      return NextResponse.json({ error: "NVIDIA API key not configured" }, { status: 500 })
    }

    const systemPrompt = "You are Formatly AI, an expert assistant for academic formatting, citation styles (APA, MLA, Chicago, Turabian, Harvard), and document structure. Provide helpful, accurate, and concise information. Use markdown formatting for better readability, including code blocks for examples, bullet points for lists, and proper headings for organization."

    const userPrompt = context 
      ? `${context}\n\nUser Question: ${message}`
      : message

    const response = await fetch(NVIDIA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "nvidia/nemotron-3-nano-30b-a3b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("NVIDIA API error:", response.status, errorText)
      return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 })
    }

    if (!response.body) {
      return NextResponse.json({ error: "Streaming not supported" }, { status: 500 })
    }

    const responseBody = response.body

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        
        try {
          const reader = responseBody.getReader()
          const decoder = new TextDecoder()
          
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            const chunk = decoder.decode(value, { stream: true })
            if (!chunk) continue
            
            const lines = chunk.split("\n").filter(line => line.trim().startsWith("data: "))
            
            for (const line of lines) {
              const data = line.slice(6).trim()
              if (data === "[DONE]") continue
              
              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content
                if (content) {
                  controller.enqueue(encoder.encode(content))
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
          
          controller.close()
        } catch (error) {
          console.error("Streaming error:", error)
          controller.error(error)
        }
      },
    })

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Error calling NVIDIA API:", error)
    return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 })
  }
}
