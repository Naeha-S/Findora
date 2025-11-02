import express from 'express';
import { getFirestoreAdmin } from '../firebase-admin.js';

const router = express.Router();

// GET /api/categories - Get all categories with tool counts
router.get('/', async (req, res) => {
  try {
    const db = getFirestoreAdmin();
    const snapshot = await db.collection('tools').get();
    
    const counts = {};
    snapshot.docs.forEach(doc => {
      const category = doc.data().category;
      if (category) {
        counts[category] = (counts[category] || 0) + 1;
      }
    });

    const categories = Object.keys(counts).map(category => ({
      name: category,
      count: counts[category]
    })).sort((a, b) => b.count - a.count);

    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
  }
});

export { router as categoriesRouter };

