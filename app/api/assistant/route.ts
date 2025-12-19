import { type NextRequest, NextResponse } from "next/server"
import { Pinecone } from "@pinecone-database/pinecone"

export async function GET(req: NextRequest) {
  try {
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

    console.log("[v0] Fetching assistant details:", assistantName)

    // Fetch assistant details
    const assistant = await pc.describeAssistant(assistantName)

    console.log("[v0] Assistant instructions:", assistant.instructions)

    // Return the instructions (handle the minimal placeholder case)
    const instructions = assistant.instructions?.trim() === " " ? "" : assistant.instructions || ""

    return NextResponse.json({
      success: true,
      instructions,
    })
  } catch (error) {
    console.error("[v0] Fetch assistant API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch assistant instructions" },
      { status: 500 },
    )
  }
}
