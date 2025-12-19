"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Zap } from "lucide-react"

interface Citation {
  file_name: string
  score: number
  file_id: string
  pages?: number[]
  number: number
}

interface ComparisonMessage {
  id: string
  role: "user" | "assistant"
  ragContent?: string
  gptContent?: string
  citations?: Citation[]
  isThinking?: boolean
}

interface ComparisonMessageBubbleProps {
  message: ComparisonMessage
}

export function ComparisonMessageBubble({ message }: ComparisonMessageBubbleProps) {
  // Function to render content with styled citation numbers
  const renderContent = (content: string) => {
    // Replace [1], [2], etc. with styled spans
    const parts = content.split(/(\[\d+\])/)
    return parts.map((part, index) => {
      if (part.match(/\[\d+\]/)) {
        return (
          <sup key={index} className="text-xs font-semibold text-primary mx-0.5 cursor-pointer hover:underline">
            {part}
          </sup>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  if (message.role === "user") {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3 max-w-[80%]">
          <p className="text-sm whitespace-pre-wrap">{message.ragContent}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* RAG Assistant Response */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-primary-foreground" />
              </div>
              RAG Assistant
              <Badge variant="secondary" className="ml-auto text-xs">
                Pinecone
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {message.isThinking && !message.ragContent ? (
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
                {renderContent(message.ragContent || "")}
              </div>
            )}

            {/* Citations */}
            {message.citations && message.citations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Sources:</p>
                <div className="space-y-1.5">
                  {message.citations.map((citation, idx) => (
                    <div key={`citation-${citation.number}-${idx}`} className="flex items-start gap-2 text-xs">
                      <Badge variant="outline" className="text-xs">
                        {citation.number}
                      </Badge>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{citation.file_name}</p>
                        {citation.pages && citation.pages.length > 0 && (
                          <p className="text-muted-foreground">Pages: {citation.pages.join(", ")}</p>
                        )}
                        <p className="text-muted-foreground">Relevance: {(citation.score * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* GPT-5 Response */}
        <Card className="border-2 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-green-600 flex items-center justify-center">
                <Zap className="h-3 w-3 text-white" />
              </div>
              GPT-5
              <Badge variant="secondary" className="ml-auto text-xs">
                OpenAI
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {message.isThinking && !message.gptContent ? (
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
                {message.gptContent || ""}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
