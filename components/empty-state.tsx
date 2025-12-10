"use client"

import { Button } from "@/components/ui/button"
import { Sparkles, FileText, MessageSquare, Zap } from "lucide-react"

interface EmptyStateProps {
  onNewConversation: () => void
}

export function EmptyState({ onNewConversation }: EmptyStateProps) {
  const examples = [
    "What are the key features of our product?",
    "Explain the pricing structure",
    "How do I get started?",
    "What integrations are available?",
  ]

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-balance">RAG Assistant</h1>
          <p className="text-lg text-muted-foreground text-balance">
            Ask questions about your documents and get AI-powered answers with cited sources
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-border bg-card space-y-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-medium text-sm">Document Knowledge</h3>
            <p className="text-xs text-muted-foreground">Query your uploaded documents with natural language</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card space-y-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h3 className="font-medium text-sm">Follow-up Questions</h3>
            <p className="text-xs text-muted-foreground">Have natural conversations with context awareness</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card space-y-2">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="font-medium text-sm">Cited Sources</h3>
            <p className="text-xs text-muted-foreground">See exactly where information comes from</p>
          </div>
        </div>

        {/* Example questions */}
        {/* <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Try asking:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {examples.map((example, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="justify-start h-auto py-3 px-4 text-left bg-transparent"
                onClick={onNewConversation}
              >
                <span className="text-sm text-muted-foreground">{example}</span>
              </Button>
            ))}
          </div>
        </div> */}

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" onClick={onNewConversation} className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Start New Conversation
          </Button>
        </div>
      </div>
    </div>
  )
}
