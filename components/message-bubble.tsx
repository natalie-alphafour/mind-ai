"use client"

import { User, Sparkles, ExternalLink } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Citation {
  file_name: string
  score: number
  file_id: string
  pages?: number[]
  number: number
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  citations?: Citation[]
  isThinking?: boolean
}

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  // Function to render message content with styled citation numbers
  const renderContent = (content: string) => {
    // Replace [1], [2], etc. with styled spans
    const parts = content.split(/(\[\d+\])/)
    return parts.map((part, index) => {
      if (part.match(/\[\d+\]/)) {
        return (
          <sup
            key={index}
            className="text-xs font-semibold text-primary mx-0.5 cursor-pointer hover:underline"
          >
            {part}
          </sup>
        )
      }
      return part
    })
  }

  if (message.role === "user") {
    return (
      <div className="flex items-start gap-3 justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex-1 max-w-[80%]">
          <Card className="p-4 bg-primary text-primary-foreground">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </Card>
        </div>
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4" />
        </div>
      </div>
    )
  }

  // Check if message is currently streaming (empty citations and possibly incomplete content)
  const isStreaming = message.role === "assistant" && message.content && !message.citations?.length
  const isThinking = message.isThinking === true

  return (
    <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
        <Sparkles 
          className={`h-4 w-4 text-primary-foreground ${isStreaming && !isThinking ? "animate-pulse" : ""}`}
          style={isThinking ? {
            animation: "thinking-sparkle 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite"
          } : undefined}
        />
      </div>
      <div className="flex-1 space-y-3">
        <Card className="p-4 bg-card relative overflow-hidden">
          {isThinking ? (
            <div className="relative">
              {/* Shimmer effect */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-white/5"
                style={{
                  animation: "thinking-shimmer 3s cubic-bezier(0.4, 0, 0.2, 1) infinite"
                }}
              />
              
              <div className="flex items-center gap-3 text-muted-foreground relative z-10">
                <span 
                  className="text-sm font-medium"
                  style={{
                    animation: "thinking-pulse 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite"
                  }}
                >
                  Thinking
                </span>
                <div className="flex gap-1.5 items-center">
                  <span 
                    className="inline-block w-2 h-2 rounded-full bg-current relative" 
                    style={{ 
                      animation: "thinking-typewriter 0.9s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                      animationDelay: "0ms"
                    }} 
                  />
                  <span 
                    className="inline-block w-2 h-2 rounded-full bg-current relative" 
                    style={{ 
                      animation: "thinking-typewriter 0.9s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                      animationDelay: "0.08s"
                    }} 
                  />
                  <span 
                    className="inline-block w-2 h-2 rounded-full bg-current relative" 
                    style={{ 
                      animation: "thinking-typewriter 0.9s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                      animationDelay: "0.16s"
                    }} 
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm leading-relaxed whitespace-pre-wrap text-card-foreground">
              {renderContent(message.content)}
              {isStreaming && (
                <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse rounded-sm" />
              )}
            </div>
          )}
        </Card>

        {message.citations && message.citations.length > 0 && (
          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
            <p className="text-xs font-medium text-muted-foreground">Sources:</p>
            <div className="flex flex-wrap gap-2">
              {message.citations.map((citation, idx) => {
                const pageInfo =
                  citation.pages && citation.pages.length > 0
                    ? citation.pages.length === 1
                      ? `p. ${citation.pages[0]}`
                      : `pp. ${citation.pages.join(", ")}`
                    : null

                return (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="gap-1.5 cursor-pointer hover:bg-secondary/80 transition-all duration-200 hover:scale-105 animate-in fade-in zoom-in-95"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <span className="text-xs font-semibold">[{citation.number}]</span>
                    <ExternalLink className="h-3 w-3" />
                    <span className="text-xs">{citation.file_name}</span>
                    {pageInfo && <span className="text-xs text-muted-foreground">({pageInfo})</span>}
                  </Badge>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
