'use client';

import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { useTaskStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { ArrowDown, EyeIcon, EyeOffIcon, SettingsIcon } from 'lucide-react'; // Added SettingsIcon
import { useEffect, useState, useCallback } from 'react'; // Added useCallback
import { SettingsModal } from './settings-modal'; // Added SettingsModal import
import { TaskDetail } from './task-detail';
import { TaskInput } from './task-input';
import { TaskList } from './task-list';
import { ThemeToggle } from './theme-toggle';
export function TaskDashboard() {
  const [showCompleted, setShowCompleted] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); // Added state for modal
  const activeTaskId = useTaskStore((state) => state.activeTaskId);
  const tasks = useTaskStore((state) => state.tasks);
  const setActiveTaskId = useTaskStore((state) => state.setActiveTaskId);

  // Check if this is the first visit
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
    if (!hasVisitedBefore && tasks.length === 0) {
      setIsFirstVisit(true);
      localStorage.setItem('hasVisitedBefore', 'true');
    }
  }, [tasks.length]);

  // Handle Escape key press to close detail panel
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' &&
        activeTaskId &&
        !(
          document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement ||
          document.activeElement instanceof HTMLSelectElement ||
          (document.activeElement instanceof HTMLElement &&
            document.activeElement.isContentEditable)
        )
      ) {
        setActiveTaskId(null);
      }
    },
    [activeTaskId, setActiveTaskId]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Check if this is the first visit (moved original useEffect content here)
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

            <TaskList showCompleted={showCompleted} />
          </div>

          {activeTaskId && (
            <div className="py-4 border-l pl-6 hidden md:block">
              <TaskDetail onClose={() => setActiveTaskId(null)} />
            </div>
          )}

          {activeTaskId && (
            <div className="fixed inset-0 z-50 md:hidden bg-background/80 backdrop-blur-sm">
              <div className="fixed inset-x-0 bottom-0 top-16 bg-background p-6 shadow-lg">
                <TaskDetail onClose={() => setActiveTaskId(null)} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 border-t bg-background py-3 px-4">
        <div className="container mx-auto max-w-2xl">
          <TaskInput />
        </div>
      </div>

      <Toaster />
      <SettingsModal // Added SettingsModal component instance
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}
