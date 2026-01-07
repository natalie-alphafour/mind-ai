"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Sparkles } from "lucide-react"
import { MessageBubble } from "@/components/message-bubble"
import { ThemeToggle } from "@/components/theme-toggle"

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
  title?: string
  post_unique_id?: string
}

interface UserChatViewProps {
  conversationId: string | null
  onUpdateConversationName: (id: string, name: string) => void
  onNewConversation: () => void
}

export function UserChatView({
  conversationId,
  onUpdateConversationName,
  onNewConversation
}: UserChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [usageCount, setUsageCount] = useState(0)
  const [maxUsage] = useState(50)
  const scrollRef = useRef<HTMLDivElement>(null)

  const temperature = 0.7
  const model = "gpt-4o"

  const suggestedPrompts = [
    "What is marketing ?",
    "How to launch Automatic Client?",
    "Who is Alen Sultanic?"
  ]

  useEffect(() => {
    if (conversationId) {
      // Load messages for current conversation
      const stored = localStorage.getItem(`messages_${conversationId}`)

      if (stored) {
        const loadedMessages = JSON.parse(stored)
        const cleanedMessages = loadedMessages.map((msg: Message) => {
          const { isThinking, ...rest } = msg
          return rest
        })
        setMessages(cleanedMessages)
      } else {
        setMessages([])
      }
    }

    // Load usage count
    const storedUsage = localStorage.getItem("usage_count")
    if (storedUsage) {
      setUsageCount(parseInt(storedUsage, 10))
    }
  }, [conversationId])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading) return

    // Check usage limit
    if (usageCount >= maxUsage) {
      alert("You have reached your usage limit.")
      return
    }

    // If no conversation exists, create one
    if (!conversationId) {
      onNewConversation()
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
      onUpdateConversationName(
        conversationId,
        input.trim().slice(0, 50) + (input.trim().length > 50 ? "..." : "")
      )
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
          model,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to get response" }))
        throw new Error(errorData.error || "Failed to get response")
      }

      const contentType = response.headers.get("content-type")

      if (contentType?.includes("text/event-stream")) {
        // Handle streaming response
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
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.type === "start") {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: "", isThinking: true }
                        : msg,
                    ),
                  )
                } else if (data.type === "content") {
                  if (!hasReceivedContent) {
                    hasReceivedContent = true
                  }

                  streamedContent += data.content

                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: streamedContent, isThinking: false }
                        : msg,
                    ),
                  )
                } else if (data.type === "citation_marker") {
                  citationMarkers.push({ position: data.position, number: data.number })
                } else if (data.type === "citations") {
                  finalCitations = data.citations
                } else if (data.type === "done") {
                  // Insert citation markers into content
                  let finalContent = streamedContent
                  citationMarkers.reverse().forEach(({ position, number }) => {
                    finalContent = finalContent.slice(0, position) + `[${number}]` + finalContent.slice(position)
                  })

                  // Update with final content and citations
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: finalContent, citations: finalCitations }
                        : msg,
                    ),
                  )

                  // Save to localStorage
                  const finalMessages = messagesWithPlaceholder.map((msg) => {
                    const updated = msg.id === assistantMessageId
                      ? { ...msg, content: finalContent, citations: finalCitations }
                      : msg
                    const { isThinking, ...cleaned } = updated
                    return cleaned
                  })
                  localStorage.setItem(`messages_${conversationId}`, JSON.stringify(finalMessages))

                  // Increment usage count
                  const newUsageCount = usageCount + 1
                  setUsageCount(newUsageCount)
                  localStorage.setItem("usage_count", newUsageCount.toString())
                } else if (data.type === "error") {
                  throw new Error(data.error)
                }
              } catch (parseError) {
                console.error("Failed to parse SSE data:", line, parseError)
              }
            }
          }
        }
      } else {
        // Handle regular JSON response (fallback)
        const data = await response.json()

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: data.content, citations: data.citations }
              : msg,
          ),
        )

        const finalMessages = messagesWithPlaceholder.map((msg) => {
          const updated = msg.id === assistantMessageId
            ? { ...msg, content: data.content, citations: data.citations }
            : msg
          const { isThinking, ...cleaned } = updated
          return cleaned
        })
        localStorage.setItem(`messages_${conversationId}`, JSON.stringify(finalMessages))

        // Increment usage count
        const newUsageCount = usageCount + 1
        setUsageCount(newUsageCount)
        localStorage.setItem("usage_count", newUsageCount.toString())
      }
    } catch (error) {
      console.error("Error sending message:", error)
      const errorContent = error instanceof Error
        ? `Error: ${error.message}`
        : "Sorry, I encountered an error."

      const errorMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: errorContent,
      }
      setMessages((prev) => prev.map((msg) => (msg.id === assistantMessageId ? errorMessage : msg)))
    } finally {
      setIsLoading(false)
    }
  }

  // Welcome screen when no conversation is selected OR when conversation has no messages
  if (!conversationId || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0 relative">
        {/* Usage counter and theme toggle */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border border-primary/20 rounded-full">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span className="text-sm font-medium text-primary">{usageCount}/{maxUsage}</span>
          </div>
          <ThemeToggle />
        </div>

        {/* Welcome content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full space-y-8">
            <div className="text-center space-y-6">
              <h1 className="text-4xl font-bold tracking-tight">Welcome to Mind AI 2.0</h1>

              {/* Suggested prompts */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                {suggestedPrompts.map((prompt, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="rounded-full bg-white hover:bg-secondary/30 border-border hover:border-primary/30 transition-colors hover:text-primary"
                    onClick={() => {
                      if (!conversationId) {
                        onNewConversation()
                        setTimeout(() => setInput(prompt), 150)
                      } else {
                        setInput(prompt)
                      }
                    }}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>

            {/* Input area */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask MindAI anything marketing"
                  className="min-h-[60px] max-h-[200px] resize-none pr-14 rounded-xl"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 bottom-2 h-10 w-10 rounded-full"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Mind AI can make mistakes. Consider checking important information.
              </p>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Chat view with messages
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0 relative">
      {/* Usage counter and theme toggle */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border border-primary/20 rounded-full">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <span className="text-sm font-medium text-primary">{usageCount}/{maxUsage}</span>
        </div>
        <ThemeToggle />
      </div>

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
          <div className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask MindAI anything marketing"
              className="min-h-[60px] max-h-[200px] resize-none pr-14 rounded-xl"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading || usageCount >= maxUsage}
              className="absolute right-2 bottom-2 h-10 w-10 rounded-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Mind AI can make mistakes. Consider checking important information.
          </p>
        </form>
      </div>
    </div>
  )
}
