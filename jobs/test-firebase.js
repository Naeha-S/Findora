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
      console.log('✅ Firebase initialized successfully');
    } else {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not set');
    }
    return getFirestore();
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error.message);
    throw error;
  }
};

const db = initializeFirebase();

// Test adding a simple tool
const testTool = {
  name: 'Test Tool',
  category: 'Writing Assistant',
  officialUrl: 'https://example.com',
  description: 'This is a test tool',
  tags: ['Test'],
  addedAt: Timestamp.now(),
  lastVerifiedAt: Timestamp.now(),
  verified: true
};

console.log('📝 Adding test tool...');

db.collection('tools').doc('test-tool').set(testTool)
  .then(() => {
    console.log('✅ Test tool added successfully!');
    console.log('\n📊 Checking if we can read it back...');
    return db.collection('tools').doc('test-tool').get();
  })
  .then((doc) => {
    if (doc.exists) {
      console.log('✅ Successfully read test tool:');
      console.log(JSON.stringify(doc.data(), null, 2));
      console.log('\n🎉 Firebase connection is working!');
    } else {
      console.log('❌ Could not read test tool');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
