# AIscout Backend API

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the backend directory:
   ```env
   PORT=8080
   GEMINI_API_KEY=your-gemini-api-key
   API_KEY=your-gemini-api-key
   NODE_ENV=development
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Start Production Server**
   ```bash
   npm start
   ```

## API Endpoints

- `GET /health` - Health check
- `GET /api/tools` - List all tools
- `GET /api/categories` - List all categories
- `POST /api/workflows/generate` - Generate AI workflow
- `POST /api/admin/classify` - Classify tools (admin)

## Firebase Admin Setup

The backend uses Firebase Admin SDK. For local development:
1. You can use a service account key (set `FIREBASE_SERVICE_ACCOUNT_KEY` in .env)
2. Or use default credentials if running on GCP/Cloud Run

For Cloud Run deployment, the backend will automatically use default GCP credentials.
