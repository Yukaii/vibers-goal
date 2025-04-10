"use client"

import type React from "react"

import { useState } from "react"
import { useTaskStore } from "@/lib/store"
import type { Priority } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SubTaskList } from "./subtask-list"
import { ReminderSettings } from "./reminder-settings"
import {
  ArrowUpCircle,
  ArrowRightCircle,
  ArrowDownCircle,
  Check,
  Trash2,
  X,
  ChevronLeft,
  XCircle,
  Info,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface TaskDetailProps {
  onClose: () => void
}

export function TaskDetail({ onClose }: TaskDetailProps) {
  const activeTask = useTaskStore((state) => state.getActiveTask())
  const updateTask = useTaskStore((state) => state.updateTask)
  const deleteTask = useTaskStore((state) => state.deleteTask)

  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [editedDescription, setEditedDescription] = useState("")
  const [editedPriority, setEditedPriority] = useState<Priority>("medium")
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false)

  if (!activeTask) return null

  const handleStartEditing = () => {
    setEditedTitle(activeTask.title)
    setEditedDescription(activeTask.description || "")
    setEditedPriority(activeTask.priority)
    setIsEditing(true)
  }

  const handleSaveEdits = () => {
    if (editedTitle.trim()) {
      updateTask({
        ...activeTask,
        title: editedTitle.trim(),
        description: editedDescription.trim() || undefined,
        priority: editedPriority,
      })
      setIsEditing(false)
    }
  }

  const handleCancelEditing = () => {
    setIsEditing(false)
  }

  const handleDeleteTask = () => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTask(activeTask.id)
    }
  }

  const getPriorityButton = (priority: Priority, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      className={`
        flex items-center gap-1 px-3 py-1.5 rounded-md text-sm
        ${editedPriority === priority ? "bg-accent" : "hover:bg-muted"}
      `}
      onClick={() => setEditedPriority(priority)}
    >
      {icon}
      <span>{label}</span>
    </button>
  )

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="font-medium">Task Details</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="hidden md:flex">
          <XCircle className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4 border rounded-lg bg-card mb-4">
        {isEditing ? (
          <div className="space-y-4">
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              placeholder="Task title"
              className="text-lg font-medium"
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Description (supports markdown)</label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setShowMarkdownHelp(!showMarkdownHelp)}
                >
                  <Info className="h-3 w-3 mr-1" />
                  Markdown Help
                </Button>
              </div>

              {showMarkdownHelp && (
                <div className="text-xs p-2 bg-muted rounded-md mb-2">
                  <p className="font-medium mb-1">Markdown Syntax:</p>
                  <ul className="space-y-1 list-disc pl-4">
                    <li>
                      <code># Heading 1</code>
                    </li>
                    <li>
                      <code>## Heading 2</code>
                    </li>
                    <li>
                      <code>**bold**</code>
                    </li>
                    <li>
                      <code>*italic*</code>
                    </li>
                    <li>
                      <code>- list item</code>
                    </li>
                    <li>
                      <code>1. numbered item</code>
                    </li>
                    <li>
                      <code>[link](url)</code>
                    </li>
                    <li>
                      <code>![image](url)</code>
                    </li>
                    <li>
                      <code>```code block```</code>
                    </li>
                  </ul>
                </div>
              )}

              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Add a description (optional, supports markdown)"
                className="resize-none min-h-[100px] font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <div className="flex flex-wrap gap-2">
                {getPriorityButton("low", "Low", <ArrowDownCircle className="h-4 w-4 text-green-500" />)}
                {getPriorityButton("medium", "Medium", <ArrowRightCircle className="h-4 w-4 text-amber-500" />)}
                {getPriorityButton("high", "High", <ArrowUpCircle className="h-4 w-4 text-destructive" />)}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleCancelEditing}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSaveEdits}>
                <Check className="h-4 w-4 mr-1" /> Save
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-semibold">{activeTask.title}</h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleStartEditing}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDeleteTask}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>

            {activeTask.description ? (
              <div className="mt-2 text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeTask.description}</ReactMarkdown>
              </div>
            ) : (
              <p className="mt-2 text-muted-foreground italic text-sm">No description. Click Edit to add one.</p>
            )}

            <div className="mt-4 flex items-center gap-2">
              <div className="flex items-center">
                {activeTask.priority === "high" && <ArrowUpCircle className="h-4 w-4 text-destructive mr-1" />}
                {activeTask.priority === "medium" && <ArrowRightCircle className="h-4 w-4 text-amber-500 mr-1" />}
                {activeTask.priority === "low" && <ArrowDownCircle className="h-4 w-4 text-green-500 mr-1" />}
                <span className="text-sm">
                  {activeTask.priority.charAt(0).toUpperCase() + activeTask.priority.slice(1)} priority
                </span>
              </div>

              <span className="text-muted-foreground text-sm">•</span>

              <span className="text-sm text-muted-foreground">
                Created {new Date(activeTask.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="subtasks">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="subtasks" className="flex-1">
              Subtasks
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex-1">
              Reminders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subtasks" className="mt-0">
            <SubTaskList taskId={activeTask.id} subTasks={activeTask.subTasks} />
          </TabsContent>

          <TabsContent value="reminders" className="mt-0">
            <ReminderSettings taskId={activeTask.id} reminder={activeTask.reminder} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
