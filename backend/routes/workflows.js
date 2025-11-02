import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { getFirestoreAdmin } from '../firebase-admin.js';

const router = express.Router();

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });

// POST /api/workflows/generate - Generate AI workflow
router.post('/generate', async (req, res) => {
  try {
    const { goal } = req.body;

    if (!goal) {
      return res.status(400).json({ error: 'Goal is required' });
    }

    // Fetch all tools for context
    const db = getFirestoreAdmin();
    const toolsSnapshot = await db.collection('tools').limit(100).get();
    
    const tools = [];
    for (const doc of toolsSnapshot.docs) {
      const toolData = doc.data();
      const pricingDoc = await db.collection('pricing').doc(doc.id).get();
      
      let pricing = null;
      if (pricingDoc.exists) {
        const pricingData = pricingDoc.data();
        pricing = {
          model: pricingData.pricingModel || 'free',
          freeTier: {
            exists: pricingData.freeTier?.exists || false,
            limit: pricingData.freeTier?.limit || 'N/A',
            watermark: pricingData.freeTier?.watermark || false,
            requiresSignup: pricingData.freeTier?.requiresSignup || false,
            requiresCard: pricingData.freeTier?.requiresCard || false,
            commercialUse: pricingData.freeTier?.commercialUse || false,
            attribution: pricingData.freeTier?.attribution || false
          },
          paidTier: {
            startPrice: pricingData.paidTier?.startPrice || 'N/A',
            billingOptions: pricingData.paidTier?.billingOptions || []
          }
        };
      }

      tools.push({
        id: doc.id,
        name: toolData.name || 'Unknown',
        description: toolData.description || '',
        category: toolData.category || 'Unknown',
        pricing: pricing
      });
    }

    // Generate workflow using Gemini with detailed pricing info
    const toolsDetail = tools.map(t => {
      const pricing = t.pricing || {};
      return `- ${t.name} (${t.id}): ${t.description} [${t.category}]
  Pricing: ${pricing.model || 'unknown'}
  Free Tier: ${pricing.freeTier?.exists ? `Yes - ${pricing.freeTier.limit || 'Available'}` : 'No'}
  ${pricing.freeTier?.watermark ? '⚠️ Has watermark' : '✓ No watermark'}
  ${pricing.freeTier?.requiresCard ? '⚠️ Card required' : '✓ No card required'}
  ${pricing.freeTier?.commercialUse ? '✓ Commercial use allowed' : '❌ No commercial use'}
  Paid: ${pricing.paidTier?.startPrice || 'N/A'}`;
    }).join('\n\n');

    const prompt = `You are an AI workflow generator for an AI tool discovery platform.

User Goal: "${goal}"

Available Tools with Pricing Transparency:
${toolsDetail}

Generate a step-by-step workflow to accomplish the user's goal using the available AI tools.

IMPORTANT: Prioritize tools with:
- No credit card required for free tier
- No watermark on free outputs
- Commercial use allowed
- Lower cost options

Return your response as JSON in this format:
{
  "steps": [
    {
      "stepNumber": 1,
      "name": "Step name",
      "description": "What to do in this step",
      "recommendedTool": {
        "name": "Tool name",
        "toolId": "tool-id",
        "reason": "Why this tool (mention pricing benefits like 'no card required', 'no watermark')",
        "pricing": {
          "model": "freemium",
          "freeTierLimit": "20 credits/month",
          "watermark": false,
          "requiresCard": false,
          "commercialUse": true
        }
      },
      "pricing": {
        "cost": "$0",
        "freeTierAvailable": true,
        "notes": "No card required, no watermark, commercial use OK"
      },
      "estimatedTime": "30 minutes"
    }
  ],
  "estimatedTime": "2-3 hours",
  "totalCost": "$0",
  "summary": "Brief summary emphasizing cost savings and transparency benefits"
}`;

    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = result.response;

    // Parse response
    let workflow;
    try {
      const text = response.text();
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        workflow = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      // Fallback: create a simple workflow structure
      workflow = {
        steps: [
          {
            stepNumber: 1,
            name: "Planning",
            description: "Plan your approach based on the goal",
            recommendedTool: {
              name: "ChatGPT",
              reason: "Good for planning and brainstorming"
            },
            pricing: {
              cost: "$0",
              freeTierAvailable: true,
              notes: "Free tier available"
            }
          }
        ],
        estimatedTime: "1-2 hours",
        totalCost: "$0",
        summary: "Workflow for: " + goal
      };
    }

    res.json(workflow);
  } catch (error) {
    console.error('Error generating workflow:', error);
    res.status(500).json({ error: 'Failed to generate workflow', details: error.message });
  }
});

export { router as workflowsRouter };

