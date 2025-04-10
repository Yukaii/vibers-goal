"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useTaskStore } from "@/lib/store"
import type { Priority } from "@/lib/types"
import { Mic, Send, Loader2, ArrowUpCircle, ArrowRightCircle, ArrowDownCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useVoiceInput } from "@/hooks/use-voice-input"

export function TaskInput() {
  const [taskText, setTaskText] = useState("")
  const [priority, setPriority] = useState<Priority>("medium")
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const micButtonRef = useRef<HTMLButtonElement>(null)
  const addTask = useTaskStore((state) => state.addTask)

  const { isListening, transcript, startListening, stopListening, isProcessing, isPushToTalk } = useVoiceInput()

  useEffect(() => {
    if (transcript) {
      setTaskText(transcript)
    }
  }, [transcript])

  const handleSubmit = () => {
    const text = taskText.trim()
    if (text) {
      // Add task but don't set it as active
      addTask(text, priority, false)
      setTaskText("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handlePrioritySelect = (value: Priority) => {
    setPriority(value)
    setOpen(false) // Close the popover after selection
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isPushToTalk && !isListening && !isProcessing) {
      e.preventDefault()
      startListening()
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isPushToTalk && isListening) {
      e.preventDefault()
      stopListening()
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isPushToTalk && !isListening && !isProcessing) {
      startListening()
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isPushToTalk && isListening) {
      stopListening()
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (!isPushToTalk) {
      e.preventDefault() // Prevent default click behavior for non-push-to-talk
    }
  }

  const priorityOptions: { value: Priority; label: string; color: string; icon: React.ReactNode }[] = [
    { value: "low", label: "Low", color: "bg-green-500", icon: <ArrowDownCircle className="h-4 w-4 text-green-500" /> },
    {
      value: "medium",
      label: "Medium",
      color: "bg-amber-500",
      icon: <ArrowRightCircle className="h-4 w-4 text-amber-500" />,
    },
    {
      value: "high",
      label: "High",
      color: "bg-destructive",
      icon: <ArrowUpCircle className="h-4 w-4 text-destructive" />,
    },
  ]

  const currentPriority = priorityOptions.find((p) => p.value === priority)

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            {currentPriority?.icon}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2">
          <div className="space-y-1">
            {priorityOptions.map((option) => (
              <button
                key={option.value}
                className={cn(
                  "w-full flex items-center px-2 py-1.5 rounded-md text-sm",
                  priority === option.value ? "bg-accent" : "hover:bg-muted",
                )}
                onClick={() => handlePrioritySelect(option.value)}
              >
                {option.icon}
                <span className="ml-2">{option.label}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex-1 relative">
        <Input
          ref={inputRef}
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a new task..."
          className="pr-16"
          disabled={isListening}
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <Button
            ref={micButtonRef}
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 transition-all",
              isListening && "bg-red-100 dark:bg-red-900 text-red-500",
              isPushToTalk && isListening && "scale-125",
            )}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onClick={handleClick}
            disabled={isProcessing}
            aria-label={isPushToTalk ? "Push to talk" : "Toggle microphone"}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mic className={cn("h-4 w-4", isListening && "text-red-500")} />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleSubmit}
            disabled={!taskText || isProcessing}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isPushToTalk && isListening && (
        <div className="fixed inset-x-0 top-4 flex justify-center z-50 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm border rounded-full px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping"></div>
                <div className="relative h-3 w-3 rounded-full bg-red-500"></div>
              </div>
              <span className="text-sm font-medium">Recording...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
