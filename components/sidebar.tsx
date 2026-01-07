"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Trash2, X, Search } from "lucide-react"
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
  // Group conversations by date
  const groupConversationsByDate = (conversations: Conversation[]) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const groups: { [key: string]: Conversation[] } = {
      Today: [],
      Yesterday: [],
      "Previous": [],
    }

    conversations.forEach((conv) => {
      const convDate = new Date(conv.createdAt)
      const isToday = convDate.toDateString() === today.toDateString()
      const isYesterday = convDate.toDateString() === yesterday.toDateString()

      if (isToday) {
        groups.Today.push(conv)
      } else if (isYesterday) {
        groups.Yesterday.push(conv)
      } else {
        groups.Previous.push(conv)
      }
    })

    return groups
  }

  const groupedConversations = groupConversationsByDate(conversations)

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 flex flex-col transition-transform lg:translate-x-0 h-full overflow-hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="p-3 border-b border-gray-200 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-700 hover:bg-gray-100 gap-2 group cursor-pointer"
            onClick={() => {
              onNewConversation()
              onClose()
            }}
          >
            <Plus className="h-4 w-4 group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium hover:text-primary transition-colors">New chat</span>
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-700 hover:bg-gray-100 group cursor-pointer"
            >
              <Search className="h-4 w-4 group-hover:text-primary transition-colors" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Conversations list */}
        <ScrollArea className="flex-1">
          <div className="space-y-4 py-4 px-3">
            {Object.entries(groupedConversations).map(([groupName, groupConvs]) => {
              if (groupConvs.length === 0) return null
              return (
                <div key={groupName} className="space-y-1">
                  <h3 className="px-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {groupName}
                  </h3>
                  <div className="space-y-0.5">
                    {groupConvs.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={cn(
                          "group flex items-center gap-2 px-2 py-2 rounded-lg transition-colors",
                          currentConversationId === conversation.id
                            ? "bg-gray-100"
                            : "hover:bg-gray-50"
                        )}
                      >
                        <button
                          onClick={() => {
                            onSelectConversation(conversation.id)
                            onClose()
                          }}
                          className="text-left text-sm text-gray-700 truncate overflow-hidden flex-1 min-w-0"
                        >
                          {conversation.name.length > 30 ? `${conversation.name.slice(0, 30)}...` : conversation.name}
                        </button>
                        <button
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded-md"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteConversation(conversation.id)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-gray-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </div>
    </>
  )
}
