import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/kbd'; // Assuming a Kbd component exists or we create one
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

interface KeyboardHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Define shortcuts here for display
const shortcuts = [
  { keys: ['?', '/'], description: 'Toggle Keyboard Shortcuts Help' },
  { keys: ['n', 'Cmd/Ctrl + N'], description: 'Focus New Task Input' },
  { keys: ['j', '↓'], description: 'Navigate List Down' },
  { keys: ['k', '↑'], description: 'Navigate List Up' },
  { keys: ['l', 'Enter'], description: 'Open Task Detail / Edit' },
  { keys: ['h', 'Esc'], description: 'Close Task Detail' },
];

export function KeyboardHelpModal({ isOpen, onClose }: KeyboardHelpModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate and manage tasks faster.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Table>
            <TableBody>
              {shortcuts.map((shortcut) => (
                // Use description as key, assuming it's unique enough for this list
                <TableRow key={shortcut.description}>
                  <TableCell className="font-medium w-1/2">
                    {shortcut.keys.map((key) => (
                      // Use the key itself as the key for this inner map
                      <span key={key}>
                        <Kbd>{key}</Kbd>
                        {shortcut.keys.indexOf(key) < shortcut.keys.length - 1 && (
                          <span className="mx-1">or</span>
                        )}
                      </span>
                    ))}
                  </TableCell>
                  <TableCell>{shortcut.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {/* Optional: Add DialogFooter with a close button if needed */}
      </DialogContent>
    </Dialog>
  );
}
