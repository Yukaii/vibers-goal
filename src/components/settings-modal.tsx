"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSettingsStore } from "@/lib/settings-store"
import { useToast } from "@/components/ui/use-toast"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { openaiApiKey, setOpenaiApiKey } = useSettingsStore()
  const [apiKeyInput, setApiKeyInput] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      setApiKeyInput(openaiApiKey || "")
    }
  }, [isOpen, openaiApiKey])

  const handleSave = () => {
    setOpenaiApiKey(apiKeyInput.trim() || null)
    toast({
      title: "Settings Saved",
      description: "Your OpenAI API key has been updated.",
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="openai-api-key" className="text-right col-span-1">
              OpenAI Key
            </Label>
            <Input
              id="openai-api-key"
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Enter your OpenAI API key"
              className="col-span-3"
            />
          </div>
          <p className="text-xs text-muted-foreground px-1">
            Your API key is stored locally in your browser and never sent to our servers except when making requests directly to OpenAI.
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
