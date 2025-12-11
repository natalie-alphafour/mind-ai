"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Sparkles } from "lucide-react"
import { MessageBubble } from "@/components/message-bubble"
import { EmptyState } from "@/components/empty-state"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  citations?: Citation[]
  isThinking?: boolean
}

interface Citation {
  file_name: string
  score: number
  file_id: string
  pages?: number[]
  number: number
}

interface ChatViewProps {
  conversationId: string | null
  onUpdateConversationName: (id: string, name: string) => void
  onNewConversation: () => void
  temperature: number
}

export function ChatView({ conversationId, onUpdateConversationName, onNewConversation, temperature }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (conversationId) {
      // Load messages for current conversation
      const stored = localStorage.getItem(`messages_${conversationId}`)
      if (stored) {
        const loadedMessages = JSON.parse(stored)
        // Remove isThinking property from all loaded messages since saved messages should never be in thinking state
        const cleanedMessages = loadedMessages.map((msg: Message) => {
          const { isThinking, ...rest } = msg
          return rest
        })
        setMessages(cleanedMessages)
      } else {
        setMessages([])
      }
    }
  }, [conversationId])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading) return

    // If no conversation exists, create one
    if (!conversationId) {
      onNewConversation()
      // Wait a tick for the new conversation to be created
      await new Promise((resolve) => setTimeout(resolve, 100))
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setIsLoading(true)

    // Update conversation name with first message
    if (messages.length === 0) {
      onUpdateConversationName(conversationId, input.trim().slice(0, 50) + (input.trim().length > 50 ? "..." : ""))
    }

    // Create placeholder assistant message for streaming
    const assistantMessageId = (Date.now() + 1).toString()
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      citations: [],
      isThinking: true,
    }

    const messagesWithPlaceholder = [...updatedMessages, assistantMessage]
    setMessages(messagesWithPlaceholder)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          conversationId,
          temperature,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      // Check content type to determine if streaming or regular JSON
      const contentType = response.headers.get("content-type")
      console.log("[v0] Response content-type:", contentType)

      if (contentType?.includes("text/event-stream")) {
        // Handle streaming response
        console.log("[v0] Handling streaming response")
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error("Response body is not readable")
        }

        let streamedContent = ""
        let citationMarkers: Array<{ position: number; number: number }> = []
        let finalCitations: Citation[] = []
        let hasReceivedContent = false

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            console.log("[v0] Stream reading complete")
            break
          }

          const chunk = decoder.decode(value)
          console.log("[v0] Received chunk:", chunk.substring(0, 100))
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))
                console.log("[v0] Parsed data:", data.type, data)

                if (data.type === "start") {
                  console.log("[v0] Stream started, waiting for content...")
                  // Set thinking state on the message
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId ? { ...msg, content: "", isThinking: true } : msg,
                    ),
                  )
                } else if (data.type === "content") {
                  // First content received, clear thinking state
                  if (!hasReceivedContent) {
                    hasReceivedContent = true
                  }

                  streamedContent += data.content
                  console.log("[v0] Streamed content length:", streamedContent.length)

                  // Update message with streaming content
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId ? { ...msg, content: streamedContent, isThinking: false } : msg,
                    ),
                  )
                } else if (data.type === "citation_marker") {
                  citationMarkers.push({ position: data.position, number: data.number })
                } else if (data.type === "citations") {
                  finalCitations = data.citations
                  console.log("[v0] Received citations:", finalCitations.length)
                } else if (data.type === "done") {
                // Insert citation markers into content
                let finalContent = streamedContent
                citationMarkers.reverse().forEach(({ position, number }) => {
                  finalContent = finalContent.slice(0, position) + `[${number}]` + finalContent.slice(position)
                })

                // Update with final content and citations
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId ? { ...msg, content: finalContent, citations: finalCitations } : msg,
                  ),
                )

                // Save to localStorage (remove isThinking from all messages before saving)
                const finalMessages = messagesWithPlaceholder.map((msg) => {
                  const updated = msg.id === assistantMessageId 
                    ? { ...msg, content: finalContent, citations: finalCitations } 
                    : msg
                  const { isThinking, ...cleaned } = updated
                  return cleaned
                })
                localStorage.setItem(`messages_${conversationId}`, JSON.stringify(finalMessages))
                } else if (data.type === "error") {
                  throw new Error(data.error)
                }
              } catch (parseError) {
                console.error("[v0] Failed to parse SSE data:", line, parseError)
              }
            }
          }
        }
      } else {
        // Handle regular JSON response (fallback)
        console.log("[v0] Handling JSON response")
        const data = await response.json()
        console.log("[v0] JSON data:", data)

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, content: data.content, citations: data.citations } : msg,
          ),
        )

        // Save to localStorage (remove isThinking from all messages before saving)
        const finalMessages = messagesWithPlaceholder.map((msg) => {
          const updated = msg.id === assistantMessageId 
            ? { ...msg, content: data.content, citations: data.citations } 
            : msg
          const { isThinking, ...cleaned } = updated
          return cleaned
        })
        localStorage.setItem(`messages_${conversationId}`, JSON.stringify(finalMessages))
      }
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      const errorMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content:
          "Sorry, I encountered an error. Please make sure you have configured your Pinecone API key in the environment variables.",
      }
      setMessages((prev) => prev.map((msg) => (msg.id === assistantMessageId ? errorMessage : msg)))
    } finally {
      setIsLoading(false)
    }
  }

  if (!conversationId) {
    return <EmptyState onNewConversation={onNewConversation} />
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0">
      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-4 lg:px-8">
          <div className="max-w-3xl mx-auto py-8 space-y-6">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-primary-foreground animate-pulse" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" style={{ animationDuration: "1.5s" }} />
                <div className="h-4 bg-muted rounded animate-pulse w-1/2" style={{ animationDuration: "1.5s", animationDelay: "0.2s" }} />
                <div className="h-4 bg-muted rounded animate-pulse w-2/3" style={{ animationDuration: "1.5s", animationDelay: "0.4s" }} />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-background flex-shrink-0">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4 lg:p-6">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your documents..."
                className="min-h-[60px] max-h-[200px] resize-none pr-12"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
              />
            </div>
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="h-[60px] w-[60px]">
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">Powered by Pinecone Assistant</p>
        </form>
      </div>
    </div>
  )
}
