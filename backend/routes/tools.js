import express from 'express';
import { getFirestoreAdmin } from '../firebase-admin.js';
import { Timestamp } from 'firebase-admin/firestore';

const router = express.Router();

// GET /api/tools - Get tools with filters
router.get('/', async (req, res) => {
  try {
    const db = getFirestoreAdmin();
    const {
      sort = 'freshness',
      category,
      pricing,
      truly_free,
      limit: limitParam = 20,
      offset: offsetParam = 0
    } = req.query;

    const limitCount = parseInt(limitParam, 10);
    const offset = parseInt(offsetParam, 10);

    let query = db.collection('tools');

    // Apply filters
    if (category) {
      query = query.where('category', '==', category);
    }

    // Apply sorting
    switch (sort) {
      case 'freshness':
        query = query.orderBy('firstSeenAt', 'desc');
        break;
      case 'trending':
        query = query.orderBy('trendScore', 'desc');
        break;
      case 'mentions':
        query = query.orderBy('mentionCount', 'desc');
        break;
      default:
        query = query.orderBy('firstSeenAt', 'desc');
    }

    // Apply limit and offset
    query = query.limit(limitCount + offset + 1);

    const snapshot = await query.get();
    const tools = [];

    // Fetch pricing for each tool
    for (const doc of snapshot.docs.slice(offset, offset + limitCount)) {
      const toolData = doc.data();
      const pricingDoc = await db.collection('pricing').doc(doc.id).get();
      
      let pricingData = null;
      if (pricingDoc.exists) {
        pricingData = pricingDoc.data();
      }

      // Convert Firestore timestamps to ISO strings
      const tool = {
        id: doc.id,
        name: toolData.name || '',
        description: toolData.description || '',
        category: toolData.category || '',
        officialUrl: toolData.officialUrl || '',
        firstSeenAt: toolData.firstSeenAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastVerifiedAt: toolData.lastVerifiedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        mentionCount: toolData.mentionCount || 0,
        trendScore: toolData.trendScore || 0,
        pricing: pricingData ? {
          model: pricingData.pricingModel || 'free',
          freeTier: {
            exists: pricingData.freeTier?.exists || false,
            limit: pricingData.freeTier?.limit || 'N/A',
            watermark: pricingData.freeTier?.watermark || false,
            requiresSignup: pricingData.freeTier?.requiresSignup || false,
            requiresCard: pricingData.freeTier?.requiresCard || false,
            commercialUse: pricingData.freeTier?.commercialUse || false,
            attribution: pricingData.freeTier?.attribution || false
          },
          paidTier: {
            startPrice: pricingData.paidTier?.startPrice || 'N/A',
            billingOptions: pricingData.paidTier?.billingOptions || []
          },
          confidence: pricingData.confidence || 0,
          sourceUrl: pricingData.sourceUrl || '',
          lastCheckedAt: pricingData.lastCheckedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        } : null
      };

      // Apply client-side filters
      let include = true;

      if (pricing && tool.pricing && tool.pricing.model !== pricing) {
        include = false;
      }

      if (truly_free === 'true' && (!tool.pricing || !tool.pricing.freeTier.exists || 
          tool.pricing.freeTier.requiresCard || tool.pricing.freeTier.watermark)) {
        include = false;
      }

      if (include) {
        tools.push(tool);
      }
    }

    const hasMore = snapshot.docs.length > offset + limitCount;

    res.json({
      tools,
      total: snapshot.size,
      hasMore
    });
  } catch (error) {
    console.error('Error fetching tools:', error);
    res.status(500).json({ error: 'Failed to fetch tools', details: error.message });
  }
});

// GET /api/tools/:id - Get single tool
router.get('/:id', async (req, res) => {
  try {
    const db = getFirestoreAdmin();
    const { id } = req.params;

    const toolDoc = await db.collection('tools').doc(id).get();
    if (!toolDoc.exists) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    const toolData = toolDoc.data();
    const pricingDoc = await db.collection('pricing').doc(id).get();
    
    let pricingData = null;
    if (pricingDoc.exists) {
      pricingData = pricingDoc.data();
    }

    const tool = {
      id: toolDoc.id,
      name: toolData.name || '',
      description: toolData.description || '',
      category: toolData.category || '',
      officialUrl: toolData.officialUrl || '',
      firstSeenAt: toolData.firstSeenAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      lastVerifiedAt: toolData.lastVerifiedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      mentionCount: toolData.mentionCount || 0,
      trendScore: toolData.trendScore || 0,
      pricing: pricingData ? {
        model: pricingData.pricingModel || 'free',
        freeTier: {
          exists: pricingData.freeTier?.exists || false,
          limit: pricingData.freeTier?.limit || 'N/A',
          watermark: pricingData.freeTier?.watermark || false,
          requiresSignup: pricingData.freeTier?.requiresSignup || false,
          requiresCard: pricingData.freeTier?.requiresCard || false,
          commercialUse: pricingData.freeTier?.commercialUse || false,
          attribution: pricingData.freeTier?.attribution || false
        },
        paidTier: {
          startPrice: pricingData.paidTier?.startPrice || 'N/A',
          billingOptions: pricingData.paidTier?.billingOptions || []
        },
        confidence: pricingData.confidence || 0,
        sourceUrl: pricingData.sourceUrl || '',
        lastCheckedAt: pricingData.lastCheckedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      } : null
    };

    res.json(tool);
  } catch (error) {
    console.error('Error fetching tool:', error);
    res.status(500).json({ error: 'Failed to fetch tool', details: error.message });
  }
});

export { router as toolsRouter };

