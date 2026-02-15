import { Settings } from "./types";

export const INITIAL_GREETING = "Hello, I'm PS AI. How can I help you today?";

export const APP_VERSION = "3.2.0-GEMINI";

export const STORAGE_KEYS = {
  CHATS: 'ps_ai_chats',
  SETTINGS: 'ps_ai_settings',
  CURRENT_CHAT_ID: 'ps_ai_current_chat_id',
  USER: 'ps_ai_user' 
};

export const EXAMPLE_PROMPTS = [
  "Explain quantum computing in simple terms",
  "Write a Python script to scrape a website",
  "Design a workout routine for beginners",
  "Analyze this image and describe it"
];

// Empty pool - User must provide key via Settings or Environment
export const API_KEY_POOL = [];