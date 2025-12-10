"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, MessageSquare, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Conversation {
  id: string
  name: string
  createdAt: Date
}

interface SidebarProps {
  conversations: Conversation[]
  currentConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isOpen,
  onClose,
}: SidebarProps) {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-40 w-72 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <h1 className="text-xl font-semibold text-sidebar-foreground">RAG Assistant</h1>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* New chat button */}
        <div className="p-4">
          <Button
            onClick={() => {
              onNewConversation()
              onClose()
            }}
            className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Conversations list */}
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 pb-4">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-sidebar-accent transition-colors",
                  currentConversationId === conversation.id && "bg-sidebar-accent",
                )}
              >
                <MessageSquare className="h-4 w-4 text-sidebar-foreground/60 flex-shrink-0" />
                <button
                  onClick={() => {
                    onSelectConversation(conversation.id)
                    onClose()
                  }}
                  className="flex-1 text-left text-sm text-sidebar-foreground truncate"
                >
                  {conversation.name}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteConversation(conversation.id)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </>
  )
}
