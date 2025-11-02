import { GoogleGenAI } from '@google/genai';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import { scrapeToolWebsite } from './scraper.js';

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
 * Analyze privacy policy and terms of service
 */
const analyzeTrustScore = async (toolName, privacyPolicyText, termsText, homepageText) => {
  const ai = getAI();
  const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Analyze the privacy and trustworthiness of "${toolName}" based on the following documents.

PRIVACY POLICY:
${privacyPolicyText.substring(0, 8000)}

TERMS OF SERVICE:
${termsText.substring(0, 8000)}

HOMEPAGE/ABOUT:
${homepageText.substring(0, 3000)}

Analyze and return ONLY valid JSON:
{
  "overall": 0-100,
  "dataTraining": "explicit" | "opting-out" | "unknown" | "no-training",
  "dataRetention": "permanent" | "limited" | "minimal" | "unknown",
  "countryOfOrigin": "country name or 'unknown'",
  "privacyPolicyQuality": "excellent" | "good" | "fair" | "poor" | "unknown",
  "thirdPartySharing": boolean,
  "compliance": ["GDPR", "CCPA"] or [],
  "concerns": ["list of specific concerns"],
  "confidence": 0.0-1.0
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error analyzing trust score:', error);
    return null;
  }
};

/**
 * Process trust analysis for a tool
 */
const processTrustAnalysis = async (toolId, toolData) => {
  try {
    const { officialUrl } = toolData;
    
    // Scrape privacy policy and terms pages
    console.log(`🔍 Scraping trust documents for ${toolData.name}...`);
    
    let privacyPolicyText = '';
    let termsText = '';
    let homepageText = '';

    try {
      const scraped = await scrapeToolWebsite(officialUrl);
      homepageText = scraped.homepageText || '';

      // Try to find privacy policy and terms pages
      // In production, you'd have a smarter way to find these URLs
      // For now, we'll use the homepage text
      privacyPolicyText = homepageText;
      termsText = homepageText;
    } catch (error) {
      console.warn(`⚠️  Could not scrape ${officialUrl}:`, error.message);
    }

    // Analyze trust score
    console.log(`🛡️  Analyzing trust score for ${toolData.name}...`);
    const trustScore = await analyzeTrustScore(
      toolData.name,
      privacyPolicyText,
      termsText,
      homepageText
    );

    if (trustScore) {
      // Save to Firestore
      const trustRef = db.collection('trust_scores').doc(toolId);
      await trustRef.set({
        toolId,
        ...trustScore,
        analyzedAt: Timestamp.now(),
        sourceUrl: officialUrl
      });

      console.log(`✅ Trust analysis complete for ${toolData.name}: ${trustScore.overall}/100`);
      return trustScore;
    }
  } catch (error) {
    console.error(`❌ Error processing trust analysis for ${toolId}:`, error);
    throw error;
  }
};

// Main execution
const main = async () => {
  console.log('🛡️  Starting trust analysis...');

  // Get tools without trust scores or with old scores
  const thirtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  
  const toolsSnapshot = await db.collection('tools')
    .limit(20)
    .get();

  if (toolsSnapshot.empty) {
    console.log('📭 No tools found');
    process.exit(0);
  }

  console.log(`📋 Analyzing ${toolsSnapshot.size} tools...`);

  for (const doc of toolsSnapshot.docs) {
    try {
      // Check if we have a recent trust score
      const trustDoc = await db.collection('trust_scores').doc(doc.id).get();
      
      if (trustDoc.exists) {
        const trustData = trustDoc.data();
        const analyzedAt = trustData.analyzedAt?.toDate?.() || new Date(0);
        const daysSinceAnalysis = (Date.now() - analyzedAt.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceAnalysis < 30) {
          console.log(`⏭️  Skipping ${doc.data().name} - recent trust score exists`);
          continue;
        }
      }

      await processTrustAnalysis(doc.id, doc.data());
      
      // Rate limiting - wait between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Failed to process ${doc.id}:`, error);
    }
  }

  console.log('🎉 Trust analysis complete!');
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { processTrustAnalysis, analyzeTrustScore };

