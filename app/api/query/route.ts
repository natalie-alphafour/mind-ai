import { type NextRequest, NextResponse } from "next/server"
import { Pinecone } from "@pinecone-database/pinecone"

interface QueryRequest {
  message: string
  temperature?: number
  model?: string
  systemPrompt?: string
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>
}

interface Citation {
  file_name: string
  score: number
  file_id: string
  pages?: number[]
  number: number
}

interface QueryResponse {
  answer: string
  citations: Citation[]
  error?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as QueryRequest

    // Extract and normalize parameters with defaults
    const message = body.message?.trim()
    const temperature = typeof body.temperature === "number" && body.temperature >= 0 && body.temperature <= 1
      ? body.temperature
      : 0.7
    const model = body.model?.trim() || "gpt-4o"
    const systemPrompt = body.systemPrompt?.trim() || ""
    const conversationHistory = Array.isArray(body.conversationHistory)
      ? body.conversationHistory
      : []

    // Validate required fields
    if (!message || message.length === 0) {
      return NextResponse.json(
        { error: "Message is required and must be a non-empty string" },
        { status: 400 }
      )
    }

    // Validate environment variables
    const apiKey = process.env.PINECONE_API_KEY
    const assistantName = process.env.PINECONE_ASSISTANT_NAME

    if (!apiKey || !assistantName) {
      console.error("[API] Missing environment variables")
      return NextResponse.json(
        { error: "Server configuration error: Missing PINECONE_API_KEY or PINECONE_ASSISTANT_NAME" },
        { status: 500 }
      )
    }

    // Initialize Pinecone client
    const pc = new Pinecone({ apiKey })
    const assistant = pc.assistant(assistantName)

    console.log("[API] Processing query:", message.substring(0, 50) + "...")
    console.log("[API] Using temperature:", temperature)
    console.log("[API] Using model:", model)
    console.log("[API] System prompt provided:", systemPrompt.length > 0)

    // Build messages array from conversation history
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = []

    // Add system prompt if provided
    if (systemPrompt.length > 0) {
      messages.push({
        role: "system",
        content: systemPrompt,
      })
    }

    // Add conversation history
    messages.push(
      ...conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))
    )

    // Add current user message
    messages.push({
      role: "user" as const,
      content: message,
    })

    // Build chat options
    const chatOptions: any = {
      messages,
      temperature,
      model,
    }

    // Call Pinecone Assistant
    const response = await assistant.chat(chatOptions)

    // Extract content
    let content = response.message?.content || "No response received"

    // Process citations
    const processedCitations: Citation[] = []

    if (response.citations && Array.isArray(response.citations)) {
      const sortedCitations = [...response.citations].sort((a, b) => (a.position || 0) - (b.position || 0))
      const positionAdjustments: Array<{ position: number; citationNumber: number }> = []
      let citationCounter = 1

      sortedCitations.forEach((citation: any) => {
        if (citation.references && Array.isArray(citation.references)) {
          citation.references.forEach((ref: any) => {
            if (ref.file) {
              processedCitations.push({
                file_name: ref.file.name || "Unknown",
                score: 1.0,
                file_id: ref.file.id || "",
                pages: ref.pages || [],
                number: citationCounter,
              })
            }
          })

          if (citation.position !== undefined) {
            positionAdjustments.push({
              position: citation.position,
              citationNumber: citationCounter,
            })
            citationCounter++
          }
        }
      })

      // Insert citation markers into content
      positionAdjustments.reverse().forEach(({ position, citationNumber }) => {
        const marker = `[${citationNumber}]`
        content = content.slice(0, position) + marker + content.slice(position)
      })
    }

    const responseData: QueryResponse = {
      answer: content,
      citations: processedCitations,
    }

    console.log("[API] Query processed successfully, citations:", processedCitations.length)

    return NextResponse.json(responseData, { status: 200 })
  } catch (error) {
    console.error("[API] Query error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to process query"

    return NextResponse.json(
      {
        error: errorMessage,
        answer: "",
        citations: []
      } as QueryResponse,
      { status: 500 }
    )
  }
}

// Optional: Add OPTIONS handler for CORS support if Bubble needs it
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
