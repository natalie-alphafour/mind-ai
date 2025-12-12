"use client"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, X, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export type ChatModel = 
  | "gpt-4o"
  | "gpt-4.1"
  | "o4-mini"
  | "claude-3-5-sonnet"
  | "claude-3-7-sonnet"
  | "gemini-2.5-pro"

interface RightSidebarProps {
  temperature: number
  systemPrompt: string
  comparisonMode: boolean
  model: ChatModel
  onTemperatureChange: (value: number) => void
  onSystemPromptChange: (value: string) => void
  onComparisonModeChange: (value: boolean) => void
  onModelChange: (value: ChatModel) => void
  onUpdateInstructions: () => void
  isOpen: boolean
  onClose: () => void
}

const CHAT_MODELS: Array<{ value: ChatModel; label: string; provider: string; apiValue: string }> = [
  { value: "gpt-4o", label: "GPT-4o", provider: "OpenAI", apiValue: "gpt-4o" },
  { value: "gpt-4.1", label: "GPT-4.1", provider: "OpenAI", apiValue: "gpt-4.1" },
  { value: "o4-mini", label: "o4-mini", provider: "OpenAI", apiValue: "o4-mini" },
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet", provider: "Anthropic", apiValue: "claude-3-5-sonnet" },
  { value: "claude-3-7-sonnet", label: "Claude 3.7 Sonnet", provider: "Anthropic", apiValue: "claude-3-7-sonnet" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "Google", apiValue: "gemini-2.5-pro" },
]

// Helper function to get API value from model
export function getModelApiValue(model: ChatModel): string {
  const modelConfig = CHAT_MODELS.find((m) => m.value === model)
  return modelConfig?.apiValue || model
}

export function RightSidebar({
  temperature,
  systemPrompt,
  comparisonMode,
  model,
  onTemperatureChange,
  onSystemPromptChange,
  onComparisonModeChange,
  onModelChange,
  onUpdateInstructions,
  isOpen,
  onClose,
}: RightSidebarProps) {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:relative inset-y-0 right-0 z-40 w-80 bg-sidebar border-l border-sidebar-border flex flex-col h-full overflow-hidden",
          // On mobile: slide in/out based on isOpen state
          "transition-transform lg:transition-none",
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-sidebar-foreground" />
            <h2 className="text-lg font-semibold text-sidebar-foreground">Settings</h2>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Chat Model Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="chatModel" className="text-sm font-medium text-white">
                Chat Model
              </Label>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <Select value={model} onValueChange={onModelChange}>
              <SelectTrigger id="chatModel" className="w-full text-white data-[placeholder]:text-white">
                <SelectValue className="text-white">
                  {CHAT_MODELS.find((m) => m.value === model)?.label || model}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-sidebar border-sidebar-border">
                {CHAT_MODELS.map((modelOption) => (
                  <SelectItem 
                    key={modelOption.value} 
                    value={modelOption.value} 
                    className="text-sidebar-foreground data-[highlighted]:bg-sidebar-accent data-[highlighted]:text-sidebar-foreground [&_svg]:text-sidebar-foreground"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{modelOption.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">({modelOption.provider})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select the AI model to use for conversations. This applies to both regular and comparison modes.
            </p>
          </div>

          <div className="border-t border-sidebar-border" />

          {/* Temperature Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature" className="text-sm font-medium text-white">
                Temperature
              </Label>
              <span className="text-sm text-muted-foreground font-mono">{temperature.toFixed(1)}</span>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.1}
              value={[temperature]}
              onValueChange={(values) => onTemperatureChange(values[0])}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Controls response randomness. Lower values (0-0.5) are more focused and deterministic, higher values
              (1-2) are more creative and varied.
            </p>
          </div>

          <div className="border-t border-sidebar-border" />

          {/* System Prompt */}
          <div className="space-y-3">
            <Label htmlFor="systemPrompt" className="text-sm font-medium text-white">
              System Instructions
            </Label>
            <Textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => onSystemPromptChange(e.target.value)}
              placeholder="Enter custom instructions for the assistant..."
              className="min-h-[200px] text-sm resize-none font-mono text-white"
            />
            <Button onClick={onUpdateInstructions} className="w-full">
              Update Instructions
            </Button>
            <p className="text-xs text-muted-foreground">
              These instructions will guide the assistant's behavior and responses for all future messages.
            </p>
          </div>

          <div className="border-t border-sidebar-border" />

          {/* Comparison Mode */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="comparisonMode" className="text-sm font-medium">
                  Comparison Mode
                </Label>
                <p className="text-xs text-muted-foreground">Compare RAG Assistant with GPT-5</p>
              </div>
              <Switch id="comparisonMode" checked={comparisonMode} onCheckedChange={onComparisonModeChange} />
            </div>
            <p className="text-xs text-muted-foreground">
              When enabled, responses from both RAG Assistant and GPT-5 will be displayed side-by-side for
              comparison.
            </p>
          </div>

          <div className="border-t border-sidebar-border" />

          {/* Placeholder for future settings */}
          <div className="space-y-3 opacity-50">
            <Label className="text-sm font-medium">Additional Settings</Label>
            <p className="text-xs text-muted-foreground">More configuration options coming soon...</p>
          </div>
        </div>
      </div>
    </>
  )
}
