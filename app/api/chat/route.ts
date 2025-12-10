import { type NextRequest, NextResponse } from "next/server"
import { Pinecone } from "@pinecone-database/pinecone"

interface Message {
  role: "user" | "assistant"
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const { messages, conversationId } = await req.json()

    const apiKey = process.env.PINECONE_API_KEY
    const assistantName = process.env.PINECONE_ASSISTANT_NAME

    if (!apiKey || !assistantName) {
      return NextResponse.json(
        { error: "Missing PINECONE_API_KEY or PINECONE_ASSISTANT_NAME environment variables" },
        { status: 500 },
      )
    }

    // Initialize Pinecone client
    const pc = new Pinecone({ apiKey })
    const assistant = pc.assistant(assistantName)

    console.log("[v0] Chatting with assistant (streaming):", assistantName)

    // Try streaming, fallback to non-streaming if not available
    let streamResponse
    try {
      streamResponse = await assistant.chatStream({
        messages: messages.map((msg: Message) => ({
          role: msg.role,
          content: msg.content,
        })),
      })
    } catch (streamError) {
      console.log("[v0] chatStream not available, using regular chat:", streamError)
      // Fallback to regular chat
      const response = await assistant.chat({
        messages: messages.map((msg: Message) => ({
          role: msg.role,
          content: msg.content,
        })),
      })

      // Process non-streaming response
      let content = response.message?.content || "No response received"
      const processedCitations: Array<{
        file_name: string
        score: number
        file_id: string
        pages?: number[]
        number: number
      }> = []

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

        positionAdjustments.reverse().forEach(({ position, citationNumber }) => {
          const marker = `[${citationNumber}]`
          content = content.slice(0, position) + marker + content.slice(position)
        })
      }

      return NextResponse.json({
        content,
        citations: processedCitations,
      })
    }

    // Create a ReadableStream for streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send immediate start signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "start" })}\n\n`))

          let fullContent = ""
          let citationsMap = new Map() // Use map to deduplicate by position

          // Process the stream
          for await (const chunk of streamResponse) {
            console.log("[v0] Stream chunk:", JSON.stringify(chunk))

            // Handle different chunk types
            if (chunk.type === "content_chunk" && chunk.delta?.content) {
              const content = chunk.delta.content
              fullContent += content
              // Send content chunk
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "content", content })}\n\n`))
            } else if (chunk.type === "citation" && chunk.citation) {
              // Collect individual citation chunks as they stream
              const citation = chunk.citation
              if (citation.position !== undefined) {
                citationsMap.set(citation.position, citation)
              }
            }
          }

          // Convert citations map to array
          const citations = Array.from(citationsMap.values())

          console.log("[v0] Stream complete")
          console.log("[v0] Raw citations:", JSON.stringify(citations, null, 2))

          // Process citations and insert markers
          const processedCitations: Array<{
            file_name: string
            score: number
            file_id: string
            pages?: number[]
            number: number
          }> = []

          if (citations && Array.isArray(citations)) {
            const sortedCitations = [...citations].sort((a, b) => (a.position || 0) - (b.position || 0))
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

            // Send citation markers to insert
            positionAdjustments.reverse().forEach(({ position, citationNumber }) => {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "citation_marker", position, number: citationNumber })}\n\n`,
                ),
              )
            })

            // Send final citations list
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "citations", citations: processedCitations })}\n\n`),
            )

            console.log("[v0] Processed citations:", processedCitations.length)
          }

          // Send done signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`))
          controller.close()
        } catch (error) {
          console.error("[v0] Stream error:", error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: error instanceof Error ? error.message : "Stream error" })}\n\n`,
            ),
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    })
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process chat request" },
      { status: 500 },
    )
  }
}
