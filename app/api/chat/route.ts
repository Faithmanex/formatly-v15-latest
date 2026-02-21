import { GoogleGenerativeAI } from "@google/generative-ai"
import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

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

    const { message, context, temperature = 0.1, maxOutputTokens = 2000, topP = 0.3, topK = 40 } = await request.json()

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: "Please provide a helpful, accurate, and concise response about academic formatting, citation styles, or document structure. Keep your answer brief and to the point and always include examples when relevant.",
      generationConfig: {
        temperature,
        maxOutputTokens,
        topP,
        topK,
      },
    })

    const userPrompt = context 
      ? `Context information:\n${context}\n\nUser Question: ${message}`
      : message

    const result = await model.generateContentStream(userPrompt)
    
    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text()
            if (chunkText) {
              controller.enqueue(encoder.encode(chunkText))
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
      },
    })
  } catch (error) {
    console.error("Error calling Gemini API:", error)
    return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 })
  }
}
