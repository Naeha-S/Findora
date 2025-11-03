# 🚀 Populating Your Database with Real Data

This guide will help you populate your Firestore database with real AI tool data instead of mock data.

## 📋 Prerequisites

You have:
- ✅ Gemini API Key: `AIzaSyA-FiICEuyRia5nnaUog_QVqbLaGEvBdmk`
- ✅ Reddit Secret: `N3DhN_vhZJPCyipQYbPFx37OL2ORvw`
- ✅ Firebase Service Account JSON file

## 🎯 Quick Start - Populate with Popular Tools (RECOMMENDED)

This is the easiest way to get started. It will add 25 popular AI tools to your database.

### Step 1: Navigate to jobs folder
```powershell
cd C:\Users\nehas\Findora\jobs
```

### Step 2: Install dependencies
```powershell
npm install
```

### Step 3: Install Playwright browsers (for web scraping)
```powershell
npx playwright install chromium
```

### Step 4: Set Firebase credentials
```powershell
$env:FIREBASE_SERVICE_ACCOUNT_KEY = Get-Content -Raw 'C:\Users\nehas\Downloads\airadar-95005-firebase-adminsdk-fbsvc-82ab885175.json'
```

### Step 5: Run the population script
```powershell
npm run populate-popular
```

This will:
1. ✅ Scrape 25 popular AI tool websites (ChatGPT, Midjourney, Claude, etc.)
2. ✅ Extract pricing information using Gemini AI
3. ✅ Analyze privacy/trust scores
4. ✅ Populate Firestore with real data
5. ✅ Takes ~3-5 minutes to complete

### Step 6: Refresh your app
Once complete, refresh your frontend at http://localhost:3000 and you'll see real tools!

---

## 🔥 Advanced: Populate from Reddit (Requires Reddit App)

To use Reddit API, you need to create a Reddit application first.

### Create Reddit App

1. Go to https://www.reddit.com/prefs/apps
2. Click "Create App" or "Create Another App"
3. Fill in:
   - **Name**: AIRadar Data Scraper
   - **App type**: Choose "script"
   - **Description**: Scraping AI tool mentions
   - **About URL**: (leave blank)
   - **Redirect URI**: http://localhost:8080
4. Click "Create app"
5. You'll see:
   - **Client ID**: (string under "personal use script") - looks like `abc123xyz`
   - **Client Secret**: The one you already have: `N3DhN_vhZJPCyipQYbPFx37OL2ORvw`

### Update .env file

Edit `jobs/.env` and add your Client ID:
```bash
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=N3DhN_vhZJPCyipQYbPFx37OL2ORvw
```

### Run Reddit population
```powershell
cd C:\Users\nehas\Findora\jobs
$env:FIREBASE_SERVICE_ACCOUNT_KEY = Get-Content -Raw 'C:\Users\nehas\Downloads\airadar-95005-firebase-adminsdk-fbsvc-82ab885175.json'
npm run populate
```

This will:
1. Fetch posts from Reddit AI subreddits
2. Use Gemini AI to extract tool names and URLs
3. Scrape and analyze each tool
4. Add to Firestore

---

## 📊 What Gets Populated

Each tool will have:

### `tools` collection:
```javascript
{
  name: "ChatGPT",
  category: "Writing Assistant",
  officialUrl: "https://chat.openai.com",
  description: "AI-powered chatbot...",
  tags: ["Writing Assistant", "AI", "Popular"],
  verified: true,
  trending: true,
  trendingScore: 85
}
```

### `pricing` collection:
```javascript
{
  toolId: "chatgpt",
  pricingModel: "freemium",
  freeTier: {
    exists: true,
    limit: "20 messages per hour",
    watermark: false,
    requiresSignup: true,
    requiresCard: false,
    commercialUse: true
  },
  paidTier: {
    startPrice: "$20/month",
    billingOptions: ["monthly"]
  },
  confidence: 0.95
}
```

### `trust_scores` collection:
```javascript
{
  toolId: "chatgpt",
  overall: 85,
  dataTraining: "explicit",
  dataRetention: "limited",
  countryOfOrigin: "USA",
  privacyPolicyQuality: "excellent",
  thirdPartySharing: false,
  compliance: ["GDPR", "CCPA"],
  concerns: []
}
```

---

## 🔧 Troubleshooting

### "Error: GEMINI_API_KEY not set"
Make sure the `.env` file exists in the `jobs` folder with your API key.

### "Error initializing Firebase"
Make sure you've set the environment variable:
```powershell
$env:FIREBASE_SERVICE_ACCOUNT_KEY = Get-Content -Raw 'C:\Users\nehas\Downloads\airadar-95005-firebase-adminsdk-fbsvc-82ab885175.json'
```

### "Playwright not installed"
Run:
```powershell
npx playwright install chromium
```

### "Too many API requests"
The scripts include rate limiting, but if you hit API limits:
- Wait a few minutes
- The script will resume from where it left off (checks for existing tools)

### Tools already exist
If you run the script again, it will skip tools that are already in the database.

---

## 🎨 Customizing the Tool List

Edit `populate-popular-tools.js` and modify the `POPULAR_AI_TOOLS` array to add your own tools:

```javascript
const POPULAR_AI_TOOLS = [
  { name: 'Your Tool', url: 'https://yourtool.com', category: 'Image Generation' },
  // ... add more
];
```

Categories available:
- Image Generation
- Image Editing
- Video Editing
- Writing Assistant
- Code Generation
- Audio/Music
- 3D/Design
- Productivity
- Data Analysis

---

## 📈 Next Steps

After population:

1. **Check Firestore Console**: 
   - Go to https://console.firebase.google.com/project/airadar-95005/firestore
   - You should see `tools`, `pricing`, and `trust_scores` collections

2. **Refresh Frontend**: 
   - Your app at http://localhost:3000 will now show real data
   - No more 404 errors for trust scores!

3. **Update Regularly**:
   - Run `npm run populate-popular` weekly to refresh pricing/trust data
   - Tools change pricing frequently

4. **Production**:
   - Set up these scripts as Cloud Functions or Cloud Run jobs
   - Schedule automatic updates

---

## 💡 Tips

- Start with `populate-popular` - it's faster and doesn't need Reddit API
- The scripts are idempotent - safe to run multiple times
- Each tool takes ~10-15 seconds to process (scraping + AI analysis)
- Processing 25 tools takes ~5 minutes
- Reddit population can find 50+ tools but takes longer

Enjoy your fully populated AI tool database! 🎉
