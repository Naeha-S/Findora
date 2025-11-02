/**
 * Migration script to populate Firestore with mock data
 * Run with: npx tsx scripts/migrate-to-firestore.ts
 * 
 * Note: This script requires Firebase Admin SDK or a service account
 * For client-side, use the browser console or a separate admin tool
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initialTools } from '../data/mockData';

// Initialize Firebase Admin (you'll need to set up a service account)
// For now, this is a template - you'll need to configure Firebase Admin properly
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    // You'll need to set up Firebase Admin with a service account
    // For now, this is commented out as it requires service account credentials
    /*
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    */
    console.log('⚠️  Firebase Admin not configured. Please set up service account credentials.');
    return null;
  }
  return getFirestore();
};

const migrateTools = async () => {
  const db = initializeFirebaseAdmin();
  if (!db) {
    console.log('❌ Cannot proceed without Firebase Admin setup');
    return;
  }

  console.log(`📦 Migrating ${initialTools.length} tools to Firestore...`);

  const batch = db.batch();
  let count = 0;

  for (const tool of initialTools) {
    const toolRef = db.collection('tools').doc(tool.id);
    
    // Convert ISO strings to Timestamps
    const toolData = {
      name: tool.name,
      description: tool.description,
      category: tool.category,
      officialUrl: tool.officialUrl,
      firstSeenAt: Timestamp.fromDate(new Date(tool.firstSeenAt)),
      lastVerifiedAt: Timestamp.fromDate(new Date(tool.lastVerifiedAt)),
      mentionCount: tool.mentionCount,
      trendScore: tool.trendScore,
      status: 'active',
    };

    batch.set(toolRef, toolData);

    // Create pricing document
    const pricingRef = db.collection('pricing').doc(tool.id);
    const pricingData = {
      toolId: tool.id,
      pricingModel: tool.pricing.model,
      freeTier: {
        exists: tool.pricing.freeTier.exists,
        limit: tool.pricing.freeTier.limit,
        watermark: tool.pricing.freeTier.watermark,
        requiresSignup: tool.pricing.freeTier.requiresSignup,
        requiresCard: tool.pricing.freeTier.requiresCard,
        commercialUse: tool.pricing.freeTier.commercialUse,
        attribution: tool.pricing.freeTier.attribution,
      },
      paidTier: {
        startPrice: tool.pricing.paidTier.startPrice,
        billingOptions: tool.pricing.paidTier.billingOptions,
      },
      confidence: tool.pricing.confidence,
      sourceUrl: tool.pricing.sourceUrl,
      lastCheckedAt: Timestamp.fromDate(new Date(tool.pricing.lastCheckedAt)),
    };

    batch.set(pricingRef, pricingData);

    count++;
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`✅ Migrated ${count} tools...`);
    }
  }

  await batch.commit();
  console.log(`✅ Successfully migrated ${initialTools.length} tools to Firestore!`);
};

// Run migration
if (require.main === module) {
  migrateTools()
    .then(() => {
      console.log('🎉 Migration complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export { migrateTools };
