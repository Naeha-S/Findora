import { GoogleGenAI } from "@google/genai";
import { Tool } from "../types";

// Initialize Gemini AI
const getAI = () => {
  // In browser, use import.meta.env instead of process.env
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY || 
                  (typeof window !== 'undefined' && (window as any).__GEMINI_API_KEY__);
  if (!apiKey) {
    return null;
  }
  try {
    return new GoogleGenAI({ apiKey });
  } catch {
    return null;
  }
};

/**
 * Plain-language search - converts user intent to tool matches
 */
export const searchToolsByTask = async (
  taskDescription: string,
  availableTools: Tool[]
): Promise<{ toolIds: string[]; reasoning: string }> => {
  const ai = getAI();
  if (!ai) {
    // Fallback to simple keyword matching
    return fallbackTaskSearch(taskDescription, availableTools);
  }

  const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const toolsList = availableTools.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category
  })).slice(0, 50); // Limit for prompt size

  const prompt = `A user wants to: "${taskDescription}"

Available AI Tools:
${toolsList.map(t => `- ${t.name} (${t.id}): ${t.description} [${t.category}]`).join('\n')}

Find the most relevant tools for this task. Return ONLY valid JSON:
{
  "toolIds": ["tool-id-1", "tool-id-2"],
  "reasoning": "Brief explanation of why these tools match"
}

Select tools that best match the user's intent, even if not exact category matches.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return fallbackTaskSearch(taskDescription, availableTools);
    }

    const data = JSON.parse(jsonMatch[0]);
    return {
      toolIds: data.toolIds || [],
      reasoning: data.reasoning || 'AI matched tools to your task'
    };
  } catch (error) {
    console.error('Error in AI task search:', error);
    return fallbackTaskSearch(taskDescription, availableTools);
  }
};

/**
 * Fallback search using keyword matching
 */
const fallbackTaskSearch = (
  taskDescription: string,
  availableTools: Tool[]
): { toolIds: string[]; reasoning: string } => {
  const lowerTask = taskDescription.toLowerCase();
  
  // Keyword mappings
  const keywordMap: Record<string, string[]> = {
    'background': ['remove', 'background', 'product', 'photo'],
    'voice': ['voice', 'voiceover', 'podcast', 'audio', 'speech'],
    'sketch': ['sketch', 'drawing', 'image', 'generate', 'create'],
    'email': ['email', 'write', 'writing', 'text', 'copy'],
    'video': ['video', 'edit', 'create', 'animate'],
    'music': ['music', 'audio', 'song', 'generate'],
    'code': ['code', 'program', 'develop', 'coding'],
    'image': ['image', 'photo', 'picture', 'generate', 'create']
  };

  const matches: string[] = [];
  
  // Find matching tools
  availableTools.forEach(tool => {
    const toolText = `${tool.name} ${tool.description} ${tool.category}`.toLowerCase();
    
    // Check for direct keyword matches
    const taskWords = lowerTask.split(/\s+/);
    const matchCount = taskWords.filter(word => 
      toolText.includes(word) && word.length > 3
    ).length;

    if (matchCount > 0) {
      matches.push(tool.id);
    }
  });

  return {
    toolIds: matches.slice(0, 10),
    reasoning: 'Matched based on keywords'
  };
};

/**
 * Pre-defined task suggestions
 */
export const taskSuggestions = [
  {
    id: 'remove-background',
    text: 'Remove background from product photo',
    icon: '🖼️',
    category: 'Image Editing'
  },
  {
    id: 'podcast-voice',
    text: 'Make my voice sound like a podcast host',
    icon: '🎙️',
    category: 'Audio/Music'
  },
  {
    id: 'sketch-to-image',
    text: 'Turn my sketch into a realistic image',
    icon: '✏️',
    category: 'Image Generation'
  },
  {
    id: 'ai-email',
    text: 'Write emails that don\'t sound like AI',
    icon: '📧',
    category: 'Writing Assistant'
  },
  {
    id: 'video-from-scratch',
    text: 'Create a marketing video from scratch',
    icon: '🎬',
    category: 'Video Editing'
  },
  {
    id: 'code-assistant',
    text: 'Help me write better code',
    icon: '💻',
    category: 'Code Generation'
  },
  {
    id: 'remove-watermark',
    text: 'Remove watermark from images',
    icon: '🖼️',
    category: 'Image Editing'
  },
  {
    id: 'transcribe-audio',
    text: 'Transcribe audio to text',
    icon: '📝',
    category: 'Audio/Music'
  }
];

