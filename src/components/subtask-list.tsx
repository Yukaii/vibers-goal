'use client';

import type React from 'react';
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { generateTaskBreakdown } from '@/lib/ai-service';
import { useSettingsStore } from '@/lib/settings-store'; // Added import
import { useTaskStore } from '@/lib/store';
import type { SubTask } from '@/lib/types';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'; // Reverted type imports for Sensors
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  CheckCircle2,
  Circle,
  Loader2,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

interface SubTaskItemProps {
  taskId: string;
  subTask: SubTask;
  onDelete: () => void;
  onToggle: () => void;
}

function SubTaskItem({
  taskId,
  subTask,
  onDelete,
  onToggle,
}: SubTaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(subTask.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateSubTask = useTaskStore((state) => state.updateSubTask);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: subTask.id,
    data: {
      type: 'subtask',
      subtask: subTask,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleStartEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditedTitle(subTask.title);
  };

  const handleSave = () => {
    if (editedTitle.trim()) {
      updateSubTask(taskId, {
        ...subTask,
        title: editedTitle.trim(),
      });
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 p-2 rounded-md hover:bg-accent/50 ${isDragging ? 'z-10' : ''}`}
    >
      <button type="button" onClick={onToggle} className="mt-0.5 flex-shrink-0">
        {subTask.completed ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {isEditing ? (
        <div className="flex-1 flex items-center gap-1">
          <Input
            ref={inputRef}
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleSave}
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsEditing(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <span
            className={`flex-1 text-left ${subTask.completed ? 'line-through text-muted-foreground' : ''}`}
            onClick={handleStartEditing}
            {...attributes}
            {...listeners}
          >
            {subTask.title}
          </span>

          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-50 hover:opacity-100"
              onClick={handleStartEditing}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-50 hover:opacity-100"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}
    </li>
  );
}

interface SubTaskListProps {
  taskId: string;
  subTasks: SubTask[];
}

// Define the handle type that will be exposed
export interface SubtaskListHandle {
  focusInput: () => void;
}

// Wrap component with forwardRef
export const SubTaskList = forwardRef<SubtaskListHandle, SubTaskListProps>(({ taskId, subTasks }, ref) => {
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const subtaskInputRef = useRef<HTMLInputElement>(null); // Ref for the input

  const addSubTask = useTaskStore((state) => state.addSubTask);
  const toggleSubTaskCompletion = useTaskStore(
    (state) => state.toggleSubTaskCompletion,
  );
  const deleteSubTask = useTaskStore((state) => state.deleteSubTask);
  const reorderSubTasks = useTaskStore((state) => state.reorderSubTasks);
  const task = useTaskStore((state) =>
    state.tasks.find((t) => t.id === taskId),
  );
  const openaiApiKey = useSettingsStore((state) => state.openaiApiKey); // Get API key

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Expose the focusInput method using useImperativeHandle
  useImperativeHandle(ref, () => ({
    focusInput: () => {
      window.setTimeout(() => {
        subtaskInputRef.current?.focus();
      }, 0);
    }
  }), []);

  const handleAddSubTask = () => {
    if (newSubTaskTitle.trim()) {
      addSubTask(taskId, newSubTaskTitle.trim());
      setNewSubTaskTitle('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubTask();
    } else if (e.key === 'Escape') {
      // Stop Escape from bubbling up and closing the TaskDetail modal
      e.stopPropagation();
      // Unfocus the input using the ref
      subtaskInputRef.current?.blur();
      // Optionally, clear the input on Escape:
      // setNewSubTaskTitle('');
    }
  };

  const handleGenerateBreakdown = async () => {
    if (!task) return;

    try {
      setIsGenerating(true);
      setError(null);

      if (!openaiApiKey) {
        setError('OpenAI API key not configured. Please set it in Settings.');
        setIsGenerating(false);
        return;
      }

      const subtasks = await generateTaskBreakdown(
        task.title,
        task.description,
        customPrompt,
        openaiApiKey,
      ); // Pass API key

      // Add each subtask to the task
      for (const subtask of subtasks) {
        addSubTask(taskId, subtask);
      }

      setCustomPrompt('');
      setIsAiOpen(false);
    } catch (err) {
      setError('Failed to generate task breakdown. Please try again.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    // Changed 'any' to 'DragEndEvent'
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Added check for 'over' existence
      const oldIndex = subTasks.findIndex((item) => item.id === active.id);
      const newIndex = subTasks.findIndex((item) => item.id === over.id);

      reorderSubTasks(taskId, oldIndex, newIndex);
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Input
          ref={subtaskInputRef} // Assign the ref to the input
          value={newSubTaskTitle}
          onChange={(e) => setNewSubTaskTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a subtask..."
          className="flex-1"
        />
        <Button onClick={handleAddSubTask} disabled={!newSubTaskTitle.trim()}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      <Collapsible open={isAiOpen} onOpenChange={setIsAiOpen} className="mb-4">
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>AI Task Breakdown</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-3 border rounded-md p-3">
          <div className="text-sm text-muted-foreground">
            Let AI help you break down this task into manageable subtasks.
          </div>

          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Add specific instructions for the AI (optional)"
            className="resize-none min-h-[80px]"
          />

          {error && <div className="text-sm text-destructive">{error}</div>}

          <Button
            onClick={handleGenerateBreakdown}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating subtasks...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate subtasks with AI
              </>
            )}
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {subTasks.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <p>No subtasks yet</p>
          <p className="text-sm">Break down your task into smaller steps</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={subTasks.map((st) => st.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {subTasks.map((subTask) => (
                <SubTaskItem
                  key={subTask.id}
                  taskId={taskId}
                  subTask={subTask}
                  onDelete={() => deleteSubTask(taskId, subTask.id)}
                  onToggle={() => toggleSubTaskCompletion(taskId, subTask.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
});

// Add display name for DevTools
SubTaskList.displayName = 'SubTaskList';
