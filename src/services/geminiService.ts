import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface SportsNews {
  title: string;
  summary: string;
  source: string;
  url: string;
}

export interface ScoreUpdate {
  match: string;
  score: string;
  status: string;
  league: string;
}

export interface PlayerStats {
  name: string;
  team: string;
  stats: Record<string, string>;
  recentPerformance: string;
}

export const getSportsNews = async (query: string = "latest major sports news"): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Provide a comprehensive summary of ${query}. Focus on the most recent events from the last 24-48 hours. Include key details and context.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  return response.text || "No news found.";
};

export const getLiveScores = async (league: string = "all major leagues"): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Get the latest scores and schedules for ${league}. Include game status (live, finished, upcoming) and key highlights if available.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  return response.text || "No scores available.";
};

export const getPlayerStats = async (playerName: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Provide detailed current season statistics and a brief performance analysis for the athlete: ${playerName}.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  return response.text || "Player stats not found.";
};

export const chatWithAnalyst = async (message: string, history: { role: string; parts: { text: string }[] }[]) => {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "You are SportPulse AI, an expert sports analyst with access to real-time data via Google Search. Provide insightful, data-driven answers about sports news, scores, player stats, and history. Be concise but thorough.",
      tools: [{ googleSearch: {} }],
    },
    history: history,
  });

  return chat.sendMessageStream({ message });
};
