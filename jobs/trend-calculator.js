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

/**
 * Calculate trend score for all tools
 * Formula: (mentions_last_7_days / total_mentions) * 100
 */
const calculateTrendScores = async () => {
  console.log('📊 Calculating trend scores...');

  const sevenDaysAgo = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const now = Timestamp.now();

  // Get all tools
  const toolsSnapshot = await db.collection('tools').get();

  if (toolsSnapshot.empty) {
    console.log('📭 No tools found');
    return;
  }

  console.log(`📋 Processing ${toolsSnapshot.size} tools...`);

  let updated = 0;

  for (const toolDoc of toolsSnapshot.docs) {
    const toolId = toolDoc.id;
    const toolData = toolDoc.data();

    // Get mentions in the last 7 days
    const recentMentionsSnapshot = await db.collection('mentions')
      .where('toolId', '==', toolId)
      .where('mentionedAt', '>=', sevenDaysAgo)
      .where('mentionedAt', '<=', now)
      .get();

    const mentionsLast7Days = recentMentionsSnapshot.size;
    const totalMentions = toolData.mentionCount || 0;

    // Calculate trend score
    let trendScore = 0;
    if (totalMentions > 0) {
      trendScore = Math.round((mentionsLast7Days / totalMentions) * 100);
    } else if (mentionsLast7Days > 0) {
      // New tools with recent mentions get high score
      trendScore = Math.min(100, mentionsLast7Days * 10);
    }

    // Update tool if trend score changed
    if (toolData.trendScore !== trendScore) {
      await db.collection('tools').doc(toolId).update({
        trendScore,
        lastTrendCalculation: Timestamp.now()
      });
      updated++;
      console.log(`✅ Updated ${toolData.name}: ${toolData.trendScore} → ${trendScore}%`);
    }
  }

  console.log(`✅ Updated ${updated} tools`);
};

// Main execution
const main = async () => {
  try {
    await calculateTrendScores();
    console.log('🎉 Trend score calculation complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error calculating trend scores:', error);
    process.exit(1);
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { calculateTrendScores };

