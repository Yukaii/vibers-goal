"use server"

import { createOpenAI } from "@ai-sdk/openai"
import { generateText } from "ai"

// We'll use the API key passed from the client
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function transcribeAudio(_audioBlob: Blob): Promise<string> {
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
  apiKey?: string,
): Promise<string[]> {
  try {
    if (!apiKey) {
      throw new Error("OpenAI API key not found. Please configure it in settings.")
    }

    // Initialize the OpenAI provider from the AI SDK
    // Note: dangerouslyAllowBrowser is handled by the SDK/environment
    const openai = createOpenAI({ apiKey })

    const systemPrompt = `
      Break down the following task into 3-5 clear, actionable subtasks.
      Return ONLY a list of subtasks, one per line. Each subtask should be clear and specific.
      Do not include numbering, bullet points, hyphens, asterisks, or any other list markers at the beginning of each line.
    `

    const userPrompt = `
      Task: ${taskTitle}
      ${taskDescription ? `Description: ${taskDescription}` : ""}
      ${customPrompt ? `Additional context: ${customPrompt}` : ""}
    `

    // Use the AI SDK's generateText function
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: userPrompt,
    })

    // Parse the response into individual subtasks
    return text
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
  } catch (error) {
    console.error("Error generating task breakdown:", error)
    // Check if the error is an APIError and provide more specific feedback if possible
    if (error instanceof Error && error.name === 'APIError') {
        // Attempt to parse potential JSON error details if available
        try {
            const errorDetails = JSON.parse(error.message);
            if (errorDetails?.error?.message) {
                throw new Error(`Failed to generate task breakdown: ${errorDetails.error.message}`);
            }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_parseError) {
            // Fallback if message is not JSON or doesn't match expected structure
            throw new Error(`Failed to generate task breakdown: ${error.message}`);
        }
    }
    // Generic fallback error
    throw new Error("Failed to generate task breakdown due to an unexpected error.")
  }
}
