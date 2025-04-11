'use client';

import type React from 'react'; // Change back to type import
import { useEffect, useRef } from 'react'; // Explicitly import hooks
import { useTaskStore } from '@/lib/store';
import type { Task } from '@/lib/types';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowDownCircle,
  ArrowRightCircle,
  ArrowUpCircle,
  CheckCircle2,
  Circle,
  GripVertical,
} from 'lucide-react';

interface TaskItemProps {
  task: Task;
  isActive: boolean;
  onSelect: () => void;
  onToggle: () => void;
  isFocused: boolean; // Add isFocused prop
}

function TaskItem({ task, isActive, onSelect, onToggle, isFocused }: TaskItemProps) {
  const itemRef = useRef<HTMLLIElement>(null); // Ref for scrolling - Remove React. prefix
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Scroll into view when focused
  useEffect(() => { // Remove React. prefix
    if (isFocused && itemRef.current) {
      itemRef.current.scrollIntoView({
        behavior: 'smooth', // Optional: smooth scrolling
        block: 'nearest',   // Adjust as needed ('start', 'center', 'end')
      });
    }
  }, [isFocused]);

  // Combine refs for dnd-kit and scrolling
  const combinedRef = (node: HTMLLIElement | null) => {
    setNodeRef(node);
    itemRef.current = node;
  };

  const getPriorityIcon = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return <ArrowUpCircle className="h-4 w-4 text-destructive" />;
      case 'medium':
        return <ArrowRightCircle className="h-4 w-4 text-amber-500" />;
      case 'low':
        return <ArrowDownCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLLIElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      onSelect();
    }
  };

  return (
    <li
      ref={combinedRef} // Use combined ref
      style={style}
      data-task-id={task.id}
      className={`
        p-3 border rounded-lg cursor-pointer transition-all duration-100 ease-in-out
        ${task.completed ? 'bg-muted/50' : 'bg-card hover:bg-accent/50'}
        ${isActive ? 'ring-2 ring-primary border-transparent' : ''}
        ${isFocused ? 'ring-2 ring-accent-foreground border-transparent outline-none' : ''} // Add focus style
        ${isDragging ? 'z-10 shadow-lg' : ''}
      `}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
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
            <span
              className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}
            >
              {task.title}
            </span>
          </div>

          {task.subTasks.length > 0 && (
            <div className="mt-1 text-xs text-muted-foreground">
              {task.subTasks.filter((st) => st.completed).length} of{' '}
              {task.subTasks.length} subtasks completed
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
  );
}

interface TaskListProps {
  tasks: Task[]; // Receive tasks as prop
  showCompleted: boolean;
  focusedIndex: number | null; // Receive focused index
}

export function TaskList({ tasks, showCompleted, focusedIndex }: TaskListProps) {
  // Remove internal task fetching: const tasks = useTaskStore((state) => state.tasks);
  const activeTaskId = useTaskStore((state) => state.activeTaskId);
  const setActiveTaskId = useTaskStore((state) => state.setActiveTaskId);
  const toggleTaskCompletion = useTaskStore(
    (state) => state.toggleTaskCompletion,
  );
  const reorderTasks = useTaskStore((state) => state.reorderTasks);
  const allTasks = useTaskStore((state) => state.tasks); // Still need all tasks for reordering logic

  // Use the passed 'tasks' prop which is already filtered in TaskDashboard
  const filteredTasks = tasks;

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Add null check for 'over' which might be null if dropped outside a droppable area
    if (over && active.id !== over.id) {
      // Use allTasks for finding original indices
      const oldIndex = allTasks.findIndex((task) => task.id === active.id);
      const newIndex = allTasks.findIndex((task) => task.id === over.id);

      // Ensure indices are valid before reordering
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderTasks(oldIndex, newIndex);
      }
    }
  };

  if (filteredTasks.length === 0) {
    return (
      <div className="p-8 border rounded-lg bg-muted/50 text-center">
        <p className="text-muted-foreground">
          {showCompleted ? 'No tasks yet' : 'No active tasks'}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Add a task using the input below
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-2">
          {filteredTasks.map((task, index) => ( // Add index here
            <TaskItem
              key={task.id}
              task={task}
              isFocused={focusedIndex === index} // Calculate isFocused
              isActive={activeTaskId === task.id}
              onSelect={() => setActiveTaskId(task.id)}
              onToggle={() => toggleTaskCompletion(task.id)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
