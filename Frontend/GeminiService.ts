import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function* getAIAssistance(prompt: string, mediaInfo: string) {
  const model = "gemini-3-flash-preview";
  const systemInstruction = `You are a helpful and fun "Watch & Listen Party" assistant. 
  You are in a virtual room with users watching/listening to: ${mediaInfo}.
  Your tone is energetic, helpful, and concise. 
  If users ask about the movie or song, give them interesting facts. 
  Keep responses under 100 words.`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    for await (const chunk of responseStream) {
      // Fix: Ensure we only yield if chunk.text is defined to avoid appending "undefined" strings in UI
      if (chunk.text !== undefined) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    yield "Sorry, I'm having trouble connecting to the party brain right now! 🧠💨";
  }
}