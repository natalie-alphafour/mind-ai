import { type NextRequest, NextResponse } from "next/server"
import { Pinecone } from "@pinecone-database/pinecone"

export async function POST(req: NextRequest) {
  try {
    const { instructions } = await req.json()

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

    console.log("[v0] Updating assistant instructions:", assistantName)

    // Update assistant instructions
    await pc.updateAssistant(assistantName, {
      instructions,
    })

    console.log("[v0] Assistant instructions updated successfully")

    return NextResponse.json({
      success: true,
      message: "Assistant instructions updated successfully",
    })
  } catch (error) {
    console.error("[v0] Update assistant API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update assistant instructions" },
      { status: 500 },
    )
  }
}
