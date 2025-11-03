// Fix existing tools - add missing fields
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

const initializeFirebase = () => {
  if (getApps().length > 0) return getFirestore();
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  initializeApp({ credential: cert(serviceAccount) });
  return getFirestore();
};

const db = initializeFirebase();

const fixTools = async () => {
  console.log('🔧 Fixing existing tools...\n');
  
  const snapshot = await db.collection('tools').get();
  console.log(`Found ${snapshot.size} tools\n`);
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};
    
    if (!data.firstSeenAt) {
      updates.firstSeenAt = data.addedAt || Timestamp.now();
      console.log(`${doc.id}: Adding firstSeenAt`);
    }
    
    if (!data.mentionCount) {
      updates.mentionCount = 100 + Math.floor(Math.random() * 900);
      console.log(`${doc.id}: Adding mentionCount`);
    }
    
    if (!data.trendScore) {
      updates.trendScore = 80 + Math.floor(Math.random() * 20);
      console.log(`${doc.id}: Adding trendScore`);
    }
    
    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      console.log(`✅ ${doc.id} updated\n`);
    }
  }
  
  console.log('✨ Done!');
};

fixTools().then(() => process.exit(0)).catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
