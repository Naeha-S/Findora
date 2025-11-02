import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
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
 * Scrape a website for pricing and tool information
 */
export const scrapeToolWebsite = async (url) => {
  console.log(`🌐 Scraping ${url}...`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set a reasonable timeout
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Wait a bit for dynamic content
    await page.waitForTimeout(2000);

    // Get page content
    const html = await page.content();
    const $ = cheerio.load(html);

    // Extract text content (remove scripts and styles)
    $('script, style, noscript').remove();
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();

    // Try to find pricing page
    let pricingText = bodyText;
    const pricingLinks = $('a[href*="pricing"], a[href*="price"], a[href*="plan"]');
    
    if (pricingLinks.length > 0) {
      const pricingUrl = new URL(pricingLinks.first().attr('href'), url).href;
      console.log(`📄 Found pricing page: ${pricingUrl}`);
      
      try {
        await page.goto(pricingUrl, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
        const pricingHtml = await page.content();
        const $pricing = cheerio.load(pricingHtml);
        $pricing('script, style, noscript').remove();
        pricingText = $pricing('body').text().replace(/\s+/g, ' ').trim();
      } catch (err) {
        console.warn(`⚠️  Could not fetch pricing page: ${err.message}`);
      }
    }

    // Extract FAQ if available
    let faqText = '';
    const faqLinks = $('a[href*="faq"], a[href*="help"]');
    if (faqLinks.length > 0) {
      try {
        const faqUrl = new URL(faqLinks.first().attr('href'), url).href;
        await page.goto(faqUrl, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
        const faqHtml = await page.content();
        const $faq = cheerio.load(faqHtml);
        $faq('script, style, noscript').remove();
        faqText = $faq('body').text().replace(/\s+/g, ' ').trim();
      } catch (err) {
        console.warn(`⚠️  Could not fetch FAQ: ${err.message}`);
      }
    }

    await browser.close();

    return {
      homepageText: bodyText.substring(0, 10000), // Limit size
      pricingText: pricingText.substring(0, 10000),
      faqText: faqText.substring(0, 5000),
      scrapedAt: new Date().toISOString()
    };
  } catch (error) {
    await browser.close();
    console.error(`❌ Error scraping ${url}:`, error.message);
    throw error;
  }
};

/**
 * Process a single tool analysis job
 */
const processJob = async (jobId, jobData) => {
  try {
    const jobRef = db.collection('analysis_jobs').doc(jobId);
    
    // Update status to processing
    await jobRef.update({
      status: 'processing',
      updatedAt: Timestamp.now()
    });

    const { url } = jobData;
    
    // Scrape the website
    const scrapedData = await scrapeToolWebsite(url);
    
    // Store scraped data
    await jobRef.update({
      status: 'scraped',
      scrapedData,
      updatedAt: Timestamp.now()
    });

    console.log(`✅ Successfully scraped ${url}`);
    
    // Trigger classification (will be handled by classifier job)
    // For now, we'll queue it by updating status
    await jobRef.update({
      status: 'pending_classification',
      updatedAt: Timestamp.now()
    });

    return scrapedData;
  } catch (error) {
    const jobRef = db.collection('analysis_jobs').doc(jobId);
    await jobRef.update({
      status: 'failed',
      error: error.message,
      updatedAt: Timestamp.now()
    });
    throw error;
  }
};

// Main execution
const main = async () => {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Run as job processor - get pending jobs
    console.log('🔍 Looking for pending scraping jobs...');
    
    const jobsSnapshot = await db.collection('analysis_jobs')
      .where('status', '==', 'pending')
      .limit(10)
      .get();

    if (jobsSnapshot.empty) {
      console.log('📭 No pending jobs found');
      process.exit(0);
    }

    console.log(`📋 Found ${jobsSnapshot.size} pending jobs`);
    
    for (const doc of jobsSnapshot.docs) {
      try {
        await processJob(doc.id, doc.data());
      } catch (error) {
        console.error(`❌ Failed to process job ${doc.id}:`, error);
      }
    }
  } else if (args[0] === '--url') {
    // Direct URL scraping for testing
    const url = args[1];
    if (!url) {
      console.error('❌ Please provide a URL: node scraper.js --url https://example.com');
      process.exit(1);
    }

    try {
      const result = await scrapeToolWebsite(url);
      console.log('✅ Scraping complete!');
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('❌ Scraping failed:', error);
      process.exit(1);
    }
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { scrapeToolWebsite, processJob };

