'use client';

import React, { useEffect, useRef, useState } from 'react'; // Add hooks back

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useVoiceInput } from '@/hooks/use-voice-input';
import { useTaskStore } from '@/lib/store';
import type { Priority } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  ArrowDownCircle,
  ArrowRightCircle,
  ArrowUpCircle,
  Loader2,
  Mic,
  Send,
} from 'lucide-react';
// useEffect, useRef, useState are now available via React import

// Define props if any are needed besides the ref (none currently)
// interface TaskInputProps {}

// Use forwardRef directly
export const TaskInput =
  React.forwardRef<HTMLInputElement /*, TaskInputProps*/>((props, ref) => {
    const [taskText, setTaskText] = useState('');
    const [priority, setPriority] = useState<Priority>('medium');
    const [open, setOpen] = useState(false);
    const [isComposing, setIsComposing] = useState(false); // Add composition state
    // Use the forwarded ref for the input element
    const micButtonRef = useRef<HTMLButtonElement>(null);
    const addTask = useTaskStore((state) => state.addTask);

    const {
      isListening,
      transcript,
      startListening,
      stopListening,
      isProcessing,
      isPushToTalk,
    } = useVoiceInput();

    useEffect(() => {
      if (transcript) {
        setTaskText(transcript);
      }
    }, [transcript]);

    const handleSubmit = () => {
      const text = taskText.trim();
      if (text) {
        // Add task but don't set it as active
        addTask(text, priority, false);
        setTaskText('');
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      // Prevent submission if IME composition is active
      if (e.key === 'Enter' && !isComposing) {
        e.preventDefault();
        handleSubmit();
      }
      // Note: Escape key is handled globally by useKeyboardCommands now,
      // unless we want specific behavior here like clearing the input.
    };

    const handleCompositionStart = () => {
      setIsComposing(true);
    };

    const handleCompositionEnd = () => {
      setIsComposing(false);
      // Optionally trigger submit if Enter was pressed during composition,
      // but usually better to require a separate Enter press after composition ends.
    };

    const handlePrioritySelect = (value: Priority) => {
      setPriority(value);
      setOpen(false); // Close the popover after selection
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      if (isPushToTalk && !isListening && !isProcessing) {
        e.preventDefault();
        startListening();
      }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
      if (isPushToTalk && isListening) {
        e.preventDefault();
        stopListening();
      }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      if (!isPushToTalk && !isListening && !isProcessing) {
        startListening();
      }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
      if (!isPushToTalk && isListening) {
        stopListening();
      }
    };

    const handleClick = (e: React.MouseEvent) => {
      if (!isPushToTalk) {
        e.preventDefault(); // Prevent default click behavior for non-push-to-talk
      }
    };

    const priorityOptions: {
      value: Priority;
      label: string;
      color: string;
      icon: React.ReactNode;
    }[] = [
      {
        value: 'low',
        label: 'Low',
        color: 'bg-green-500',
        icon: <ArrowDownCircle className="h-4 w-4 text-green-500" />,
      },
      {
        value: 'medium',
        label: 'Medium',
        color: 'bg-amber-500',
        icon: <ArrowRightCircle className="h-4 w-4 text-amber-500" />,
      },
      {
        value: 'high',
        label: 'High',
        color: 'bg-destructive',
        icon: <ArrowUpCircle className="h-4 w-4 text-destructive" />,
      },
    ];

    const currentPriority = priorityOptions.find((p) => p.value === priority);

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
                  type="button"
                  key={option.value}
                  className={cn(
                    'w-full flex items-center px-2 py-1.5 rounded-md text-sm',
                    priority === option.value ? 'bg-accent' : 'hover:bg-muted',
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
            ref={ref}
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart} // Add handler
            onCompositionEnd={handleCompositionEnd} // Add handler
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
                'h-8 w-8 transition-all',
                isListening && 'bg-red-100 dark:bg-red-900 text-red-500',
                isPushToTalk && isListening && 'scale-125',
              )}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onClick={handleClick}
              disabled={isProcessing}
              aria-label={isPushToTalk ? 'Push to talk' : 'Toggle microphone'}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mic className={cn('h-4 w-4', isListening && 'text-red-500')} />
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
                  <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                  <div className="relative h-3 w-3 rounded-full bg-red-500" />
                </div>
                <span className="text-sm font-medium">Recording...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  });

TaskInput.displayName = 'TaskInput'; // Add display name for DevTools
