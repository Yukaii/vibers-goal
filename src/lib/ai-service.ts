"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  // This is a mock implementation for the MVP
  // In a real implementation, you would use OpenAI's Whisper API
  // or another speech-to-text service

  console.log("Transcribing audio...")

  // Simulate a delay for the transcription process
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Return a mock response for now
  return "Add milk to the shopping list"
}

export async function generateTaskBreakdown(
  taskTitle: string,
  taskDescription?: string,
  customPrompt?: string,
): Promise<string[]> {
  try {
    const prompt = `
      Break down the following task into 3-5 clear, actionable subtasks:
      
      Task: ${taskTitle}
      ${taskDescription ? `Description: ${taskDescription}` : ""}
      ${customPrompt ? `Additional context: ${customPrompt}` : ""}
      
      Return ONLY a list of subtasks, one per line. Each subtask should be clear and specific.
    `

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
    })

    // Parse the response into individual subtasks
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^\d+\.\s*/, "")) // Remove numbering if present
  } catch (error) {
    console.error("Error generating task breakdown:", error)
    throw new Error("Failed to generate task breakdown")
  }
}
