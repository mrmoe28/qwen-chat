export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  files?: AttachedFile[];
}

export interface AttachedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // base64 encoded
}

export interface Conversation {
  id: string;
  projectId?: string; // optional project association
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  conversations: string[]; // conversation IDs
  specialInstructions: string;
  contextFiles: AttachedFile[];
  createdAt: number;
  updatedAt: number;
}

export interface ModelSettings {
  model: string; // Model ID or "auto" for automatic selection
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  ttsEnabled: boolean;
  ttsVoice: 'ryan' | 'amy' | 'lessac' | 'ljspeech';
}

export interface SearchSource {
  id: number;
  title: string;
  url: string;
  domain: string;
  snippet: string;
}

export const DEFAULT_MODEL_SETTINGS: ModelSettings = {
  model: 'qwen2.5:1.5b', // Faster, smaller model
  temperature: 0.7,
  maxTokens: 512, // Reduced from 2048 for faster responses
  topP: 0.9,
  frequencyPenalty: 0,
  presencePenalty: 0,
  ttsEnabled: false,
  ttsVoice: 'ryan',
};
