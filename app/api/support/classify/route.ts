import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"

export async function POST(request: NextRequest) {
  try {
    const { subject, message, planName = "Free" } = await request.json()

    const apiKey = process.env.NVIDIA_API_KEY
    const model = process.env.NVIDIA_MODEL
    
    if (!apiKey) {
      return NextResponse.json({ priority: "medium", error: "NVIDIA API key not configured" }, { status: 200 })
    }

    const systemPrompt = `You are a support ticket classifier for Formatly, an academic document formatting service.
Your task is to classify the urgency of a support ticket into one of four levels: 'low', 'medium', 'high', or 'urgent'.

Criteria:
- 'urgent': Critical system failures, billing errors causing plan access issues, urgent deadlines with failing tools.
- 'high': Feature bugs, account access issues, style guide compliance questions that delay submission.
- 'medium': General questions about how to use features, feedback, or minor UI glitches.
- 'low': Greetings, feature requests, or praise.

Output ONLY the word: low, medium, high, or urgent.`

    const userPrompt = `Subject: ${subject}\nMessage: ${message}\nUser Plan: ${planName}`

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
        temperature: 0.1,
        max_tokens: 20,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("NVIDIA API error:", response.status, errorText)
      return NextResponse.json({ priority: "medium", error: "AI classification failed" }, { status: 200 })
    }

    const data = await response.json()
    const priority = data.choices?.[0]?.message?.content?.trim().toLowerCase() || "medium"

    const validPriorities = ["low", "medium", "high", "urgent"]
    const finalPriority = validPriorities.includes(priority) ? priority : "medium"

    return NextResponse.json({ priority: finalPriority })
  } catch (error) {
    console.error("Error classifying ticket:", error)
    return NextResponse.json({ priority: "medium", error: "AI classification failed" }, { status: 200 })
  }
}
