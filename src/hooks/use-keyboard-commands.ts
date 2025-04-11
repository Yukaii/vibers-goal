import { useTaskStore } from '@/lib/store';
import { type RefObject, useCallback, useEffect } from 'react';

// Define Command Identifiers
export enum Command {
  FOCUS_NEW_TASK = 'FOCUS_NEW_TASK',
  NAVIGATE_LIST_UP = 'NAVIGATE_LIST_UP',
  NAVIGATE_LIST_DOWN = 'NAVIGATE_LIST_DOWN',
  OPEN_DETAIL = 'OPEN_DETAIL',
  CLOSE_DETAIL = 'CLOSE_DETAIL',
  TOGGLE_HELP_MODAL = 'TOGGLE_HELP_MODAL',
  FOCUS_SUBTASK_INPUT = 'FOCUS_SUBTASK_INPUT', // Add subtask focus command
  // Add future commands here
}

// Define Keymap
// We use a simple object for now. Could be extended for user configuration.
const keymap: { [key: string]: Command } = {
  n: Command.FOCUS_NEW_TASK,
  'Meta+n': Command.FOCUS_NEW_TASK, // Cmd+N on macOS
  'Control+n': Command.FOCUS_NEW_TASK, // Ctrl+N on Win/Linux
  k: Command.NAVIGATE_LIST_UP,
  ArrowUp: Command.NAVIGATE_LIST_UP,
  j: Command.NAVIGATE_LIST_DOWN,
  ArrowDown: Command.NAVIGATE_LIST_DOWN,
  l: Command.OPEN_DETAIL,
  Enter: Command.OPEN_DETAIL,
  h: Command.CLOSE_DETAIL,
  Escape: Command.CLOSE_DETAIL,
  '?': Command.TOGGLE_HELP_MODAL,
  '/': Command.TOGGLE_HELP_MODAL,
  s: Command.FOCUS_SUBTASK_INPUT, // Add 's' keybinding
};

interface UseKeyboardCommandsProps {
  taskInputRef: RefObject<HTMLInputElement | null>; // Allow null
  taskListRef: RefObject<HTMLDivElement | null>; // Allow null
  onNavigateList: (direction: 'up' | 'down') => void;
  onOpenDetail: () => void;
  onCloseDetail: () => void;
  onFocusNewTask: () => void;
  onToggleHelpModal: () => void;
  onFocusSubtaskInput: () => void; // Add prop for subtask focus
}

export function useKeyboardCommands({
  taskInputRef,
  // taskListRef, // Might need this later for context checks
  onNavigateList,
  onOpenDetail,
  onCloseDetail,
  onFocusNewTask,
  onToggleHelpModal,
  onFocusSubtaskInput, // Destructure new prop
}: UseKeyboardCommandsProps) {
  const activeTaskId = useTaskStore((state) => state.activeTaskId);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const activeElement = document.activeElement;

      // Ignore keybindings if an input, textarea, or select is focused
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        (activeElement instanceof HTMLElement &&
          activeElement.isContentEditable)
      ) {
        // Allow Escape even in inputs if detail is open (original behavior)
        if (event.key === 'Escape' && activeTaskId) {
          // Let the existing Escape handler in TaskDashboard handle this if needed,
          // or call onCloseDetail directly if we consolidate logic here.
          // For now, let's assume the original handler still exists or we call onCloseDetail.
          // If we call it here, we need to prevent the default dashboard handler.
          // Let's call it here for consolidation.

          // --- START MODIFICATION ---
          // Check if the focused element is the main task input
          if (activeElement === taskInputRef.current) {
            // If it is the main task input, do nothing special here,
            // let the input handle Escape if needed (e.g., clear content).
            // We just don't want to close the detail panel.
            // We also don't preventDefault, allowing the input to handle Escape.
            return;
          }
          // --- END MODIFICATION ---

          // If Escape is pressed and detail is open, and it's NOT the main input, close detail.
          onCloseDetail();
          event.preventDefault(); // Prevent potential double handling
          return;
        }
        // Otherwise, ignore other commands when inputs are focused
        if (event.key !== 'Escape') {
          return;
        }
      }

      let keyString = event.key;
      if (event.metaKey) keyString = `Meta+${keyString}`;
      if (event.ctrlKey) keyString = `Control+${keyString}`;
      // Add Alt, Shift if needed

      const command = keymap[keyString];

      if (command) {
        event.preventDefault(); // Prevent default browser actions for handled keys

        switch (command) {
          case Command.FOCUS_NEW_TASK:
            onFocusNewTask();
            break;
          case Command.NAVIGATE_LIST_UP:
            // Only navigate if detail view is not open? Or always allow? Let's allow always for now.
            onNavigateList('up');
            break;
          case Command.NAVIGATE_LIST_DOWN:
            onNavigateList('down');
            break;
          case Command.OPEN_DETAIL:
            // Only open if detail view is not already open? Assumed handled by TaskList focus state.
            if (!activeTaskId) {
              // Only trigger open if not already open
              onOpenDetail();
            }
            break;
          case Command.CLOSE_DETAIL:
            if (activeTaskId) {
              onCloseDetail();
            }
            break;
          case Command.TOGGLE_HELP_MODAL:
            onToggleHelpModal();
            break;
          case Command.FOCUS_SUBTASK_INPUT:
            // Only focus subtask if detail view is open
            if (activeTaskId) {
              onFocusSubtaskInput();
            }
            break;
          default:
            // Optional: Log unhandled commands
            console.warn('Unhandled command:', command);
            break;
        }
      }
    },
    [
      activeTaskId,
      taskInputRef,
      onNavigateList,
      onOpenDetail,
      onCloseDetail,
      onFocusNewTask,
      onToggleHelpModal,
      onFocusSubtaskInput,
    ], // Add taskInputRef dependency
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // The hook itself doesn't need to return anything if it just sets up the listener
}
