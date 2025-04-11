'use client';

import { transcribeAudio } from '@/lib/ai-service';
// Import VoiceInputProvider type and the setting itself
import {
  type VoiceInputProvider,
  useSettingsStore,
} from '@/lib/settings-store';
import { useCallback, useEffect, useRef, useState } from 'react';

// Check for SpeechRecognition API vendor prefixes
// Use @ts-ignore to suppress potential TS errors for non-standard properties
const SpeechRecognitionAPI =
  // @ts-ignore
  window.SpeechRecognition || window.webkitSpeechRecognition;

// Define the interface for the SpeechRecognition event if needed, or use any
interface SpeechRecognitionEvent extends Event {
  // Define properties based on the actual event structure
  // Example:
  results: SpeechRecognitionResultList;
  resultIndex: number;
  // Add other properties as needed
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

// Define a minimal interface for the SpeechRecognition object properties we use
interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
  onerror:
    | ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => void)
    | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export function useVoiceInput() {
  // Get the provider setting from the store
  const { openaiApiKey, voiceInputProvider } = useSettingsStore();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null); // Use the defined interface
  const [isPushToTalk, setIsPushToTalk] = useState(false);
  const touchStartTimeRef = useRef<number | null>(null);
  const [isApiAvailable, setIsApiAvailable] = useState(false); // Track if the *selected* voice input method is available
  const [effectiveProvider, setEffectiveProvider] =
    useState<VoiceInputProvider | null>(null); // Track which provider will actually be used

  // Determine availability based on selected provider
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsPushToTalk(isMobile);

    let available = false;
    let providerToUse: VoiceInputProvider | null = null;

    const hasOpenAI = !!openaiApiKey;
    const hasWebSpeech = !!SpeechRecognitionAPI;

    if (voiceInputProvider === 'openai') {
      available = hasOpenAI;
      providerToUse = available ? 'openai' : null;
    } else if (voiceInputProvider === 'webspeech') {
      available = hasWebSpeech;
      providerToUse = available ? 'webspeech' : null;
    } else {
      // 'auto'
      if (hasOpenAI) {
        available = true;
        providerToUse = 'openai';
      } else if (hasWebSpeech) {
        available = true;
        providerToUse = 'webspeech';
      } else {
        available = false;
        providerToUse = null;
      }
    }

    setIsApiAvailable(available);
    setEffectiveProvider(providerToUse);
  }, [openaiApiKey, voiceInputProvider]);

  const startListening = useCallback(async () => {
    // Check based on the *effective* provider determined by the useEffect hook
    if (!isApiAvailable || !effectiveProvider) {
      let message = 'No voice input method is available.';
      if (voiceInputProvider === 'openai' && !openaiApiKey) {
        message = 'OpenAI provider selected, but API key is missing.';
      } else if (voiceInputProvider === 'webspeech' && !SpeechRecognitionAPI) {
        message =
          'Web Speech provider selected, but your browser does not support it.';
      } else if (voiceInputProvider === 'auto') {
        message =
          'Auto mode: Neither OpenAI key nor Web Speech API is available.';
      }
      alert(message);
      return;
    }

    setIsProcessing(true);
    setTranscript('');
    touchStartTimeRef.current = Date.now(); // Record start time for tap detection

    // --- OpenAI Flow ---
    if (effectiveProvider === 'openai') {
      console.log('Starting voice input with OpenAI...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            // setAudioChunks((prevChunks) => [...prevChunks, e.data]);
          }
        };

        recorder.onstop = async () => {
          const currentRecorder = mediaRecorderRef.current;
          if (!currentRecorder) return;
          for (const track of currentRecorder.stream.getTracks()) {
            track.stop();
          }

          const isTooShort =
            touchStartTimeRef.current &&
            Date.now() - touchStartTimeRef.current < 300;
          touchStartTimeRef.current = null;

          if (isTooShort) {
            console.log('Recording too short (OpenAI), discarding.');
            setIsProcessing(false);
            // setAudioChunks([]);
            return;
          }

          // setAudioChunks((currentAudioChunks) => {
          const currentAudioChunks: Blob[] = []; // Replaced with local variable
          if (currentAudioChunks.length > 0) {
            console.log(
              `Processing ${currentAudioChunks.length} audio chunks (OpenAI).`,
            );
            (async () => {
              try {
                const audioBlob = new Blob(currentAudioChunks, {
                  type: 'audio/webm',
                });
                const text = await transcribeAudio(
                  audioBlob,
                  openaiApiKey ?? undefined,
                );
                console.log('OpenAI Transcription result:', text);
                setTranscript(text);
              } catch (error) {
                console.error('Error transcribing audio (OpenAI):', error);
                alert('Failed to transcribe audio. Please try again.');
              } finally {
                setIsProcessing(false);
              }
            })();
          } else {
            console.log('No audio chunks to process (OpenAI).');
            setIsProcessing(false);
          }
          // return []; // Clear chunks
          // });
        };

        recorder.start();
        setIsListening(true);
        setIsProcessing(false);
      } catch (error) {
        console.error('Error accessing microphone (OpenAI):', error);
        setIsProcessing(false);
        alert('Could not access microphone. Please check permissions.');
      }
    }
    // --- Web Speech API Flow ---
    else if (effectiveProvider === 'webspeech') {
      console.log('Starting voice input with Web Speech API...');
      try {
        const recognition = new SpeechRecognitionAPI();
        recognitionRef.current = recognition;
        recognition.continuous = false; // Process after user stops speaking
        recognition.interimResults = true; // Show interim results

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          console.log('Web Speech interim:', interimTranscript);
          console.log('Web Speech final:', finalTranscript);
          // Display interim results, finalize on final
          setTranscript(finalTranscript || interimTranscript);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          let errorMessage = 'Speech recognition error.';
          if (event.error === 'no-speech') {
            errorMessage = 'No speech detected. Please try again.';
          } else if (event.error === 'audio-capture') {
            errorMessage =
              'Microphone problem. Please ensure it is connected and enabled.';
          } else if (event.error === 'not-allowed') {
            errorMessage =
              'Permission denied. Please allow microphone access in browser settings.';
          } else if (event.error === 'network') {
            errorMessage =
              "Network error connecting to the browser's speech recognition service. Please check your internet connection or try a different browser/network."; // Updated message
          }
          alert(errorMessage);
          setIsListening(false);
          setIsProcessing(false);
          recognitionRef.current = null; // Clean up ref on error
        };

        recognition.onend = () => {
          console.log('Web Speech recognition ended.');
          const isTooShort =
            touchStartTimeRef.current &&
            Date.now() - touchStartTimeRef.current < 300;
          touchStartTimeRef.current = null;

          // Use a local variable to check the transcript state *before* potentially clearing it
          const currentTranscript = transcript;

          if (isTooShort && !currentTranscript) {
            console.log('Recording too short (Web Speech), discarding.');
            setTranscript(''); // Clear any potential brief interim result
          }

          setIsListening(false);
          setIsProcessing(false);
          recognitionRef.current = null; // Clean up ref on end
        };

        recognition.start();
        setIsListening(true);
        setIsProcessing(false);
      } catch (error) {
        // This catch might not be strictly necessary if onerror handles most cases,
        // but good for safety.
        console.error('Error starting Web Speech recognition:', error);
        setIsProcessing(false);
        alert('Could not start voice recognition.');
      }
    }
  }, [
    openaiApiKey,
    isApiAvailable,
    transcript,
    effectiveProvider,
    voiceInputProvider,
  ]); // Add dependencies

  const stopListening = useCallback(() => {
    // Stop MediaRecorder if active (implies OpenAI was used)
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      console.log('Stopping listening (OpenAI)...');
      setIsListening(false);
      setIsProcessing(true); // Processing starts on 'onstop'
      mediaRecorderRef.current.stop();
    }
    // Stop SpeechRecognition if active (implies Web Speech was used)
    else if (recognitionRef.current) {
      console.log('Stopping listening (Web Speech)...');
      // No need to set isProcessing here, onend handles it.
      // isListening is also handled by onend.
      recognitionRef.current.stop();
    } else {
      console.log('No active recorder or recognition to stop.');
    }
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup MediaRecorder
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        console.log('Cleaning up media recorder stream tracks.');
        for (const track of mediaRecorderRef.current.stream.getTracks()) {
          track.stop();
        }
      }
      // Cleanup SpeechRecognition
      if (recognitionRef.current) {
        console.log('Cleaning up speech recognition.');
        recognitionRef.current.abort(); // Use abort for immediate stop
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    isProcessing,
    isPushToTalk,
    isApiAvailable, // Expose availability status
  };
}
