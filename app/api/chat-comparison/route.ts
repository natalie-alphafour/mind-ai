import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { messages, conversationId, temperature, model } = await request.json()

    // Create a transform stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send start event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "start" })}\n\n`))

          let citations: any[] = []
          let ragDone = false
          let gptDone = false

          // Start both streams in parallel
          const ragPromise = (async () => {
            try {
              const ragResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages, conversationId, temperature, model }),
              })

              if (ragResponse.headers.get("content-type")?.includes("text/event-stream")) {
                const ragReader = ragResponse.body?.getReader()
                const ragDecoder = new TextDecoder()

                if (ragReader) {
                  while (true) {
                    const { done, value } = await ragReader.read()
                    if (done) break

                    const chunk = ragDecoder.decode(value)
                    const lines = chunk.split("\n")

                    for (const line of lines) {
                      if (line.startsWith("data: ")) {
                        try {
                          const data = JSON.parse(line.slice(6))
                          if (data.type === "content") {
                            controller.enqueue(
                              encoder.encode(
                                `data: ${JSON.stringify({ type: "rag_content", content: data.content })}\n\n`,
                              ),
                            )
                          } else if (data.type === "citation_marker") {
                            // Forward citation markers for RAG content
                            controller.enqueue(
                              encoder.encode(
                                `data: ${JSON.stringify({ type: "rag_citation_marker", position: data.position, number: data.number })}\n\n`,
                              ),
                            )
                          } else if (data.type === "citations") {
                            citations = data.citations
                          }
                        } catch (e) {
                          // Skip parse errors
                        }
                      }
                    }
                  }
                }
              } else {
                // Handle non-streaming RAG response
                const ragData = await ragResponse.json()
                citations = ragData.citations || []
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "rag_content", content: ragData.content })}\n\n`),
                )
              }
            } catch (error) {
              console.error("RAG stream error:", error)
            } finally {
              ragDone = true
            }
          })()

          const gptPromise = (async () => {
            try {
              const gptResponse = await openai.chat.completions.create({
                model: "gpt-4o", // Using GPT-4o as GPT-5 placeholder
                messages: messages.map((m: any) => ({
                  role: m.role,
                  content: m.content,
                })),
                temperature,
                stream: true,
              })

              for await (const chunk of gptResponse) {
                const content = chunk.choices[0]?.delta?.content || ""
                if (content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "gpt_content", content })}\n\n`))
                }
              }
            } catch (error) {
              console.error("GPT stream error:", error)
            } finally {
              gptDone = true
            }
          })()

          // Wait for both to complete
          await Promise.all([ragPromise, gptPromise])

          // Send final data
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "citations", citations })}\n\n`))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`))
          controller.close()
        } catch (error) {
          console.error("Error in comparison stream:", error)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", error: "Failed to get responses" })}\n\n`),
          )
          controller.close()
        }
      },
    })

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Error in chat comparison:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
