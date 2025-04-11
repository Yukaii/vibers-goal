'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'; // Import RadioGroup
import { useToast } from '@/components/ui/use-toast';
import {
  type VoiceInputProvider,
  useSettingsStore,
} from '@/lib/settings-store'; // Import store items
import { useEffect, useState } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
} // Add missing closing brace

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    openaiApiKey,
    setOpenaiApiKey,
    voiceInputProvider,
    setVoiceInputProvider,
  } = useSettingsStore();
  const [apiKeyInput, setApiKeyInput] = useState('');
  // Local state for the radio group selection
  const [selectedProvider, setSelectedProvider] =
    useState<VoiceInputProvider>(voiceInputProvider);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setApiKeyInput(openaiApiKey || '');
      setSelectedProvider(voiceInputProvider); // Initialize local state on open
    }
  }, [isOpen, openaiApiKey, voiceInputProvider]);

  const handleSave = () => {
    setOpenaiApiKey(apiKeyInput.trim() || null);
    setVoiceInputProvider(selectedProvider); // Save selected provider
    toast({
      title: 'Settings Saved',
      description: 'Your settings have been updated.', // More generic message
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="openai-api-key" className="text-right col-span-1">
              OpenAI Key
            </Label>
            <Input
              id="openai-api-key"
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Enter your OpenAI API key"
              className="col-span-3"
            />
             <p className="text-xs text-muted-foreground px-1 col-start-2 col-span-3">
               Your API key is stored locally and only used for OpenAI requests.
             </p>
          </div>


          {/* Voice Input Provider Selection */}
          <div className="grid grid-cols-4 items-start gap-x-4 gap-y-2 pt-4"> {/* Use gap-x-4 and gap-y-2 */}
            <Label className="text-right col-span-1 pt-2">Voice Input</Label>
            <div className="col-span-3"> {/* Wrap RadioGroup and description */}
              <RadioGroup
                value={selectedProvider}
                onValueChange={(value) =>
                  setSelectedProvider(value as VoiceInputProvider)
                }
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="auto" id="r-auto" />
                  <Label htmlFor="r-auto" className="font-normal">
                    Auto (OpenAI if key set, else Web Speech)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="openai" id="r-openai" />
                  <Label htmlFor="r-openai" className="font-normal">
                    OpenAI (Requires API Key)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="webspeech" id="r-webspeech" />
                  <Label htmlFor="r-webspeech" className="font-normal">
                    Web Speech API (Browser Built-in)
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground pt-2"> {/* Indent description under RadioGroup */}
                Web Speech API support varies by browser. Accuracy may differ from OpenAI.
              </p>
            </div>
          </div>
          {/* Removed the standalone p tag from here */}
        </div>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
