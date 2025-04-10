'use client';

import { transcribeAudio } from '@/lib/ai-service';
import { useSettingsStore } from '@/lib/settings-store';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useVoiceInput() {
  const { openaiApiKey } = useSettingsStore();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null); // Ref for MediaRecorder instance
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]); // State for audio data chunks
  const [isPushToTalk, setIsPushToTalk] = useState(false); // Flag for mobile push-to-talk UI
  const touchStartTimeRef = useRef<number | null>(null);

  // Detect if we're on mobile
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsPushToTalk(isMobile);
  }, []);

  const startListening = useCallback(async () => {
    try {
      setIsProcessing(true);
      setTranscript('');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder; // Store in ref

      // Clear chunks at the start
      setAudioChunks([]);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          // Use functional update to ensure we have the latest state
          setAudioChunks((prevChunks) => [...prevChunks, e.data]);
        }
      };

      // Process audio in the onstop handler
      recorder.onstop = async () => {
        // Use the ref to access the recorder
        const currentRecorder = mediaRecorderRef.current;
        if (!currentRecorder) return;

        // Close stream tracks
        for (const track of currentRecorder.stream.getTracks()) {
          track.stop();
        }

        // Check for short tap
        const isTooShort =
          touchStartTimeRef.current && Date.now() - touchStartTimeRef.current < 300;
        touchStartTimeRef.current = null;

        if (isTooShort) {
          console.log('Recording too short, discarding.');
          setIsProcessing(false);
          setAudioChunks([]); // Clear chunks even if short
          return;
        }

        // Use functional update for setAudioChunks to get the latest chunks
        // and clear them atomically after processing.
        setAudioChunks(currentAudioChunks => {
          if (currentAudioChunks.length > 0) {
            console.log(`Processing ${currentAudioChunks.length} audio chunks.`);
            // Process the audio asynchronously
            (async () => {
              try {
                const audioBlob = new Blob(currentAudioChunks, { type: 'audio/webm' });
                const text = await transcribeAudio(
                  audioBlob,
                  openaiApiKey ?? undefined,
                );
                console.log('Transcription result:', text);
                setTranscript(text);
              } catch (error) {
                console.error('Error transcribing audio:', error);
                alert('Failed to transcribe audio. Please try again.');
              } finally {
                // Set processing to false after transcription attempt
                setIsProcessing(false);
              }
            })(); // IIAFE: Immediately Invoked Async Function Expression
          } else {
            console.log('No audio chunks to process.');
            setIsProcessing(false); // Set processing to false if no chunks
          }
          return []; // Always return empty array to clear the chunks state
        });
      };

      recorder.start();
      setIsListening(true);
      setIsProcessing(false);
      touchStartTimeRef.current = Date.now();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsProcessing(false);
      alert('Could not access microphone. Please check permissions.');
    }
  }, [openaiApiKey]);

  const stopListening = useCallback(() => {
    const currentRecorder = mediaRecorderRef.current;
    if (!currentRecorder || currentRecorder.state === 'inactive') {
      console.log('Recorder not active or not found, cannot stop.');
      return;
    }

    console.log('Stopping listening...');
    // Set states for UI feedback; actual processing happens in onstop
    setIsListening(false);
    setIsProcessing(true);

    // Stop the recorder, triggering the 'onstop' handler
    currentRecorder.stop();
  }, []);

  // Cleanup effect to stop recorder tracks on unmount
  useEffect(() => {
    return () => {
      const currentRecorder = mediaRecorderRef.current;
      if (currentRecorder && currentRecorder.state !== 'inactive') {
        console.log('Cleaning up media recorder stream tracks.');
        for (const track of currentRecorder.stream.getTracks()) {
          track.stop();
        }
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
  };
}
