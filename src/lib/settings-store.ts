import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type VoiceInputProvider = 'auto' | 'openai' | 'webspeech';

interface SettingsState {
  openaiApiKey: string | null;
  setOpenaiApiKey: (key: string | null) => void;
  voiceInputProvider: VoiceInputProvider;
  setVoiceInputProvider: (provider: VoiceInputProvider) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      openaiApiKey: null,
      setOpenaiApiKey: (key) => set({ openaiApiKey: key }),
      voiceInputProvider: 'auto', // Default to auto
      setVoiceInputProvider: (provider) =>
        set({ voiceInputProvider: provider }),
    }),
    {
      name: 'settings-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    },
  ),
);
