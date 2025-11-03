import { GoogleGenAI } from '@google/genai';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
const initializeFirebase = () => {
  if (getApps().length > 0) {
    return getFirestore();
  }

  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({ credential: cert(serviceAccount) });
    } else {
      initializeApp(); // Use default credentials on Cloud Run
    }
    return getFirestore();
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
};

const db = initializeFirebase();

// Initialize Gemini AI
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not set');
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Prompt 1: Pricing Classifier
 * Extract pricing transparency from scraped website content
 */
export const classifyPricing = async (homepageText, pricingText, faqText) => {
  const ai = getAI();
  const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are a pricing transparency analyzer for an AI tool discovery platform.

Analyze the following website content and extract pricing information. Be thorough and accurate.

Homepage Text:
${homepageText.substring(0, 5000)}

Pricing Page Text:
${pricingText.substring(0, 5000)}

FAQ Text:
${faqText.substring(0, 3000)}

Extract pricing information and return ONLY valid JSON in this exact format:
{
  "pricingModel": "free" | "freemium" | "paid" | "trial_only",
  "freeTier": {
    "exists": boolean,
    "limit": "description of free tier limits (e.g., '20 credits per month' or 'Unlimited')",
    "watermark": boolean,
    "requiresSignup": boolean,
    "requiresCard": boolean,
    "commercialUse": boolean,
    "attribution": boolean
  },
  "paidTier": {
    "startPrice": "starting price string (e.g., '$19/month') or 'N/A'",
    "billingOptions": ["monthly", "annual"] or []
  },
  "confidence": 0.0-1.0,
  "ambiguities": ["any unclear aspects"]
}

Important rules:
- If no free tier exists, set exists: false and set realistic defaults
- If information is unclear, lower confidence and note in ambiguities
- Be conservative with claims - if you're not sure, indicate uncertainty
- Watermark: true only if explicitly mentioned or shown
- requiresCard: true only if credit card is required for free tier
- commercialUse: true if allowed, false if prohibited, null if not mentioned

Return ONLY the JSON object, no additional text.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const classification = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!classification.pricingModel || !classification.freeTier) {
      throw new Error('Invalid classification structure');
    }

    return classification;
  } catch (error) {
    console.error('Error classifying pricing:', error);
    throw error;
  }
};

/**
 * Prompt 2: Tool Name Extractor
 * Extract AI tool names from social media posts
 */
export const extractToolName = async (postText) => {
  const ai = getAI();
  const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Extract AI tool information from this social media post:

"${postText}"

Return ONLY valid JSON in this format:
{
  "toolName": "extracted tool name or null",
  "category": "Image Editing" | "Image Generation" | "Video Editing" | "Writing Assistant" | "Code Generation" | "Audio/Music" | "3D/Design" | "Productivity" | null,
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}

If no tool is clearly mentioned, return null for toolName and category.
Return ONLY the JSON object.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        toolName: null,
        category: null,
        confidence: 0,
        reasoning: 'Could not parse AI response'
      };
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error extracting tool name:', error);
    return {
      toolName: null,
      category: null,
      confidence: 0,
      reasoning: error.message
    };
  }
};

/**
 * Process a classification job
 */
export const processClassification = async (jobId, jobData) => {
  try {
    const jobRef = db.collection('analysis_jobs').doc(jobId);
    
    await jobRef.update({
      status: 'classifying',
      updatedAt: Timestamp.now()
    });

    const { scrapedData, url, toolId } = jobData;

    if (!scrapedData) {
      throw new Error('No scraped data available');
    }

    // Classify pricing
    console.log(`🤖 Classifying pricing for ${url}...`);
    const classification = await classifyPricing(
      scrapedData.homepageText || '',
      scrapedData.pricingText || '',
      scrapedData.faqText || ''
    );

    // Save to pricing collection
    if (toolId) {
      const pricingRef = db.collection('pricing').doc(toolId);
      await pricingRef.set({
        toolId,
        pricingModel: classification.pricingModel,
        freeTier: classification.freeTier,
        paidTier: classification.paidTier,
        confidence: classification.confidence,
        sourceUrl: url,
        lastCheckedAt: Timestamp.now(),
        ambiguities: classification.ambiguities || []
      });

      // Update tool's lastVerifiedAt
      const toolRef = db.collection('tools').doc(toolId);
      await toolRef.update({
        lastVerifiedAt: Timestamp.now()
      });
    }

    // Update job status
    await jobRef.update({
      status: 'completed',
      classification,
      updatedAt: Timestamp.now()
    });

    console.log(`✅ Classification complete for ${url}`);
    return classification;
  } catch (error) {
    const jobRef = db.collection('analysis_jobs').doc(jobId);
    await jobRef.update({
      status: 'failed',
      error: error.message,
      updatedAt: Timestamp.now()
    });
    throw error;
  }
};

// Main execution
const main = async () => {
  console.log('🔍 Looking for pending classification jobs...');
  
  const jobsSnapshot = await db.collection('analysis_jobs')
    .where('status', '==', 'pending_classification')
    .limit(10)
    .get();

  if (jobsSnapshot.empty) {
    console.log('📭 No pending classification jobs found');
    process.exit(0);
  }

  console.log(`📋 Found ${jobsSnapshot.size} pending classification jobs`);
  
  for (const doc of jobsSnapshot.docs) {
    try {
      await processClassification(doc.id, doc.data());
    } catch (error) {
      console.error(`❌ Failed to process job ${doc.id}:`, error);
    }
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

