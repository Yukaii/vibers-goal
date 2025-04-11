'use client';

import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { useKeyboardCommands } from '@/hooks/use-keyboard-commands';
import { Command } from '@/hooks/use-keyboard-commands'; // Import Command enum
import { useTaskStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { ArrowDown, EyeIcon, EyeOffIcon, SettingsIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CommandPalette } from './command-palette'; // Import CommandPalette
import { KeyboardHelpModal } from './keyboard-help-modal';
import { SettingsModal } from './settings-modal';
import type { SubtaskListHandle } from './subtask-list';
import { TaskDetail } from './task-detail';
import { TaskInput } from './task-input';
import { TaskList } from './task-list';
import { ThemeToggle } from './theme-toggle';

export function TaskDashboard() {
  const [showCompleted, setShowCompleted] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false); // State for command palette
  const [focusedTaskIndex, setFocusedTaskIndex] = useState<number | null>(null);
  const activeTaskId = useTaskStore((state) => state.activeTaskId);
  const tasks = useTaskStore((state) => state.tasks); // Assuming tasks are ordered as displayed
  const setActiveTaskId = useTaskStore((state) => state.setActiveTaskId);

  const taskInputRef = useRef<HTMLInputElement>(null);
  const taskListRef = useRef<HTMLDivElement>(null);
  const subtaskListHandleRef = useRef<SubtaskListHandle>(null); // Ref for SubtaskList handle

  // Filter tasks based on showCompleted for accurate indexing
  const visibleTasks = tasks.filter((task) => showCompleted || !task.completed);

  // Check if this is the first visit
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
    if (!hasVisitedBefore && tasks.length === 0) {
      setIsFirstVisit(true);
      localStorage.setItem('hasVisitedBefore', 'true');
    }
  }, [tasks.length]);

  // --- Keyboard Command Actions ---

  const handleNavigateList = useCallback(
    (direction: 'up' | 'down') => {
      setFocusedTaskIndex((prevIndex) => {
        const maxIndex = visibleTasks.length - 1;
        if (maxIndex < 0) return null; // No tasks to navigate

        let nextIndex: number | null;

        if (prevIndex === null) {
          // If nothing is focused, start from top (down) or bottom (up)
          nextIndex = direction === 'down' ? 0 : maxIndex;
        } else {
          nextIndex = direction === 'down' ? prevIndex + 1 : prevIndex - 1;
        }

        // Clamp index within bounds
        if (nextIndex < 0) nextIndex = 0; // Optionally wrap: maxIndex;
        if (nextIndex > maxIndex) nextIndex = maxIndex; // Optionally wrap: 0;

        // TODO: Scroll the focused item into view within TaskList
        // This might require passing the ref and index to TaskList
        // or having TaskList manage scrolling internally based on focusedIndex prop.

        return nextIndex;
      });
    },
    [visibleTasks.length],
  );

  const handleOpenDetail = useCallback(() => {
    if (focusedTaskIndex !== null && visibleTasks[focusedTaskIndex]) {
      setActiveTaskId(visibleTasks[focusedTaskIndex].id);
      setFocusedTaskIndex(null); // Clear list focus when detail opens
    }
  }, [focusedTaskIndex, visibleTasks, setActiveTaskId]);

  const handleCloseDetail = useCallback(() => {
    // Find the index of the previously active task to restore focus
    const previouslyFocusedIndex = visibleTasks.findIndex(
      (task) => task.id === activeTaskId,
    );
    setActiveTaskId(null);
    // Restore focus to the list item if found, otherwise clear focus
    setFocusedTaskIndex(
      previouslyFocusedIndex !== -1 ? previouslyFocusedIndex : null,
    );
  }, [activeTaskId, setActiveTaskId, visibleTasks]);

  const handleFocusNewTask = useCallback(() => {
    taskInputRef.current?.focus();
    setFocusedTaskIndex(null); // Clear list focus when input gets focus
  }, []);

  const handleToggleHelpModal = useCallback(() => {
    setIsHelpModalOpen((prev) => !prev);
  }, []);

  const handleFocusSubtaskInput = useCallback(() => {
    // Call the focusInput method exposed by SubtaskList via the ref handle
    subtaskListHandleRef.current?.focusInput();
  }, []);

  // --- Command Palette Handler ---
  const handleSelectCommand = useCallback(
    (command: Command) => {
      // Map command enum to the corresponding action handler
      switch (command) {
        case Command.FOCUS_NEW_TASK:
          handleFocusNewTask();
          break;
        case Command.FOCUS_SUBTASK_INPUT:
          // Only execute if detail view is open (context check)
          if (activeTaskId) {
            handleFocusSubtaskInput();
          } else {
            // Optional: Show a toast or message indicating context requirement
            console.warn(
              'Cannot focus subtask input: Task detail view is not open.',
            );
          }
          break;
        case Command.TOGGLE_HELP_MODAL:
          handleToggleHelpModal();
          break;
        // Add cases for other commands as needed (e.g., settings, toggle completed)
        default:
          console.warn('Command not handled by palette:', command);
      }
    },
    [
      activeTaskId,
      handleFocusNewTask,
      handleFocusSubtaskInput,
      handleToggleHelpModal,
    ],
  ); // Add dependencies

  // --- Initialize Keyboard Commands Hook ---
  useKeyboardCommands({
    taskInputRef,
    taskListRef, // Pass the ref
    onNavigateList: handleNavigateList,
    onOpenDetail: handleOpenDetail,
    onCloseDetail: handleCloseDetail,
    onFocusNewTask: handleFocusNewTask,
    onToggleHelpModal: handleToggleHelpModal,
    onFocusSubtaskInput: handleFocusSubtaskInput, // Pass the new handler
  });

  // Check if this is the first visit (original useEffect content)
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
    if (!hasVisitedBefore && tasks.length === 0) {
      setIsFirstVisit(true);
      localStorage.setItem('hasVisitedBefore', 'true');
    }
  }, [tasks.length]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col">
        <div
          className={`container mx-auto px-4 flex-1 ${activeTaskId ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'max-w-2xl'}`}
        >
          <div className="py-4">
            <div className="flex justify-end mb-4 gap-2">
              <ThemeToggle />
              <Button // Added Settings Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsModalOpen(true)}
                title="Settings"
              >
                <SettingsIcon className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCompleted(!showCompleted)}
                title={
                  showCompleted
                    ? 'Hide completed tasks'
                    : 'Show completed tasks'
                }
              >
                {showCompleted ? (
                  <EyeOffIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </Button>
            </div>

            {tasks.length === 0 && isFirstVisit && (
              <motion.div
                className="text-center py-12 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-lg mb-6">Add your first task below</p>
                <motion.div
                  className="flex justify-center"
                  animate={{ y: [0, 10, 0] }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 1.5,
                  }}
                >
                  <ArrowDown className="h-8 w-8 text-primary" />
                </motion.div>
              </motion.div>
            )}

            {/* Pass ref, tasks, and focused index to TaskList */}
            <div ref={taskListRef}>
              <TaskList
                tasks={visibleTasks}
                showCompleted={showCompleted}
                focusedIndex={focusedTaskIndex}
              />
            </div>
          </div>

          {activeTaskId && (
            <div className="py-4 border-l pl-6 hidden md:block">
              {/* Pass the subtaskList ref handle to TaskDetail */}
              <TaskDetail
                subtaskListRef={subtaskListHandleRef}
                onClose={() => setActiveTaskId(null)}
              />
            </div>
          )}

          {activeTaskId && (
            <div className="fixed inset-0 z-50 md:hidden bg-background/80 backdrop-blur-sm">
              <div className="fixed inset-x-0 bottom-0 top-16 bg-background p-6 shadow-lg">
                {/* Pass the subtaskList ref handle to TaskDetail */}
                <TaskDetail
                  subtaskListRef={subtaskListHandleRef}
                  onClose={() => setActiveTaskId(null)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pass ref to TaskInput */}
      <div className="sticky bottom-0 border-t bg-background py-3 px-4">
        <div className="container mx-auto max-w-2xl">
          <TaskInput ref={taskInputRef} />
        </div>
      </div>

      <Toaster />
      <SettingsModal // Added SettingsModal component instance
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
      {/* Render Help Modal */}
      <KeyboardHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
      {/* Render Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
        onSelectCommand={handleSelectCommand}
      />
    </div>
  );
}
