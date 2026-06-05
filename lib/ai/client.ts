import OpenAI from "openai";

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set — AI features will not work.");
}

export const aiClient = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  baseURL: "https://ai.sumopod.com/v1",
});

export const AI_MODEL = "gemini/gemini-3.1-flash-lite" as const;
