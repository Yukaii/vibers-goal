'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Import Select components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useTaskStore } from '@/lib/store';
import type { Priority } from '@/lib/types';
import {
  ArrowDownCircle,
  ArrowRightCircle,
  ArrowUpCircle,
  ChevronLeft,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ReminderSettings } from './reminder-settings';
import { SubTaskList } from './subtask-list';

interface TaskDetailProps {
  onClose: () => void;
}

export function TaskDetail({ onClose }: TaskDetailProps) {
  const activeTask = useTaskStore((state) => state.getActiveTask());
  const updateTask = useTaskStore((state) => state.updateTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);

  // Local state for inline editing
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentDescription, setCurrentDescription] = useState('');
  const [currentPriority, setCurrentPriority] = useState<Priority>('medium');

  // Sync local state when activeTask changes
  useEffect(() => {
    if (activeTask) {
      setCurrentTitle(activeTask.title);
      setCurrentDescription(activeTask.description || '');
      setCurrentPriority(activeTask.priority);
    }
  }, [activeTask]);

  if (!activeTask) return null;

  const handleTitleBlur = () => {
    const trimmedTitle = currentTitle.trim();
    if (trimmedTitle && trimmedTitle !== activeTask.title) {
      updateTask({ ...activeTask, title: trimmedTitle });
    } else if (!trimmedTitle) {
      // Revert if title is empty
      setCurrentTitle(activeTask.title);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
      e.currentTarget.blur(); // Remove focus
    } else if (e.key === 'Escape') {
      setCurrentTitle(activeTask.title); // Revert changes
      e.currentTarget.blur();
    }
  };

  const handleDescriptionBlur = () => {
    const trimmedDescription = currentDescription.trim();
    if (trimmedDescription !== (activeTask.description || '')) {
      updateTask({
        ...activeTask,
        description: trimmedDescription || undefined,
      });
    }
  };

  const handleDescriptionKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key === 'Escape') {
      setCurrentDescription(activeTask.description || ''); // Revert changes
      e.currentTarget.blur();
    }
    // Allow saving with Cmd/Ctrl + Enter if desired in the future
    // if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    //   handleDescriptionBlur();
    //   e.currentTarget.blur();
    // }
  };

  const handlePriorityChange = (newPriority: Priority) => {
    if (newPriority !== activeTask.priority) {
      setCurrentPriority(newPriority); // Update local state immediately for responsiveness
      updateTask({ ...activeTask, priority: newPriority });
    }
  };

  const handleDeleteTask = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(activeTask.id);
      onClose(); // Close detail view after deletion
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="font-medium">Task Details</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hidden md:flex"
        >
          <XCircle className="h-5 w-5" />
        </Button>
      </div>

      {/* Task Details Card */}
      <div className="p-4 border rounded-lg bg-card mb-4 space-y-4">
        {/* Title Input */}
        <div className="flex items-center justify-between">
          <Input
            value={currentTitle}
            onChange={(e) => setCurrentTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            placeholder="Task title"
            className="text-lg font-semibold border-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent flex-grow mr-2 p-1 h-auto rounded-sm" // Remove focus ring and outline
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDeleteTask}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Description Textarea */}
        <Textarea
          value={currentDescription}
          onChange={(e) => setCurrentDescription(e.target.value)}
          onBlur={handleDescriptionBlur}
          onKeyDown={handleDescriptionKeyDown}
          placeholder="Add a description..."
          className="resize-none min-h-[80px] text-sm border-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent p-1 rounded-sm" // Remove focus ring and outline
        />

        {/* Priority Select and Creation Date */}
        <div className="flex items-center justify-between text-sm">
          <Select value={currentPriority} onValueChange={handlePriorityChange}>
            {/* Make trigger look less like a button */}
            <SelectTrigger className="w-auto h-auto p-0 border-none focus:ring-0 focus:ring-offset-0 bg-transparent text-muted-foreground hover:text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="low">
                <div className="flex items-center gap-2">
                  <ArrowDownCircle className="h-4 w-4 text-green-500" /> Low
                  priority
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex items-center gap-2">
                  <ArrowRightCircle className="h-4 w-4 text-amber-500" /> Medium
                  priority
                </div>
              </SelectItem>
              <SelectItem value="high">
                <div className="flex items-center gap-2">
                  <ArrowUpCircle className="h-4 w-4 text-destructive" /> High
                  priority
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <span className="text-muted-foreground">
            Created {new Date(activeTask.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Tabs for Subtasks and Reminders */}
      <div className="flex-1 overflow-auto mt-4">
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
            <SubTaskList
              taskId={activeTask.id}
              subTasks={activeTask.subTasks}
            />
          </TabsContent>

          <TabsContent value="reminders" className="mt-0">
            <ReminderSettings
              taskId={activeTask.id}
              reminder={activeTask.reminder}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
