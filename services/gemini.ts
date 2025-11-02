import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Tool } from "../types";

// Lazy initialization - only create when API key is available
let ai: GoogleGenAI | null = null;
let chat: Chat | null = null;

const getAI = (): GoogleGenAI | null => {
  if (ai) return ai;
  
  // In browser, use import.meta.env (Vite) instead of process.env
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY || 
                  (typeof window !== 'undefined' && (window as any).__GEMINI_API_KEY__);
  if (!apiKey) {
    console.warn('Gemini API key not found. Chatbot will be disabled.');
    return null;
  }
  
  try {
    ai = new GoogleGenAI({ apiKey });
    return ai;
  } catch (error) {
    console.error('Failed to initialize Gemini AI:', error);
    return null;
  }
};

const initializeChat = (tools: Tool[]) => {
  const aiInstance = getAI();
  if (!aiInstance) {
    throw new Error('Gemini API key not configured');
  }

  const toolDescriptions = tools.map(t => `- ${t.name}: ${t.description.substring(0, 100)}...`).join('\n');

  chat = aiInstance.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are Findora, a friendly and helpful AI assistant for an app that helps users discover AI tools.
      Your primary function is to help users find the right AI tool for their needs based on the provided list.
      You can answer questions about the tools, compare them, or recommend tools for a specific task.
      Keep your answers concise, helpful, and use markdown for formatting.
      
      Here is a summary of the available tools:
      ${toolDescriptions}
      `,
    },
  });
};

export const sendMessageToChatbot = async (message: string, tools: Tool[]): Promise<GenerateContentResponse> => {
  const aiInstance = getAI();
  if (!aiInstance) {
    // Return a mock response indicating API key is missing
    return {
      text: () => "Sorry, the AI assistant is not configured. Please set the GEMINI_API_KEY environment variable to enable chatbot functionality.",
      candidates: [],
      promptFeedback: undefined,
      usageMetadata: undefined
    } as any;
  }

  // Initialize chat on the first message.
  if (!chat) {
    initializeChat(tools);
  }
  
  // The type assertion `as Chat` is safe here because initializeChat() is called if chat is null.
  const response = await (chat as Chat).sendMessage({ message });
  return response;
};

export const isChatbotAvailable = (): boolean => {
  return getAI() !== null;
};
