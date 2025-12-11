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

    const instructionsTrimmed = instructions?.trim() || ""
    
    console.log("[v0] Updating assistant instructions:", assistantName)
    console.log("[v0] Instructions value:", instructionsTrimmed === "" ? "(empty - resetting to minimal)" : instructionsTrimmed)

    // Pinecone API requires at least one field with a value to be updated
    // When instructions is empty, we'll use a minimal placeholder value
    // that effectively means "no custom instructions"
    // Using a single space as it's the minimal valid value
    const instructionsToUpdate = instructionsTrimmed === "" ? " " : instructionsTrimmed

    // Update assistant instructions with the provided value (or minimal placeholder for reset)
    await pc.updateAssistant(assistantName, {
      instructions: instructionsToUpdate,
    })
    
    if (instructionsTrimmed === "") {
      console.log("[v0] Instructions reset successfully (set to minimal value)")
      return NextResponse.json({
        success: true,
        message: "Assistant instructions reset successfully",
      })
    }
    
    console.log("[v0] Instructions updated successfully")
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
