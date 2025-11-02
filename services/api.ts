import { Tool } from '../types';
import { initialTools } from '../data/mockData';

/**
 * ==========================================================================================
 * IMPORTANT: SECURE API USAGE
 * ==========================================================================================
 * This function simulates fetching data from a secure backend endpoint.
 * In a real-world application, you would NEVER use an API key in the frontend code.
 *
 * CORRECT ARCHITECTURE:
 * ---------------------
 * 1.  FRONTEND (This App): Makes a request to YOUR backend API (e.g., `GET /api/tools`).
 *     - Example: `const response = await fetch('/api/tools');`
 *
 * 2.  BACKEND (Your Server - e.g., Node.js, Python on Cloud Run):
 *     - Receives the request from the frontend.
 *     - Securely stores the Reddit API Key in an environment variable (e.g., `process.env.REDDIT_API_KEY`).
 *     - Uses the key to make a request to the Reddit API.
 *     - Processes the data (e.g., combines it with your tool database).
 *     - Sends the final, safe-to-display data back to the frontend.
 *
 * This ensures your secret key is never exposed to the public.
 * ==========================================================================================
 */

/**
 * Simulates fetching tools and then updating them with mention counts from a backend.
 * @returns A Promise that resolves with the list of tools, with simulated updated mention counts.
 */
export const fetchToolsWithMentions = async (): Promise<Tool[]> => {
  console.log("Simulating API call to a secure backend endpoint `/api/tools`...");

  // 1. Simulate network delay for the API call.
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 2. In a real backend, you'd fetch from Reddit here.
  //    We'll simulate the result by adding random new mentions to the initial data.
  const updatedTools = initialTools.map(tool => ({
    ...tool,
    mentionCount: tool.mentionCount + Math.floor(Math.random() * 50),
  }));

  console.log("Simulated fetch complete. Data received from backend.");
  return updatedTools;
};
