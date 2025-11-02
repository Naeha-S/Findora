import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let db = null;

export const initializeFirebaseAdmin = () => {
  if (getApps().length > 0) {
    db = getFirestore();
    console.log('✅ Firebase Admin already initialized');
    return db;
  }

  try {
    // For Cloud Run, use default credentials
    // For local dev, you can use service account key from environment
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({
        credential: cert(serviceAccount)
      });
    } else {
      // Use default credentials (Cloud Run, GCP environment)
      initializeApp();
    }

    db = getFirestore();
    console.log('✅ Firebase Admin initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error);
    throw error;
  }
};

export const getFirestoreAdmin = () => {
  if (!db) {
    throw new Error('Firebase Admin not initialized. Call initializeFirebaseAdmin() first.');
  }
  return db;
};

