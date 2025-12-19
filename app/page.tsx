"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { RightSidebar, type ChatModel, type Reranker } from "@/components/right-sidebar"
import { ChatView } from "@/components/chat-view"
import { Button } from "@/components/ui/button"
import { Menu, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Conversation {
  id: string
  name: string
  createdAt: Date
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false)
  const [temperature, setTemperature] = useState(0.7)
  const [systemPrompt, setSystemPrompt] = useState("")
  const [isLoadingInstructions, setIsLoadingInstructions] = useState(true)
  const [comparisonMode, setComparisonMode] = useState(false)
  const [model, setModel] = useState<ChatModel>("gpt-4o")
  const [reranker, setReranker] = useState<Reranker>("pinecone-rerank-v0")
  const { toast } = useToast()

  useEffect(() => {
    // Load conversations from localStorage
    const stored = localStorage.getItem("conversations")
    if (stored) {
      const parsed = JSON.parse(stored)
      setConversations(parsed.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt) })))
    }

    // Fetch assistant instructions from Pinecone API
    const fetchInstructions = async () => {
      try {
        setIsLoadingInstructions(true)
        const response = await fetch("/api/assistant")
        if (response.ok) {
          const data = await response.json()
          setSystemPrompt(data.instructions || "")
        }
      } catch (error) {
        console.error("Failed to fetch assistant instructions:", error)
      } finally {
        setIsLoadingInstructions(false)
      }
    }

    fetchInstructions()
  }, [])

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      name: "New Conversation",
      createdAt: new Date(),
    }

    const updated = [newConversation, ...conversations]
    setConversations(updated)
    setCurrentConversationId(newConversation.id)
    localStorage.setItem("conversations", JSON.stringify(updated))
  }

  const deleteConversation = (id: string) => {
    const updated = conversations.filter((c) => c.id !== id)
    setConversations(updated)
    localStorage.setItem("conversations", JSON.stringify(updated))

    if (currentConversationId === id) {
      setCurrentConversationId(null)
    }
  }

  const updateConversationName = (id: string, name: string) => {
    const updated = conversations.map((c) => (c.id === id ? { ...c, name } : c))
    setConversations(updated)
    localStorage.setItem("conversations", JSON.stringify(updated))
  }

  const handleUpdateInstructions = async () => {
    try {
      const response = await fetch("/api/assistant/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions: systemPrompt || "" }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to update instructions")
      }

      const data = await response.json()
      toast({
        title: "Success",
        description: systemPrompt.trim() === ""
          ? "Assistant instructions reset successfully"
          : "Assistant instructions updated successfully",
      })

      // Refresh instructions from API to ensure sync
      const fetchResponse = await fetch("/api/assistant")
      if (fetchResponse.ok) {
        const fetchData = await fetchResponse.json()
        setSystemPrompt(fetchData.instructions || "")
      }
    } catch (error) {
      console.error("Error updating instructions:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update assistant instructions",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile settings button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4 z-50 lg:hidden"
        onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
      >
        <Settings className="h-5 w-5" />
      </Button>

      {/* Left Sidebar */}
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={setCurrentConversationId}
        onNewConversation={createNewConversation}
        onDeleteConversation={deleteConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main chat view */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ChatView
          conversationId={currentConversationId}
          onUpdateConversationName={updateConversationName}
          onNewConversation={createNewConversation}
          temperature={temperature}
          comparisonMode={comparisonMode}
          model={model}
        />
      </div>

      {/* Right Sidebar */}
      <RightSidebar
        temperature={temperature}
        systemPrompt={systemPrompt}
        isLoadingInstructions={isLoadingInstructions}
        comparisonMode={comparisonMode}
        model={model}
        reranker={reranker}
        onTemperatureChange={setTemperature}
        onSystemPromptChange={setSystemPrompt}
        onComparisonModeChange={setComparisonMode}
        onModelChange={setModel}
        onRerankerChange={setReranker}
        onUpdateInstructions={handleUpdateInstructions}
        isOpen={rightSidebarOpen}
        onClose={() => setRightSidebarOpen(false)}
      />
    </div>
  )
}
