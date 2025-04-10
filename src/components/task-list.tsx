"use client"

import { useTaskStore } from "@/lib/store"
import type { Task } from "@/lib/types"
import { CheckCircle2, Circle, ArrowUpCircle, ArrowRightCircle, ArrowDownCircle, GripVertical } from "lucide-react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { CSS } from "@dnd-kit/utilities"

interface TaskItemProps {
  task: Task
  isActive: boolean
  onSelect: () => void
  onToggle: () => void
}

function TaskItem({ task, isActive, onSelect, onToggle }: TaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getPriorityIcon = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return <ArrowUpCircle className="h-4 w-4 text-destructive" />
      case "medium":
        return <ArrowRightCircle className="h-4 w-4 text-amber-500" />
      case "low":
        return <ArrowDownCircle className="h-4 w-4 text-green-500" />
    }
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      data-task-id={task.id}
      className={`
        p-3 border rounded-lg cursor-pointer transition-colors
        ${task.completed ? "bg-muted/50" : "bg-card hover:bg-accent/50"}
        ${isActive ? "ring-2 ring-primary border-transparent" : ""}
        ${isDragging ? "z-10" : ""}
      `}
      onClick={onSelect}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
          className="mt-0.5 flex-shrink-0"
        >
          {task.completed ? (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {getPriorityIcon(task.priority)}
            <span className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
              {task.title}
            </span>
          </div>

          {task.subTasks.length > 0 && (
            <div className="mt-1 text-xs text-muted-foreground">
              {task.subTasks.filter((st) => st.completed).length} of {task.subTasks.length} subtasks completed
            </div>
          )}
        </div>

        <div
          className="cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </li>
  )
}

interface TaskListProps {
  showCompleted: boolean
}

export function TaskList({ showCompleted }: TaskListProps) {
  const tasks = useTaskStore((state) => state.tasks)
  const activeTaskId = useTaskStore((state) => state.activeTaskId)
  const setActiveTaskId = useTaskStore((state) => state.setActiveTaskId)
  const toggleTaskCompletion = useTaskStore((state) => state.toggleTaskCompletion)
  const reorderTasks = useTaskStore((state) => state.reorderTasks)

  const filteredTasks = showCompleted ? tasks : tasks.filter((task) => !task.completed)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id)
      const newIndex = tasks.findIndex((task) => task.id === over.id)

      reorderTasks(oldIndex, newIndex)
    }
  }

  if (filteredTasks.length === 0) {
    return (
      <div className="p-8 border rounded-lg bg-muted/50 text-center">
        <p className="text-muted-foreground">{showCompleted ? "No tasks yet" : "No active tasks"}</p>
        <p className="text-sm text-muted-foreground mt-1">Add a task using the input below</p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isActive={activeTaskId === task.id}
              onSelect={() => setActiveTaskId(task.id)}
              onToggle={() => toggleTaskCompletion(task.id)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
