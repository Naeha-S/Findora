import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTool } from '../hooks/useTools';
import { PricingModel } from '../types';
import { AlertTriangleIcon, CheckCircleIcon, ExternalLinkIcon, ArrowLeftIcon } from './Icons';
import { TrustScoreBadge } from './TrustScoreBadge';
import { TrustScore } from '../types';
import { getTrustScore } from '../services/firestore';

const timeSince = (date: string): string => {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};

const getPricingBadgeColor = (model: PricingModel): string => {
  switch (model) {
    case PricingModel.Free: return 'bg-green-900/50 text-green-300';
    case PricingModel.Freemium: return 'bg-blue-900/50 text-blue-300';
    case PricingModel.Paid: return 'bg-orange-900/50 text-orange-300';
    case PricingModel.Trial: return 'bg-yellow-900/50 text-yellow-300';
    default: return 'bg-gray-900/50 text-gray-300';
  }
};

export const ToolDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { tool, loading, error } = useTool(id || null);
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null);
  const [loadingTrust, setLoadingTrust] = useState(false);

  // Load trust score when tool loads
  useEffect(() => {
    if (tool && !trustScore && !loadingTrust) {
      setLoadingTrust(true);
      getTrustScore(tool.id)
        .then((score) => {
          if (score) {
            setTrustScore(score as TrustScore);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingTrust(false));
    }
  }, [tool, trustScore, loadingTrust]);

  if (loading) {
    return (
      <div className="bg-gray-900 text-white min-h-screen">
        <div className="max-w-4xl mx-auto p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-800 rounded w-1/3"></div>
            <div className="h-64 bg-gray-800 rounded"></div>
            <div className="h-48 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Tool Not Found</h2>
          <p className="text-gray-400 mb-6">{error || 'The tool you are looking for does not exist.'}</p>
          <Link 
            to="/" 
            className="inline-flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const { name, description, category, officialUrl, firstSeenAt, lastVerifiedAt, mentionCount, trendScore, pricing } = tool;
  const { freeTier, paidTier, confidence, sourceUrl, lastCheckedAt } = pricing;

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header with back button */}
        <Link 
          to="/" 
          className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Tools
        </Link>

        {/* Tool Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{name}</h1>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300">{category}</span>
                {trendScore > 80 && (
                  <span className="px-3 py-1 bg-orange-900/50 text-orange-300 rounded-full text-sm font-semibold">
                    🔥 {trendScore}% Hot
                  </span>
                )}
              </div>
            </div>
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-md transition-colors"
            >
              Visit Tool
              <ExternalLinkIcon className="w-5 h-5 ml-2" />
            </a>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <span>First seen: {timeSince(firstSeenAt)}</span>
            <span>•</span>
            <span>Mentioned {mentionCount} times</span>
            <span>•</span>
            <span>Last verified: {timeSince(lastVerifiedAt)}</span>
          </div>
        </div>

        {/* Description */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-3">About</h2>
          <p className="text-gray-300 leading-relaxed">{description}</p>
        </div>

        {/* Transparency Card - Key Differentiator */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">💰 Pricing Breakdown</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPricingBadgeColor(pricing.model)}`}>
              {pricing.model.replace('_only', '').charAt(0).toUpperCase() + pricing.model.slice(1).replace('_only', '')}
            </span>
          </div>
          
          <div className="space-y-4">
            {freeTier.exists && (
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-lg font-semibold text-white mb-3">Free Tier</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center">
                    <span className="text-gray-400 w-32">Limit:</span>
                    <span className="text-gray-300">{freeTier.limit}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-400 w-32">Watermark:</span>
                    {freeTier.watermark ? (
                      <span className="text-yellow-300 flex items-center">
                        <AlertTriangleIcon className="w-4 h-4 mr-1" />
                        Yes
                      </span>
                    ) : (
                      <span className="text-green-300 flex items-center">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        No
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-400 w-32">Card Required:</span>
                    {freeTier.requiresCard ? (
                      <span className="text-yellow-300 flex items-center">
                        <AlertTriangleIcon className="w-4 h-4 mr-1" />
                        Yes
                      </span>
                    ) : (
                      <span className="text-green-300 flex items-center">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        No
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-400 w-32">Signup Required:</span>
                    {freeTier.requiresSignup ? (
                      <span className="text-gray-300">Yes</span>
                    ) : (
                      <span className="text-green-300 flex items-center">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        No
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-400 w-32">Commercial Use:</span>
                    {freeTier.commercialUse ? (
                      <span className="text-green-300 flex items-center">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Yes {freeTier.attribution && '(with attribution)'}
                      </span>
                    ) : (
                      <span className="text-gray-300">No</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {pricing.model !== PricingModel.Free && paidTier.startPrice !== 'N/A' && (
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-lg font-semibold text-white mb-3">Paid Tier</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-gray-400 w-32">Starting Price:</span>
                    <span className="text-gray-300 font-semibold">{paidTier.startPrice}</span>
                  </div>
                  {paidTier.billingOptions.length > 0 && (
                    <div className="flex items-center">
                      <span className="text-gray-400 w-32">Billing:</span>
                      <span className="text-gray-300">{paidTier.billingOptions.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-700 mt-4 pt-4 flex items-center justify-between text-sm">
            <div>
              <span className="text-gray-400">Last Verified:</span>
              <span className="text-gray-300 ml-2">{timeSince(lastCheckedAt)}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-400">Confidence:</span>
              <span className={`ml-2 font-semibold ${confidence >= 0.9 ? 'text-green-300' : confidence >= 0.7 ? 'text-yellow-300' : 'text-red-300'}`}>
                {Math.round(confidence * 100)}%
              </span>
              {confidence < 0.7 && (
                <span className="ml-2 text-xs text-yellow-300">⚠️ Low confidence</span>
              )}
            </div>
            {sourceUrl && (
              <a 
                href={sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 flex items-center"
              >
                View Source
                <ExternalLinkIcon className="w-4 h-4 ml-1" />
              </a>
            )}
          </div>
        </div>

        {/* Trust Score */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
          <TrustScoreBadge trustScore={trustScore} />
        </div>

        {/* Discovery Timeline */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Discovery Timeline</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2"></div>
              <div>
                <p className="text-gray-300 font-semibold">First Discovered</p>
                <p className="text-sm text-gray-400">{new Date(firstSeenAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-gray-300 font-semibold">Last Verified</p>
                <p className="text-sm text-gray-400">{new Date(lastVerifiedAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <p className="text-gray-300 font-semibold">Current Status</p>
                <p className="text-sm text-gray-400">
                  {mentionCount} total mentions
                  {trendScore > 80 && ` • Trending at ${trendScore}%`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
