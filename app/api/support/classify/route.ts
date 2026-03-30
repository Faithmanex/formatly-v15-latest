import { GoogleGenerativeAI } from "@google/generative-ai"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    const { subject, message, planName = "Free" } = await request.json()

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ priority: "medium", error: "Gemini API key not configured" }, { status: 200 })
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // Using 1.5 flash for classification tasks as it's very fast
      systemInstruction: `You are a support ticket classifier for Formatly, an academic document formatting service.
      Your task is to classify the urgency of a support ticket into one of four levels: 'low', 'medium', 'high', or 'urgent'.
      
      Criteria:
      - 'urgent': Critical system failures, billing errors causing plan access issues, urgent deadlines with failing tools.
      - 'high': Feature bugs, account access issues, style guide compliance questions that delay submission.
      - 'medium': General questions about how to use features, feedback, or minor UI glitches.
      - 'low': Greetings, feature requests, or praise.
      
      Output ONLY the word: low, medium, high, or urgent.`,
    })

    const prompt = `Subject: ${subject}\nMessage: ${message}\nUser Plan: ${planName}`

    const result = await model.generateContent(prompt)
    const priority = result.response.text().trim().toLowerCase()

    // Validate the priority output
    const validPriorities = ["low", "medium", "high", "urgent"]
    const finalPriority = validPriorities.includes(priority) ? priority : "medium"

    return NextResponse.json({ priority: finalPriority })
  } catch (error) {
    console.error("Error classifying ticket:", error)
    return NextResponse.json({ priority: "medium", error: "AI classification failed" }, { status: 200 })
  }
}
