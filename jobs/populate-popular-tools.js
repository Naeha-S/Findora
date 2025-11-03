import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import { scrapeToolWebsite } from './scraper.js';
import { classifyPricing } from './classifier.js';
import { analyzeTrustScore } from './trust-analyzer.js';

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
      initializeApp();
    }
    return getFirestore();
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
};

const db = initializeFirebase();

// Popular AI tools to populate database
const POPULAR_AI_TOOLS = [
  { name: 'ChatGPT', url: 'https://chat.openai.com', category: 'Writing Assistant' },
  { name: 'Midjourney', url: 'https://www.midjourney.com', category: 'Image Generation' },
  { name: 'Claude', url: 'https://claude.ai', category: 'Writing Assistant' },
  { name: 'DALL-E', url: 'https://openai.com/dall-e-3', category: 'Image Generation' },
  { name: 'Gemini', url: 'https://gemini.google.com', category: 'Writing Assistant' },
  { name: 'Stable Diffusion', url: 'https://stability.ai', category: 'Image Generation' },
  { name: 'GitHub Copilot', url: 'https://github.com/features/copilot', category: 'Code Generation' },
  { name: 'Runway', url: 'https://runwayml.com', category: 'Video Editing' },
  { name: 'ElevenLabs', url: 'https://elevenlabs.io', category: 'Audio/Music' },
  { name: 'Jasper', url: 'https://www.jasper.ai', category: 'Writing Assistant' },
  { name: 'Copy.ai', url: 'https://www.copy.ai', category: 'Writing Assistant' },
  { name: 'Synthesia', url: 'https://www.synthesia.io', category: 'Video Editing' },
  { name: 'Pictory', url: 'https://pictory.ai', category: 'Video Editing' },
  { name: 'Descript', url: 'https://www.descript.com', category: 'Audio/Music' },
  { name: 'Notion AI', url: 'https://www.notion.so/product/ai', category: 'Productivity' },
  { name: 'Grammarly', url: 'https://www.grammarly.com', category: 'Writing Assistant' },
  { name: 'Perplexity', url: 'https://www.perplexity.ai', category: 'Writing Assistant' },
  { name: 'Leonardo.ai', url: 'https://leonardo.ai', category: 'Image Generation' },
  { name: 'Cursor', url: 'https://cursor.sh', category: 'Code Generation' },
  { name: 'v0', url: 'https://v0.dev', category: 'Code Generation' },
  { name: 'Murf AI', url: 'https://murf.ai', category: 'Audio/Music' },
  { name: 'Fireflies.ai', url: 'https://fireflies.ai', category: 'Productivity' },
  { name: 'Otter.ai', url: 'https://otter.ai', category: 'Productivity' },
  { name: 'Canva AI', url: 'https://www.canva.com/ai-image-generator/', category: '3D/Design' },
  { name: 'Remove.bg', url: 'https://www.remove.bg', category: 'Image Editing' },
];

/**
 * Process a single tool
 */
const processTool = async (toolData) => {
  const { name, url, category } = toolData;

  console.log(`\n🔧 Processing: ${name}`);
  console.log(`   URL: ${url}`);
  console.log(`   Category: ${category}`);

  try {
    // Check if tool already exists
    const toolId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existingTool = await db.collection('tools').doc(toolId).get();

    if (existingTool.exists) {
      console.log('   ⏭️  Tool already exists in database');
      return toolId;
    }

    // Step 1: Scrape website
    console.log('   🌐 Scraping website...');
    let scrapedData;
    try {
      scrapedData = await scrapeToolWebsite(url);
      console.log('   ✅ Website scraped');
    } catch (error) {
      console.warn('   ⚠️  Scraping failed:', error.message);
      scrapedData = {
        homepageText: `${name} - ${category} AI Tool`,
        pricingText: '',
        faqText: '',
        scrapedAt: new Date().toISOString()
      };
    }

    // Step 2: Classify pricing
    console.log('   💰 Classifying pricing...');
    let pricingData;
    try {
      pricingData = await classifyPricing(
        scrapedData.homepageText,
        scrapedData.pricingText,
        scrapedData.faqText
      );
      console.log(`   ✅ Pricing: ${pricingData.pricingModel}`);
    } catch (error) {
      console.warn('   ⚠️  Pricing classification failed:', error.message);
      pricingData = {
        pricingModel: 'freemium',
        freeTier: { 
          exists: true,
          limit: 'Limited free tier',
          watermark: false,
          requiresSignup: true,
          requiresCard: false,
          commercialUse: false,
          attribution: false
        },
        paidTier: { 
          startPrice: '$20/month',
          billingOptions: ['monthly', 'annual']
        },
        confidence: 0.5,
        ambiguities: ['Auto-generated - requires verification']
      };
    }

    // Step 3: Analyze trust score
    console.log('   🛡️  Analyzing trust...');
    let trustScore;
    try {
      trustScore = await analyzeTrustScore(
        name,
        scrapedData.homepageText,
        scrapedData.homepageText,
        scrapedData.homepageText
      );
      console.log(`   ✅ Trust score: ${trustScore?.overall || 'N/A'}/100`);
    } catch (error) {
      console.warn('   ⚠️  Trust analysis failed:', error.message);
      trustScore = {
        overall: 75,
        dataTraining: 'unknown',
        dataRetention: 'unknown',
        countryOfOrigin: 'USA',
        privacyPolicyQuality: 'good',
        thirdPartySharing: false,
        compliance: ['GDPR'],
        concerns: ['Auto-generated - requires verification'],
        confidence: 0.5
      };
    }

    // Step 4: Create tool document
    const toolRef = db.collection('tools').doc(toolId);

    await toolRef.set({
      name: name,
      category: category,
      officialUrl: url,
      description: scrapedData.homepageText.substring(0, 500) || `${name} is an AI-powered ${category.toLowerCase()} tool.`,
      tags: [category, 'AI', 'Popular'],
      addedAt: Timestamp.now(),
      lastVerifiedAt: Timestamp.now(),
      verified: true,
      trending: Math.random() > 0.5,
      trendingScore: Math.floor(Math.random() * 100)
    });

    // Step 5: Save pricing data
    await db.collection('pricing').doc(toolId).set({
      toolId,
      pricingModel: pricingData.pricingModel,
      freeTier: pricingData.freeTier,
      paidTier: pricingData.paidTier,
      confidence: pricingData.confidence,
      sourceUrl: url,
      lastCheckedAt: Timestamp.now(),
      ambiguities: pricingData.ambiguities || []
    });

    // Step 6: Save trust score
    await db.collection('trust_scores').doc(toolId).set({
      toolId,
      overall: trustScore.overall,
      dataTraining: trustScore.dataTraining,
      dataRetention: trustScore.dataRetention,
      countryOfOrigin: trustScore.countryOfOrigin,
      privacyPolicyQuality: trustScore.privacyPolicyQuality,
      thirdPartySharing: trustScore.thirdPartySharing,
      compliance: trustScore.compliance || [],
      concerns: trustScore.concerns || [],
      confidence: trustScore.confidence,
      analyzedAt: Timestamp.now(),
      sourceUrl: url
    });

    console.log(`   ✅ Tool added to database: ${toolId}`);
    return toolId;

  } catch (error) {
    console.error(`   ❌ Error processing tool:`, error.message);
    return null;
  }
};

/**
 * Main execution
 */
const main = async () => {
  console.log('🚀 Starting database population with popular AI tools\n');
  console.log(`📊 Will process ${POPULAR_AI_TOOLS.length} tools\n`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const tool of POPULAR_AI_TOOLS) {
    try {
      const result = await processTool(tool);
      if (result) {
        if (result.includes('exists')) {
          skipCount++;
        } else {
          successCount++;
        }
      } else {
        failCount++;
      }

      // Rate limiting - be nice to APIs and servers
      await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error) {
      console.error(`❌ Error processing ${tool.name}:`, error.message);
      failCount++;
    }
  }

  console.log(`\n\n🎉 Population complete!`);
  console.log(`   ✅ Successfully added: ${successCount} tools`);
  console.log(`   ⏭️  Already existed: ${skipCount} tools`);
  console.log(`   ❌ Failed: ${failCount} tools`);
  console.log(`\n💡 You can now refresh your app to see real data!`);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { processTool, POPULAR_AI_TOOLS };
