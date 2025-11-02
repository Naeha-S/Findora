import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Tool } from "../types";

// FIX: Initialize the Gemini AI client. Ensure the API_KEY is set in the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

let chat: Chat | null = null;

const initializeChat = (tools: Tool[]) => {
  const toolDescriptions = tools.map(t => `- ${t.name}: ${t.description.substring(0, 100)}...`).join('\n');

  // FIX: Create a chat session with a system instruction to ground the model.
  chat = ai.chats.create({
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
  // FIX: Initialize chat on the first message.
  if (!chat) {
    initializeChat(tools);
  }
  
  // The type assertion `as Chat` is safe here because initializeChat() is called if chat is null.
  const response = await (chat as Chat).sendMessage({ message });
  return response;
};
