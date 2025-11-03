import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  QueryConstraint,
  onSnapshot,
  Timestamp,
  QuerySnapshot
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Tool, Pricing, Category, PricingModel, TrustScore } from "../types";

// Convert Firestore timestamp to ISO string
const convertTimestamp = (timestamp: Timestamp | string | any): string => {
  if (!timestamp) return new Date().toISOString();
  if (typeof timestamp === 'string') return timestamp;
  if (timestamp.toDate) {
    // Firestore Timestamp
    return timestamp.toDate().toISOString();
  }
  if (timestamp.seconds) {
    // Firestore Timestamp-like object
    return new Date(timestamp.seconds * 1000).toISOString();
  }
  return new Date().toISOString();
};

// Convert Firestore document to Tool
const docToTool = (docData: any, id: string, pricing?: Pricing): Tool => {
  return {
    id,
    name: docData.name || '',
    description: docData.description || '',
    category: docData.category as Category,
    officialUrl: docData.officialUrl || '',
    firstSeenAt: convertTimestamp(docData.firstSeenAt),
    lastVerifiedAt: convertTimestamp(docData.lastVerifiedAt),
    mentionCount: docData.mentionCount || 0,
    trendScore: docData.trendScore || 0,
    pricing: pricing || {
      model: PricingModel.Free,
      freeTier: {
        exists: false,
        limit: 'N/A',
        watermark: false,
        requiresSignup: false,
        requiresCard: false,
        commercialUse: false,
        attribution: false
      },
      paidTier: {
        startPrice: 'N/A',
        billingOptions: []
      },
      confidence: 0,
      sourceUrl: '',
      lastCheckedAt: new Date().toISOString()
    }
  };
};

// Fetch pricing data for a tool
export const getPricingForTool = async (toolId: string): Promise<Pricing | null> => {
  try {
    const pricingDoc = await getDoc(doc(db, 'pricing', toolId));
    if (!pricingDoc.exists()) return null;

    const data = pricingDoc.data();
    return {
      model: data.pricingModel as PricingModel,
      freeTier: {
        exists: data.freeTier?.exists || false,
        limit: data.freeTier?.limit || 'N/A',
        watermark: data.freeTier?.watermark || false,
        requiresSignup: data.freeTier?.requiresSignup || false,
        requiresCard: data.freeTier?.requiresCard || false,
        commercialUse: data.freeTier?.commercialUse || false,
        attribution: data.freeTier?.attribution || false
      },
      paidTier: {
        startPrice: data.paidTier?.startPrice || 'N/A',
        billingOptions: data.paidTier?.billingOptions || []
      },
      confidence: data.confidence || 0,
      sourceUrl: data.sourceUrl || '',
      lastCheckedAt: convertTimestamp(data.lastCheckedAt)
    };
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return null;
  }
};

// Fetch all pricing data for multiple tools
export const getPricingForTools = async (toolIds: string[]): Promise<Record<string, Pricing>> => {
  const pricingMap: Record<string, Pricing> = {};
  
  await Promise.all(
    toolIds.map(async (toolId) => {
      const pricing = await getPricingForTool(toolId);
      if (pricing) {
        pricingMap[toolId] = pricing;
      }
    })
  );

  return pricingMap;
};

// Get tools with filters
export const getTools = async (
  filters?: {
    category?: Category;
    pricingModel?: PricingModel;
    trulyFree?: boolean;
    freshness?: '24h' | '7d' | '30d' | 'all';
  },
  sortOption: 'freshness' | 'trending' | 'mentions' = 'freshness',
  limitCount: number = 20,
  offset: number = 0
): Promise<{ tools: Tool[]; total: number; hasMore: boolean }> => {
  try {
    // Quick check - if Firestore isn't initialized properly, return empty immediately
    if (!db) {
      console.warn('Firestore not initialized, returning empty result');
      return { tools: [], total: 0, hasMore: false };
    }

    const constraints: QueryConstraint[] = [];

    // Category filter
    if (filters?.category) {
      constraints.push(where('category', '==', filters.category));
    }

    // Freshness filter
    if (filters?.freshness && filters.freshness !== 'all') {
      const now = new Date();
      let cutoffDate: Date;
      
      switch (filters.freshness) {
        case '24h':
          cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0);
      }
      constraints.push(where('firstSeenAt', '>=', Timestamp.fromDate(cutoffDate)));
    }

    // Sorting
    switch (sortOption) {
      case 'freshness':
        constraints.push(orderBy('firstSeenAt', 'desc'));
        break;
      case 'trending':
        constraints.push(orderBy('trendScore', 'desc'));
        break;
      case 'mentions':
        constraints.push(orderBy('mentionCount', 'desc'));
        break;
    }

    constraints.push(limit(limitCount + offset + 1)); // Fetch one extra to check hasMore

    // Build query - if no constraints, just get all tools
    let q;
    if (constraints.length > 0) {
      q = query(collection(db, 'tools'), ...constraints);
    } else {
      q = query(collection(db, 'tools'), ...constraints.slice(-1)); // Just use the limit constraint
    }
    
    const snapshot = await getDocs(q);

    // Fetch pricing for all tools
    const toolDocs = snapshot.docs.slice(offset, offset + limitCount);
    const toolIds = toolDocs.map(doc => doc.id);
    const pricingMap = await getPricingForTools(toolIds);

    // Convert to Tool objects
    let tools = toolDocs.map(doc => {
      const data = doc.data();
      return docToTool(data, doc.id, pricingMap[doc.id]);
    });

    // Client-side filters (Firestore doesn't support complex queries)
    if (filters?.pricingModel) {
      tools = tools.filter(tool => tool.pricing.model === filters.pricingModel);
    }

    if (filters?.trulyFree) {
      tools = tools.filter(tool => 
        tool.pricing.freeTier.exists && 
        !tool.pricing.freeTier.requiresCard && 
        !tool.pricing.freeTier.watermark
      );
    }

    const hasMore = snapshot.docs.length > offset + limitCount;

    return {
      tools,
      total: snapshot.size,
      hasMore
    };
  } catch (error) {
    console.error('Error fetching tools:', error);

    // If Firestore client access is blocked by rules (common in local dev),
    // fall back to the backend admin API if available.
    try {
      const base = (import.meta as any)?.env?.VITE_API_BASE || 'http://localhost:8080';
      const url = new URL(`${base}/api/tools`);
      if (filters?.category) url.searchParams.append('category', String(filters.category));
      url.searchParams.append('limit', String(limitCount));
      const resp = await fetch(url.toString());
      if (!resp.ok) throw new Error(`Backend tools fetch failed: ${resp.status}`);
      const json = await resp.json();
      // Backend returns tools already shaped; ensure consistent return shape
      return {
        tools: json.tools || [],
        total: json.total || (json.tools ? json.tools.length : 0),
        hasMore: json.hasMore || false
      };
    } catch (backendErr) {
      console.error('Backend fallback failed for getTools:', backendErr);
      return { tools: [], total: 0, hasMore: false };
    }
  }
};

// Get "Rising" tools (new & trending)
export const getRisingTools = async (limitCount: number = 20): Promise<Tool[]> => {
  try {
    // Get tools with high trend score and low mention count (new but trending)
    const q = query(
      collection(db, 'tools'),
      where('trendScore', '>', 80),
      where('mentionCount', '<', 200),
      orderBy('trendScore', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const toolIds = snapshot.docs.map(doc => doc.id);
    const pricingMap = await getPricingForTools(toolIds);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return docToTool(data, doc.id, pricingMap[doc.id]);
    });
  } catch (error) {
    console.error('Error fetching rising tools:', error);
    return [];
  }
};

// Get a single tool by ID
export const getToolById = async (toolId: string): Promise<Tool | null> => {
  try {
    const toolDoc = await getDoc(doc(db, 'tools', toolId));
    if (!toolDoc.exists()) return null;

    const pricing = await getPricingForTool(toolId);
    return docToTool(toolDoc.data(), toolId, pricing || undefined);
  } catch (error) {
    console.error('Error fetching tool:', error);
    return null;
  }
};

// Get tools by category
export const getToolsByCategory = async (category: Category, limitCount: number = 20): Promise<Tool[]> => {
  try {
    const q = query(
      collection(db, 'tools'),
      where('category', '==', category),
      orderBy('firstSeenAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const toolIds = snapshot.docs.map(doc => doc.id);
    const pricingMap = await getPricingForTools(toolIds);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return docToTool(data, doc.id, pricingMap[doc.id]);
    });
  } catch (error) {
    console.error('Error fetching tools by category:', error);
    return [];
  }
};

// Get all categories with tool counts
export const getCategories = async (): Promise<Record<Category, number>> => {
  try {
    const snapshot = await getDocs(collection(db, 'tools'));
    const counts: Record<string, number> = {};

    snapshot.docs.forEach(doc => {
      const category = doc.data().category as Category;
      counts[category] = (counts[category] || 0) + 1;
    });

    return counts as Record<Category, number>;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return {} as Record<Category, number>;
  }
};

// Real-time listener for tools
export const subscribeToTools = (
  callback: (tools: Tool[]) => void,
  filters?: {
    category?: Category;
    sortOption?: 'freshness' | 'trending' | 'mentions';
  }
): (() => void) => {
  const constraints: QueryConstraint[] = [];

  if (filters?.category) {
    constraints.push(where('category', '==', filters.category));
  }

  const sortBy = filters?.sortOption || 'freshness';
  switch (sortBy) {
    case 'freshness':
      constraints.push(orderBy('firstSeenAt', 'desc'));
      break;
    case 'trending':
      constraints.push(orderBy('trendScore', 'desc'));
      break;
    case 'mentions':
      constraints.push(orderBy('mentionCount', 'desc'));
      break;
  }

  constraints.push(limit(100)); // Limit real-time updates

  const q = query(collection(db, 'tools'), ...constraints);

  return onSnapshot(q, async (snapshot: QuerySnapshot) => {
    const toolIds = snapshot.docs.map(doc => doc.id);
    const pricingMap = await getPricingForTools(toolIds);

    const tools = snapshot.docs.map(doc => {
      const data = doc.data();
      return docToTool(data, doc.id, pricingMap[doc.id]);
    });

    callback(tools);
  });
};

// Get trust score for a tool
export const getTrustScore = async (toolId: string): Promise<TrustScore | null> => {
  try {
    if (!db) {
      return null;
    }

    const trustDoc = await getDoc(doc(db, 'trust_scores', toolId));
    if (!trustDoc.exists()) {
      return null;
    }

    const data = trustDoc.data();
    return {
      overall: data.overall || 50,
      dataTraining: data.dataTraining || 'unknown',
      dataRetention: data.dataRetention || 'unknown',
      countryOfOrigin: data.countryOfOrigin || 'unknown',
      privacyPolicyQuality: data.privacyPolicyQuality || 'unknown',
      thirdPartySharing: data.thirdPartySharing || false,
      compliance: data.compliance || [],
      concerns: data.concerns || [],
      confidence: data.confidence || 0
    };
  } catch (error) {
    console.error('Error fetching trust score:', error);
    return null;
  }
};
