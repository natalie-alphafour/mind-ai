"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { ChatView } from "@/components/chat-view"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

interface Conversation {
  id: string
  name: string
  createdAt: Date
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Load conversations from localStorage
    const stored = localStorage.getItem("conversations")
    if (stored) {
      const parsed = JSON.parse(stored)
      setConversations(parsed.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt) })))
    }
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

      {/* Sidebar */}
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
        />
      </div>
    </div>
  )
}
