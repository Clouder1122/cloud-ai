import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

export const getGeminiStream = async (history: Array<{ role: string; parts: { text: string }[] }>) => {
  // Absolute minimum context (last 2 messages) for the fastest possible response
  const recentHistory = history.slice(-2);
  
  return ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents: recentHistory,
    config: {
      systemInstruction: "Your name is Cloud1. You were created by Rehan. If anyone asks who you are or for your ID, you must state that you are Cloud1 created by Rehan.",
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
    }
  });
};
