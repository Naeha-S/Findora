import { GoogleGenAI } from "@google/genai";
import { Tool, TrustScore } from "../types";

// Initialize Gemini AI (for browser - uses Vite env vars)
const getAI = () => {
  // Use the correct type assertion to access Vite-specific env vars
  const viteMeta = import.meta as unknown as { env: Record<string, string | undefined> };
  const apiKey = viteMeta.env.VITE_GEMINI_API_KEY || viteMeta.env.VITE_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not set');
  }
  return new GoogleGenAI({ apiKey });
};

// Analyze privacy policy and terms of service for a tool
export const analyzeTrustScore = async (
  toolName: string,
  privacyPolicyText: string,
  termsOfServiceText: string,
  homepageText: string
): Promise<any> => {
  const ai = getAI();
  // getGenerativeModel is not typed in the GoogleGenAI package, so we use 'as any' as a workaround.
  // Remove @ts-expect-error directive as it is unnecessary if we are casting to 'any' above.
  const model = (ai as any).getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Analyze the privacy and trustworthiness of "${toolName}" based on the following documents.

PRIVACY POLICY:
${privacyPolicyText.substring(0, 8000)}

TERMS OF SERVICE:
${termsOfServiceText.substring(0, 8000)}

HOMEPAGE/ABOUT:
${homepageText.substring(0, 3000)}

Analyze and return ONLY valid JSON in this exact format:
{
  "overall": 0-100,
  "dataTraining": "explicit" | "opting-out" | "unknown" | "no-training",
  "dataRetention": "permanent" | "limited" | "minimal" | "unknown",
  "countryOfOrigin": "country name or 'unknown'",
  "privacyPolicyQuality": "excellent" | "good" | "fair" | "poor" | "unknown",
  "thirdPartySharing": boolean,
  "compliance": ["GDPR", "CCPA"] or [],
  "concerns": ["list of specific concerns"],
  "confidence": 0.0-1.0
}

Scoring Guidelines:
- dataTraining: "explicit" = clearly states they train on user data, "opting-out" = allows opt-out, "no-training" = explicitly states no training
- dataRetention: Assess how long data is kept
- privacyPolicyQuality: Rate clarity and completeness
- compliance: List applicable regulations mentioned
- concerns: List specific red flags (e.g., "Vague data sharing policy", "No GDPR compliance mentioned")
- overall: Calculate based on all factors (0 = very untrustworthy, 100 = very trustworthy)

Return ONLY the JSON object, no additional text.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (typeof analysis.overall !== 'number' || !analysis.dataTraining) {
      throw new Error('Invalid trust score structure');
    }

    return analysis as TrustScore;
  } catch (error) {
    console.error('Error analyzing trust score:', error);
    // Return default/unknown score
    return {
      overall: 50,
      dataTraining: 'unknown',
      dataRetention: 'unknown',
      countryOfOrigin: 'unknown',
      privacyPolicyQuality: 'unknown',
      thirdPartySharing: false,
      compliance: [],
      concerns: ['Unable to analyze documents'],
      confidence: 0
    };
  }
};

/**
 * Get trust badge color based on score
 */
export const getTrustBadgeColor = (score: number): string => {
  if (score >= 80) return 'bg-green-900/50 text-green-300';
  if (score >= 60) return 'bg-yellow-900/50 text-yellow-300';
  if (score >= 40) return 'bg-orange-900/50 text-orange-300';
  return 'bg-red-900/50 text-red-300';
};

/**
 * Get trust badge label
 */
export const getTrustBadgeLabel = (score: number): string => {
  if (score >= 80) return 'High Trust';
  if (score >= 60) return 'Moderate Trust';
  if (score >= 40) return 'Low Trust';
  return 'Very Low Trust';
};

