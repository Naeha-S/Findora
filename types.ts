
export enum PricingModel {
  Free = 'free',
  Freemium = 'freemium',
  Paid = 'paid',
  Trial = 'trial_only',
}

export enum Category {
  ImageEditing = 'Image Editing',
  ImageGeneration = 'Image Generation',
  VideoEditing = 'Video Editing',
  WritingAssistant = 'Writing Assistant',
  CodeGeneration = 'Code Generation',
  AudioMusic = 'Audio/Music',
  Design3D = '3D/Design',
  Productivity = 'Productivity',
}

export enum SortOption {
  Rising = 'rising',
  Recent = 'recent',
  Established = 'established',
}

export interface FreeTier {
  exists: boolean;
  limit: string;
  watermark: boolean;
  requiresSignup: boolean;
  requiresCard: boolean;
  commercialUse: boolean;
  attribution: boolean;
}

export interface PaidTier {
  startPrice: string;
  billingOptions: string[];
}

export interface Pricing {
  model: PricingModel;
  freeTier: FreeTier;
  paidTier: PaidTier;
  confidence: number;
  sourceUrl: string;
  lastCheckedAt: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: Category;
  officialUrl: string;
  firstSeenAt: string;
  lastVerifiedAt: string;
  mentionCount: number;
  trendScore: number;
  pricing: Pricing;
}

export interface Filters {
  trulyFree: boolean;
  noSignup: boolean;
  commercialUse: boolean;
  pricingModels: PricingModel[];
  categories: Category[];
}

export interface TrustScore {
  overall: number;
  dataTraining: 'explicit' | 'opting-out' | 'unknown' | 'no-training';
  dataRetention: 'permanent' | 'limited' | 'minimal' | 'unknown';
  countryOfOrigin: string;
  privacyPolicyQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  thirdPartySharing: boolean;
  compliance: string[];
  concerns: string[];
  confidence: number;
}