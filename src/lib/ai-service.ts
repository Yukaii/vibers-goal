"use server"

import { OpenAI } from "openai"

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

    const prompt = `
      Break down the following task into 3-5 clear, actionable subtasks:
      
      Task: ${taskTitle}
      ${taskDescription ? `Description: ${taskDescription}` : ""}
      ${customPrompt ? `Additional context: ${customPrompt}` : ""}
      
      Return ONLY a list of subtasks, one per line. Each subtask should be clear and specific.
    `

    // Create OpenAI client with the provided API key
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })

    // Use the OpenAI API to generate task breakdown
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    })

    const text = response.choices[0]?.message?.content || ""

    // Parse the response into individual subtasks
    return text
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .map((line: string) => line.replace(/^\d+\.\s*/, "")) // Remove numbering if present
  } catch (error) {
    console.error("Error generating task breakdown:", error)
    throw new Error("Failed to generate task breakdown")
  }
}
