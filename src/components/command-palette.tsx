import * as React from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'; // Assuming command is already added via Shadcn CLI
import { Command as CmdKIcon, HelpCircle, ListTodo, Plus, Subtitles } from 'lucide-react'; // Icons for commands

// Re-use the Command enum from the hook
import { Command } from '@/hooks/use-keyboard-commands';

interface CommandPaletteProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCommand: (command: Command) => void; // Callback to execute command
}

// Define commands to show in the palette
const commandList = [
  {
    command: Command.FOCUS_NEW_TASK,
    label: 'Add New Task',
    icon: Plus,
    group: 'Tasks',
  },
  {
    command: Command.FOCUS_SUBTASK_INPUT,
    label: 'Add Subtask',
    icon: Subtitles,
    group: 'Tasks',
    // Note: This command only works if Task Detail is open,
    // we might need context awareness here later or disable it if detail isn't open.
  },
  // Add other relevant commands like Toggle Completed, Settings etc. later
  {
    command: Command.TOGGLE_HELP_MODAL,
    label: 'Show Keyboard Shortcuts',
    icon: HelpCircle,
    group: 'General',
  },
  // Navigation commands (j, k, l, h) are less suitable for a palette,
  // but could be added if desired.
];

export function CommandPalette({
  isOpen,
  onOpenChange,
  onSelectCommand,
}: CommandPaletteProps) {
  React.useEffect(() => {
    // Also add keyboard shortcut to open the palette itself (e.g., Cmd+K)
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!isOpen);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onOpenChange, isOpen]);

  const runCommand = (commandCallback: () => void) => {
    onOpenChange(false); // Close palette after selecting
    commandCallback();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    // Prevent Enter key from bubbling up and triggering global handlers
    // like opening task detail when a command is selected.
    if (e.key === 'Enter') {
    //   e.stopPropagation();
    }
    // Allow other keys like Escape to bubble up to close the dialog
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type a command or search..."
        onKeyDown={handleInputKeyDown} // Add keydown handler
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {/* Group commands */}
        {['Tasks', 'General'].map((groupName) => (
          <CommandGroup key={groupName} heading={groupName}>
            {commandList
              .filter((item) => item.group === groupName)
              .map((item) => (
                <CommandItem
                  key={item.command}
                  value={item.label} // Use label for search matching
                  onSelect={() => runCommand(() => onSelectCommand(item.command))}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
          </CommandGroup>
        ))}
        {/* Add separators if needed */}
        {/* <CommandSeparator /> */}
      </CommandList>
    </CommandDialog>
  );
}
