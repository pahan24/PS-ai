export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  isError?: boolean;
}

export interface Attachment {
  name: string;
  mimeType: string;
  data: string; // Base64
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: string;
}

export interface Settings {
  apiKey: string; // User override key
  model: string;
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  systemInstruction: string;
}

export type Plan = 'free' | 'plus' | 'pro';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: Plan;
  provider?: 'google' | 'facebook' | 'email';
}

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '', 
  model: 'gemini-2.0-flash-exp', 
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  systemInstruction: 'You are a helpful, harmless, and honest AI assistant.'
};

export const MODELS = [
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', category: 'Latest', tier: 'free', description: 'Next-gen multimodal model.' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro', category: 'Reasoning', tier: 'pro', description: 'Advanced complex reasoning.' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3.0 Flash', category: 'Fast', tier: 'plus', description: 'High speed low latency.' },
];

export const PLANS = {
  free: {
    name: 'Free',
    price: '$0',
    features: ['Access to Gemini 2.0 Flash', 'Standard speed', 'Daily limit: 50 messages', 'Standard support'],
    color: 'bg-slate-700'
  },
  plus: {
    name: 'Plus',
    price: '$10',
    features: ['Access to Gemini 3.0 Flash', 'Fast response speed', 'Unlimited messages', 'Priority support', 'Code execution'],
    color: 'bg-blue-600'
  },
  pro: {
    name: 'Pro',
    price: '$25',
    features: ['Access to Gemini 3.0 Pro', 'Advanced Reasoning', '1M Context Window', 'Ultra-fast speed', 'Team collaboration', 'API Access'],
    color: 'bg-gradient-to-r from-purple-600 to-pink-600'
  }
};