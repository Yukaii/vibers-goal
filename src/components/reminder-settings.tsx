"use client"

import { useState, useEffect } from "react"
import { useTaskStore } from "@/lib/store"
import type { Reminder, ReminderFrequency, ReminderType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Bell, BellOff, Calendar, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReminderSettingsProps {
  taskId: string
  reminder?: Reminder
}

export function ReminderSettings({ taskId, reminder }: ReminderSettingsProps) {
  const { toast } = useToast()
  const [reminderType, setReminderType] = useState<ReminderType>(reminder?.type || "once")
  const [date, setDate] = useState(reminder?.date || new Date().toISOString().split("T")[0])
  const [time, setTime] = useState(reminder?.time || "09:00")
  const [frequency, setFrequency] = useState<ReminderFrequency>(reminder?.frequency || "daily")
  const [enabled, setEnabled] = useState(reminder?.enabled || false)

  const updateTask = useTaskStore((state) => state.updateTask)
  const task = useTaskStore((state) => state.tasks.find((t) => t.id === taskId))

  useEffect(() => {
    if (reminder) {
      setReminderType(reminder.type || "once")
      setDate(reminder.date || new Date().toISOString().split("T")[0])
      setTime(reminder.time)
      setFrequency(reminder.frequency || "daily")
      setEnabled(reminder.enabled)
    }
  }, [reminder])

  const handleSaveReminder = () => {
    if (!task) return

    const newReminder: Reminder = {
      type: reminderType,
      time,
      enabled,
    }

    if (reminderType === "once") {
      newReminder.date = date
    } else {
      newReminder.frequency = frequency
    }

    updateTask({
      ...task,
      reminder: newReminder,
    })

    toast({
      title: "Reminder set",
      description:
        reminderType === "once"
          ? `Reminder set for ${new Date(date).toLocaleDateString()} at ${time}`
          : `Recurring reminder set for ${frequency} at ${time}`,
    })
  }

  const frequencyOptions: { value: ReminderFrequency; label: string }[] = [
    { value: "hourly", label: "Hourly" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {enabled ? <Bell className="h-5 w-5 text-primary" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
          <span className="font-medium">Reminder</span>
        </div>

        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      <RadioGroup
        value={reminderType}
        onValueChange={(value) => setReminderType(value as ReminderType)}
        className="flex flex-col space-y-2"
        disabled={!enabled}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="once" id="once" />
          <Label htmlFor="once" className="cursor-pointer">
            Specific date
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="recurring" id="recurring" />
          <Label htmlFor="recurring" className="cursor-pointer">
            Recurring
          </Label>
        </div>
      </RadioGroup>

      {reminderType === "once" ? (
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1">
            <Calendar className="h-4 w-4" /> Date
          </label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={!enabled}
            min={new Date().toISOString().split("T")[0]}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-sm font-medium">Frequency</label>
          <Select
            value={frequency}
            onValueChange={(value) => setFrequency(value as ReminderFrequency)}
            disabled={!enabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {frequencyOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1">
          <Clock className="h-4 w-4" /> Time
        </label>
        <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={!enabled} />
      </div>

      <Button onClick={handleSaveReminder} disabled={!enabled} className="w-full">
        Save reminder
      </Button>

      {enabled && (
        <p className="text-sm text-muted-foreground">
          Reminders will appear as browser notifications when the app is open.
        </p>
      )}
    </div>
  )
}
