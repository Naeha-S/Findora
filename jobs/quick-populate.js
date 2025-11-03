// Quick populate script - adds 5 popular AI tools with minimal scraping
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase
const initializeFirebase = () => {
  if (getApps().length > 0) return getFirestore();
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    initializeApp({ credential: cert(serviceAccount) });
    console.log('✅ Firebase initialized\n');
    return getFirestore();
  } catch (error) {
    console.error('❌ Firebase init failed:', error.message);
    process.exit(1);
  }
};

const db = initializeFirebase();

// Sample tools with pre-filled data (no scraping needed)
const QUICK_TOOLS = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    category: 'Writing Assistant',
    url: 'https://chat.openai.com',
    description: 'ChatGPT is an AI-powered conversational agent that can help with writing, coding, analysis, and creative tasks. Built by OpenAI.',
    pricing: {
      model: 'freemium',
      freeTier: {
        exists: true,
        limit: '40 messages per 3 hours on GPT-4o',
        watermark: false,
        requiresSignup: true,
        requiresCard: false,
        commercialUse: true,
        attribution: false
      },
      paidTier: {
        startPrice: '$20/month',
        billingOptions: ['monthly']
      }
    },
    trust: {
      overall: 85,
      dataTraining: 'explicit',
      dataRetention: 'limited',
      countryOfOrigin: 'USA',
      privacyPolicyQuality: 'excellent',
      thirdPartySharing: false,
      compliance: ['GDPR', 'CCPA'],
      concerns: []
    }
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    category: 'Image Generation',
    url: 'https://www.midjourney.com',
    description: 'Midjourney is an AI art generator that creates stunning images from text descriptions. Known for artistic, high-quality outputs.',
    pricing: {
      model: 'paid',
      freeTier: {
        exists: false,
        limit: 'N/A',
        watermark: false,
        requiresSignup: true,
        requiresCard: true,
        commercialUse: false,
        attribution: false
      },
      paidTier: {
        startPrice: '$10/month',
        billingOptions: ['monthly', 'annual']
      }
    },
    trust: {
      overall: 78,
      dataTraining: 'explicit',
      dataRetention: 'permanent',
      countryOfOrigin: 'USA',
      privacyPolicyQuality: 'good',
      thirdPartySharing: false,
      compliance: ['GDPR'],
      concerns: ['Images used for training']
    }
  },
  {
    id: 'claude',
    name: 'Claude',
    category: 'Writing Assistant',
    url: 'https://claude.ai',
    description: 'Claude is Anthropic\'s AI assistant focused on being helpful, harmless, and honest. Great for complex reasoning and long conversations.',
    pricing: {
      model: 'freemium',
      freeTier: {
        exists: true,
        limit: 'Limited messages on Claude 3.5 Sonnet',
        watermark: false,
        requiresSignup: true,
        requiresCard: false,
        commercialUse: true,
        attribution: false
      },
      paidTier: {
        startPrice: '$20/month',
        billingOptions: ['monthly']
      }
    },
    trust: {
      overall: 88,
      dataTraining: 'no-training',
      dataRetention: 'minimal',
      countryOfOrigin: 'USA',
      privacyPolicyQuality: 'excellent',
      thirdPartySharing: false,
      compliance: ['GDPR', 'CCPA'],
      concerns: []
    }
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    category: 'Code Generation',
    url: 'https://github.com/features/copilot',
    description: 'GitHub Copilot is an AI pair programmer that helps you write code faster. Powered by OpenAI Codex.',
    pricing: {
      model: 'paid',
      freeTier: {
        exists: true,
        limit: 'Free for students and open source maintainers',
        watermark: false,
        requiresSignup: true,
        requiresCard: false,
        commercialUse: true,
        attribution: false
      },
      paidTier: {
        startPrice: '$10/month',
        billingOptions: ['monthly', 'annual']
      }
    },
    trust: {
      overall: 82,
      dataTraining: 'explicit',
      dataRetention: 'limited',
      countryOfOrigin: 'USA',
      privacyPolicyQuality: 'excellent',
      thirdPartySharing: false,
      compliance: ['GDPR', 'CCPA'],
      concerns: ['Code suggestions may match training data']
    }
  },
  {
    id: 'runway',
    name: 'Runway',
    category: 'Video Editing',
    url: 'https://runwayml.com',
    description: 'Runway is an AI-powered creative suite for video editing, including text-to-video, image-to-video, and advanced editing tools.',
    pricing: {
      model: 'freemium',
      freeTier: {
        exists: true,
        limit: '125 credits (about 5 seconds of video)',
        watermark: true,
        requiresSignup: true,
        requiresCard: false,
        commercialUse: false,
        attribution: true
      },
      paidTier: {
        startPrice: '$12/month',
        billingOptions: ['monthly', 'annual']
      }
    },
    trust: {
      overall: 75,
      dataTraining: 'opting-out',
      dataRetention: 'permanent',
      countryOfOrigin: 'USA',
      privacyPolicyQuality: 'good',
      thirdPartySharing: false,
      compliance: ['GDPR'],
      concerns: ['Generated content may be used for training']
    }
  }
];

// Add tools to Firestore
const populateTools = async () => {
  console.log('🚀 Starting quick population...\n');
  console.log(`📊 Will add ${QUICK_TOOLS.length} popular AI tools\n`);

  let successCount = 0;

  for (const tool of QUICK_TOOLS) {
    try {
      console.log(`\n🔧 Processing: ${tool.name}`);
      
      // Check if exists
      const existingDoc = await db.collection('tools').doc(tool.id).get();
      if (existingDoc.exists) {
        console.log('   ⏭️  Already exists, skipping');
        continue;
      }

      // Add tool
      const now = Timestamp.now();
      await db.collection('tools').doc(tool.id).set({
        name: tool.name,
        category: tool.category,
        officialUrl: tool.url,
        description: tool.description,
        tags: [tool.category, 'AI', 'Popular'],
        addedAt: now,
        firstSeenAt: now,
        lastVerifiedAt: now,
        verified: true,
        trending: true,
        trendingScore: 80 + Math.floor(Math.random() * 20),
        mentionCount: 100 + Math.floor(Math.random() * 900),
        trendScore: 80 + Math.floor(Math.random() * 20)
      });
      console.log('   ✅ Tool added');

      // Add pricing
      await db.collection('pricing').doc(tool.id).set({
        toolId: tool.id,
        pricingModel: tool.pricing.model,
        freeTier: tool.pricing.freeTier,
        paidTier: tool.pricing.paidTier,
        confidence: 0.95,
        sourceUrl: tool.url,
        lastCheckedAt: Timestamp.now()
      });
      console.log('   ✅ Pricing added');

      // Add trust score
      await db.collection('trust_scores').doc(tool.id).set({
        toolId: tool.id,
        overall: tool.trust.overall,
        dataTraining: tool.trust.dataTraining,
        dataRetention: tool.trust.dataRetention,
        countryOfOrigin: tool.trust.countryOfOrigin,
        privacyPolicyQuality: tool.trust.privacyPolicyQuality,
        thirdPartySharing: tool.trust.thirdPartySharing,
        compliance: tool.trust.compliance,
        concerns: tool.trust.concerns,
        confidence: 0.9,
        analyzedAt: Timestamp.now(),
        sourceUrl: tool.url
      });
      console.log('   ✅ Trust score added');

      successCount++;
      console.log(`   🎉 ${tool.name} fully populated!`);

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n\n' + '='.repeat(50));
  console.log(`✨ Population complete!`);
  console.log(`✅ Successfully added: ${successCount} tools`);
  console.log('='.repeat(50));
  console.log('\n💡 Now refresh your browser at http://localhost:3000\n');
};

populateTools()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
