import fetch from 'node-fetch';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import { scrapeToolWebsite } from './scraper.js';
import { classifyPricing, extractToolName } from './classifier.js';
import { analyzeTrustScore } from './trust-analyzer.js';
import { GoogleGenAI } from '@google/genai';

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

// Initialize Gemini AI
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not set');
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Fetch AI tool posts from Reddit
 */
const fetchRedditPosts = async () => {
  console.log('🔍 Fetching posts from Reddit...');
  
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Reddit API credentials not found. Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET');
  }

  // Get OAuth token
  const authResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!authResponse.ok) {
    throw new Error(`Reddit auth failed: ${authResponse.statusText}`);
  }

  const authData = await authResponse.json();
  const accessToken = authData.access_token;

  // Fetch posts from multiple AI-related subreddits
  const subreddits = [
    'artificialinteligence',
    'ChatGPT',
    'StableDiffusion',
    'MachineLearning',
    'ArtificialIntelligence',
    'OpenAI',
    'AITools'
  ];

  const allPosts = [];

  for (const subreddit of subreddits) {
    try {
      console.log(`  📡 Fetching from r/${subreddit}...`);
      
      const response = await fetch(
        `https://oauth.reddit.com/r/${subreddit}/hot?limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'AIRadar/1.0'
          }
        }
      );

      if (!response.ok) {
        console.warn(`    ⚠️  Failed to fetch r/${subreddit}: ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      const posts = data.data.children.map(child => child.data);
      
      console.log(`    ✅ Got ${posts.length} posts from r/${subreddit}`);
      allPosts.push(...posts);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`    ❌ Error fetching r/${subreddit}:`, error.message);
    }
  }

  console.log(`\n✅ Total posts fetched: ${allPosts.length}`);
  return allPosts;
};

/**
 * Extract tool URL from post using Gemini AI
 */
const extractToolUrl = async (post) => {
  const ai = getAI();
  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `Analyze this Reddit post and extract the official website URL of any AI tool mentioned:

Title: ${post.title}
Text: ${post.selftext || ''}
URL: ${post.url || ''}

Return ONLY valid JSON:
{
  "toolUrl": "official website URL or null",
  "toolName": "tool name or null",
  "category": "Image Generation" | "Video Editing" | "Writing Assistant" | "Code Generation" | "Audio/Music" | "3D/Design" | "Productivity" | "Data Analysis" | null,
  "confidence": 0.0-1.0
}

Rules:
- toolUrl should be the official website, not reddit, youtube, twitter, etc.
- Only return a URL if you're confident it's the tool's official site
- Extract the category based on what the tool does
- Return null if no clear tool or URL is found`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return { toolUrl: null, toolName: null, category: null, confidence: 0 };
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('    ⚠️  Error extracting tool URL:', error.message);
    return { toolUrl: null, toolName: null, category: null, confidence: 0 };
  }
};

/**
 * Process a single tool
 */
const processTool = async (toolData) => {
  const { toolUrl, toolName, category } = toolData;

  console.log(`\n🔧 Processing: ${toolName}`);
  console.log(`   URL: ${toolUrl}`);
  console.log(`   Category: ${category}`);

  try {
    // Check if tool already exists
    const existingTool = await db.collection('tools')
      .where('officialUrl', '==', toolUrl)
      .limit(1)
      .get();

    if (!existingTool.empty) {
      console.log('   ⏭️  Tool already exists in database');
      return existingTool.docs[0].id;
    }

    // Step 1: Scrape website
    console.log('   🌐 Scraping website...');
    let scrapedData;
    try {
      scrapedData = await scrapeToolWebsite(toolUrl);
      console.log('   ✅ Website scraped');
    } catch (error) {
      console.warn('   ⚠️  Scraping failed:', error.message);
      scrapedData = {
        homepageText: '',
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
        pricingModel: 'unknown',
        freeTier: { exists: false },
        paidTier: { startPrice: 'N/A' },
        confidence: 0
      };
    }

    // Step 3: Analyze trust score
    console.log('   🛡️  Analyzing trust...');
    let trustScore;
    try {
      trustScore = await analyzeTrustScore(
        toolName,
        scrapedData.homepageText,
        scrapedData.homepageText,
        scrapedData.homepageText
      );
      console.log(`   ✅ Trust score: ${trustScore?.overall || 'N/A'}/100`);
    } catch (error) {
      console.warn('   ⚠️  Trust analysis failed:', error.message);
      trustScore = null;
    }

    // Step 4: Create tool document
    const toolId = toolName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const toolRef = db.collection('tools').doc(toolId);

    await toolRef.set({
      name: toolName,
      category: category || 'Other',
      officialUrl: toolUrl,
      description: scrapedData.homepageText.substring(0, 500) || `AI tool: ${toolName}`,
      tags: [category].filter(Boolean),
      addedAt: Timestamp.now(),
      lastVerifiedAt: Timestamp.now(),
      verified: true
    });

    // Step 5: Save pricing data
    if (pricingData) {
      await db.collection('pricing').doc(toolId).set({
        toolId,
        pricingModel: pricingData.pricingModel,
        freeTier: pricingData.freeTier,
        paidTier: pricingData.paidTier,
        confidence: pricingData.confidence,
        sourceUrl: toolUrl,
        lastCheckedAt: Timestamp.now()
      });
    }

    // Step 6: Save trust score
    if (trustScore) {
      await db.collection('trust_scores').doc(toolId).set({
        toolId,
        overall: trustScore.overall,
        dataTraining: trustScore.dataTraining,
        dataRetention: trustScore.dataRetention,
        countryOfOrigin: trustScore.countryOfOrigin,
        privacyPolicyQuality: trustScore.privacyPolicyQuality,
        thirdPartySharing: trustScore.thirdPartySharing,
        compliance: trustScore.compliance,
        concerns: trustScore.concerns,
        confidence: trustScore.confidence,
        analyzedAt: Timestamp.now(),
        sourceUrl: toolUrl
      });
    }

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
  console.log('🚀 Starting Reddit-based tool population\n');

  // Fetch Reddit posts
  const posts = await fetchRedditPosts();

  console.log('\n🤖 Analyzing posts with AI...\n');

  const toolsToProcess = [];
  let processed = 0;

  for (const post of posts) {
    try {
      console.log(`📝 Post: ${post.title.substring(0, 60)}...`);
      
      // Extract tool information
      const extracted = await extractToolUrl(post);

      if (extracted.toolUrl && extracted.confidence > 0.5) {
        console.log(`   ✅ Found: ${extracted.toolName} (confidence: ${extracted.confidence})`);
        toolsToProcess.push(extracted);
      } else {
        console.log(`   ⏭️  Skipped (no tool or low confidence)`);
      }

      processed++;

      // Rate limiting - be nice to Gemini API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Process first 50 posts to avoid hitting rate limits
      if (processed >= 50) {
        console.log('\n⚠️  Reached 50 posts limit (rate limiting)\n');
        break;
      }

    } catch (error) {
      console.error(`   ❌ Error analyzing post:`, error.message);
    }
  }

  // Remove duplicates
  const uniqueTools = [];
  const seenUrls = new Set();

  for (const tool of toolsToProcess) {
    if (!seenUrls.has(tool.toolUrl)) {
      seenUrls.add(tool.toolUrl);
      uniqueTools.push(tool);
    }
  }

  console.log(`\n📊 Found ${uniqueTools.length} unique tools to process\n`);

  // Process each tool
  let successCount = 0;

  for (const tool of uniqueTools) {
    try {
      const toolId = await processTool(tool);
      if (toolId) {
        successCount++;
      }

      // Rate limiting between tools
      await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error) {
      console.error(`❌ Error processing tool:`, error.message);
    }
  }

  console.log(`\n\n🎉 Population complete!`);
  console.log(`   ✅ Successfully added: ${successCount} tools`);
  console.log(`   ❌ Failed: ${uniqueTools.length - successCount} tools`);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { fetchRedditPosts, extractToolUrl, processTool };
