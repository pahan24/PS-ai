import { GoogleGenAI } from "@google/genai";
import { Message, Settings } from '../types';

const getApiKey = (settings: Settings) => {
  // 1. Env var (Preferred)
  if (typeof process !== "undefined" && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
  }
  // 2. User defined key in Settings (Fallback)
  if (settings.apiKey) {
      return settings.apiKey;
  }
  return '';
};

export const generateContentStream = async (
  messages: Message[],
  settings: Settings,
  onChunk: (text: string) => void,
  onFinish: () => void,
  onError: (error: string) => void,
  signal: AbortSignal
) => {
    const apiKey = getApiKey(settings);

    if (!apiKey) {
        onError("Missing API Key. Please provide a valid Gemini API Key in settings or environment variables.");
        return;
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        // Transform messages to Gemini format
        const contents = messages.map(msg => {
            const parts: any[] = [];
            
            // Add attachments if any
            if (msg.attachments && msg.attachments.length > 0) {
                msg.attachments.forEach(att => {
                    parts.push({
                        inlineData: {
                            mimeType: att.mimeType,
                            data: att.data
                        }
                    });
                });
            }
            
            // Add text content
            if (msg.content) {
                parts.push({ text: msg.content });
            }

            return {
                role: msg.role === 'model' ? 'model' : 'user',
                parts: parts
            };
        });

        const response = await ai.models.generateContentStream({
            model: settings.model,
            contents: contents,
            config: {
                temperature: settings.temperature,
                topP: settings.topP,
                topK: settings.topK,
                maxOutputTokens: settings.maxOutputTokens,
                systemInstruction: settings.systemInstruction,
            },
        });

        for await (const chunk of response) {
            if (signal.aborted) break;
            if (chunk.text) {
                onChunk(chunk.text);
            }
        }

        if (!signal.aborted) {
            onFinish();
        }

    } catch (error: any) {
        if (signal.aborted) return;
        console.error("Gemini Stream Error:", error);
        
        let errorMessage = error.message || "Unknown error occurred";
        if (errorMessage.includes("404")) {
             errorMessage = `Model ${settings.model} not found. Try switching models in Settings.`;
        } else if (errorMessage.includes("401") || errorMessage.includes("403")) {
             errorMessage = "Invalid API Key. Please check your credentials.";
        } else if (errorMessage.includes("503")) {
             errorMessage = "The service is currently overloaded. Please try again later.";
        }
        
        onError(errorMessage);
    }
};