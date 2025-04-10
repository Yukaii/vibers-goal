"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { transcribeAudio } from "@/lib/ai-service"

export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [isPushToTalk, setIsPushToTalk] = useState(false)
  const touchStartTimeRef = useRef<number | null>(null)

  // Detect if we're on mobile
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    setIsPushToTalk(isMobile)
  }, [])

  const startListening = useCallback(async () => {
    try {
      setIsProcessing(true)
      setTranscript("")

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)

      setAudioChunks([])

      recorder.ondataavailable = (e) => {
        setAudioChunks((chunks) => [...chunks, e.data])
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsListening(true)
      setIsProcessing(false)
      touchStartTimeRef.current = Date.now()
    } catch (error) {
      console.error("Error accessing microphone:", error)
      setIsProcessing(false)
      alert("Could not access microphone. Please check permissions.")
    }
  }, [])

  const stopListening = useCallback(async () => {
    if (!mediaRecorder) return

    setIsProcessing(true)
    mediaRecorder.stop()
    setIsListening(false)

    // Close the media stream
    mediaRecorder.stream.getTracks().forEach((track) => track.stop())

    // Check if this was a very short tap (less than 300ms)
    const isTooShort = touchStartTimeRef.current && Date.now() - touchStartTimeRef.current < 300
    touchStartTimeRef.current = null

    if (isTooShort) {
      setIsProcessing(false)
      return
    }

    // Wait for the last data to be collected
    setTimeout(async () => {
      if (audioChunks.length > 0) {
        try {
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" })
          const text = await transcribeAudio(audioBlob)
          setTranscript(text)
        } catch (error) {
          console.error("Error transcribing audio:", error)
          alert("Failed to transcribe audio. Please try again.")
        } finally {
          setIsProcessing(false)
        }
      } else {
        setIsProcessing(false)
      }
    }, 500)
  }, [mediaRecorder, audioChunks])

  useEffect(() => {
    return () => {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [mediaRecorder])

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    isProcessing,
    isPushToTalk,
  }
}
