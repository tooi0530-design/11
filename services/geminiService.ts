import { GoogleGenAI, Type } from "@google/genai";
import { Task } from "../types";
import { v4 as uuidv4 } from 'uuid';

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
};

export const generateTaskSuggestions = async (dateContext: string): Promise<Task[]> => {
  const ai = getClient();
  if (!ai) {
    console.warn("API Key not found, returning mock data or empty.");
    return [];
  }

  try {
    const prompt = `Generate 3 to 5 productive, realistic to-do list items for a person on a ${dateContext}. 
    Keep them concise (under 10 words). Return only the array of strings.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const suggestions = JSON.parse(response.text || "[]") as string[];

    return suggestions.map(text => ({
      id: uuidv4(),
      text: text,
      isCompleted: false,
      createdAt: Date.now()
    }));

  } catch (error) {
    console.error("Error generating suggestions:", error);
    return [];
  }
};
