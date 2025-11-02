import express from 'express';
import { getFirestoreAdmin } from '../firebase-admin.js';

const router = express.Router();

// Middleware to check for admin authorization (add your auth logic here)
const requireAdmin = (req, res, next) => {
  // For Cloud Run, you can check for a header or environment variable
  const adminKey = req.headers['x-admin-key'] || req.body.adminKey;
  const expectedKey = process.env.ADMIN_API_KEY;

  if (!expectedKey) {
    console.warn('⚠️  ADMIN_API_KEY not set, allowing all requests');
    return next();
  }

  if (adminKey !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

// POST /api/admin/analyze - Trigger tool analysis
router.post('/analyze', requireAdmin, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // TODO: This should trigger a Cloud Run Job for web scraping
    // For now, we'll just queue it or return a job ID
    const db = getFirestoreAdmin();
    
    // Create analysis job document
    const jobDoc = {
      url,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const jobRef = await db.collection('analysis_jobs').add(jobDoc);

    // In production, this would trigger a Cloud Run Job
    // For now, return the job ID
    res.json({
      jobId: jobRef.id,
      status: 'queued',
      message: 'Analysis job queued. In production, this would trigger web scraping and AI classification.'
    });

    // TODO: Trigger Cloud Run Job via Cloud Tasks or Pub/Sub
    // await triggerScrapingJob(url, jobRef.id);

  } catch (error) {
    console.error('Error creating analysis job:', error);
    res.status(500).json({ error: 'Failed to create analysis job', details: error.message });
  }
});

export { router as adminRouter };

