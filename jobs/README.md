# AIscout Background Jobs

Background jobs for web scraping and AI classification, designed to run on Google Cloud Run Jobs.

## Jobs

### 1. Scraper (`scraper.js`)
Web scraping job using Playwright to extract content from tool websites.

**Usage:**
```bash
# Process pending jobs
node scraper.js

# Scrape a specific URL (for testing)
node scraper.js --url https://example.com
```

### 2. Classifier (`classifier.js`)
AI-powered classification using Google Gemini to extract pricing information.

**Usage:**
```bash
# Process pending classification jobs
node classifier.js
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
```bash
GEMINI_API_KEY=your-key
FIREBASE_SERVICE_ACCOUNT_KEY='{"projectId":"..."}'
```

## Deployment to Cloud Run Jobs

### Deploy Scraper Job

```bash
# Build and push image
gcloud builds submit --config cloudbuild.yaml

# Create Cloud Run Job
gcloud run jobs create aiscout-scraper \
  --image gcr.io/[PROJECT-ID]/aiscout-scraper:latest \
  --region us-central1 \
  --set-env-vars GEMINI_API_KEY=your-key \
  --max-retries 3 \
  --task-timeout 600s
```

### Deploy Classifier Job

```bash
# Create classifier job (uses same image, different command)
gcloud run jobs create aiscout-classifier \
  --image gcr.io/[PROJECT-ID]/aiscout-scraper:latest \
  --region us-central1 \
  --command node \
  --args classifier.js \
  --set-env-vars GEMINI_API_KEY=your-key \
  --max-retries 3 \
  --task-timeout 300s
```

## Scheduling

Use Cloud Scheduler to run jobs periodically:

```bash
# Run scraper every hour
gcloud scheduler jobs create http aiscout-scraper-hourly \
  --location us-central1 \
  --schedule "0 * * * *" \
  --uri "https://us-central1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/[PROJECT-ID]/jobs/aiscout-scraper:run" \
  --http-method POST \
  --oauth-service-account-email [SERVICE-ACCOUNT]@[PROJECT-ID].iam.gserviceaccount.com

# Run classifier every 15 minutes
gcloud scheduler jobs create http aiscout-classifier-frequent \
  --location us-central1 \
  --schedule "*/15 * * * *" \
  --uri "https://us-central1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/[PROJECT-ID]/jobs/aiscout-classifier:run" \
  --http-method POST \
  --oauth-service-account-email [SERVICE-ACCOUNT]@[PROJECT-ID].iam.gserviceaccount.com
```

## Workflow

1. Admin triggers analysis via `/api/admin/analyze` → Creates job in `analysis_jobs` collection
2. Scraper job processes pending jobs → Scrapes website, updates status to `pending_classification`
3. Classifier job processes classification → Extracts pricing using AI, saves to `pricing` collection
4. Frontend displays updated pricing information

