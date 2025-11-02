import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tool, PricingModel } from '../types';
import { Badge } from './Badge';
import { FireIcon, AlertTriangleIcon, CheckCircleIcon } from './Icons';
import { getTrustScore } from '../services/firestore';
import { getTrustBadgeColor } from '../services/trustEngine';

interface ToolCardProps {
  tool: Tool;
}

const getPricingBadgeColor = (model: PricingModel) => {
  switch (model) {
    case PricingModel.Free: return 'green';
    case PricingModel.Freemium: return 'blue';
    case PricingModel.Paid: return 'orange';
    case PricingModel.Trial: return 'yellow';
    default: return 'gray';
  }
};

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

export const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const { name, description, category, firstSeenAt, mentionCount, trendScore, pricing, officialUrl } = tool;
  const { freeTier } = pricing;
  const [trustScore, setTrustScore] = useState<number | null>(null);

  useEffect(() => {
    getTrustScore(tool.id).then(score => {
      if (score) {
        setTrustScore(score.overall);
      }
    }).catch(() => {});
  }, [tool.id]);

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-cyan-500/20 hover:border-cyan-700/70">
      <div className="p-4 flex-grow">
        <div className="flex justify-between items-start mb-2">
          <Link to={`/tools/${tool.id}`} className="hover:text-cyan-400 transition-colors flex-1">
            <h3 className="text-lg font-bold text-white pr-2">{name}</h3>
          </Link>
          <div className="flex flex-col gap-1 items-end">
            <div className="flex items-center text-sm font-semibold text-orange-400 bg-orange-900/50 px-2 py-1 rounded-full">
              <FireIcon className="w-4 h-4 mr-1" />
              {trendScore}%
            </div>
            {trustScore !== null && trustScore >= 80 && (
              <div className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getTrustBadgeColor(trustScore)}`}>
                🛡️ {trustScore}
              </div>
            )}
          </div>
        </div>
        
        <Link to={`/tools/${tool.id}`} className="block hover:text-gray-300 transition-colors">
          <p title={description} className="text-sm text-gray-400 mb-3 h-10 line-clamp-2">
            {description}
          </p>

          <p className="text-sm text-gray-400 mb-1">{category}</p>
          <p className="text-xs text-gray-500">First seen: {timeSince(firstSeenAt)} &bull; {mentionCount} mentions</p>
        </Link>
      </div>

      <div className="px-4 py-3 bg-gray-900/30 border-t border-gray-700/50 space-y-2">
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <span className="text-sm font-semibold text-gray-300 w-8">💰</span>
                <Badge text={pricing.model.replace('_only', '')} color={getPricingBadgeColor(pricing.model)} />
            </div>
            <p className="text-xs text-gray-500 whitespace-nowrap pl-2">
                Verified: {timeSince(pricing.lastCheckedAt)}
            </p>
        </div>
        {freeTier.exists && (
          <>
            <div className="flex items-center">
                <span className="text-sm font-semibold text-gray-300 w-8">📊</span>
                <p className="text-xs text-gray-300 truncate">{freeTier.limit}</p>
            </div>
            <div className="flex items-center">
                <span className="text-sm font-semibold text-gray-300 w-8">🔓</span>
                {freeTier.requiresCard ? (
                    <Badge text="Card Required" color="yellow" icon={<AlertTriangleIcon className="w-3 h-3" />} />
                ) : (
                    <Badge text="No Card Required" color="green" icon={<CheckCircleIcon className="w-3 h-3" />} />
                )}
                 {freeTier.watermark && (
                    <span className="ml-2">
                        <Badge text="Watermark" color="yellow" icon={<AlertTriangleIcon className="w-3 h-3" />} />
                    </span>
                 )}
            </div>
          </>
        )}
      </div>

      <div className="p-4 bg-gray-800/50 border-t border-gray-700/50 flex gap-2">
        <Link 
          to={`/tools/${tool.id}`}
          className="flex-1 text-center bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-300"
        >
          View Details
        </Link>
        <a 
          href={officialUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex-1 text-center bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-300"
        >
          Visit Tool &rarr;
        </a>
      </div>
    </div>
  );
};