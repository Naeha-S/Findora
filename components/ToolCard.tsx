import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tool, PricingModel } from '../types';
import { Badge } from './Badge';
import { FireIcon, AlertTriangleIcon, CheckCircleIcon } from './Icons';
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
    // Fetch trust score from backend admin endpoint to avoid client Firestore rules
    (async () => {
      try {
        const base = (import.meta as any)?.env?.VITE_API_BASE || `http://localhost:8080`;
        const resp = await fetch(`${base}/api/tools/${tool.id}/trust`);
        if (!resp.ok) return;
        const json = await resp.json();
        const score = json?.trustScore?.overall;
        if (typeof score === 'number') setTrustScore(score);
      } catch (e) {
        // ignore failures silently
      }
    })();
  }, [tool.id]);

  return (
    <div className="bg-gradient-to-br from-slate-800/60 via-slate-900/50 to-black/20 border border-slate-800 rounded-2xl overflow-hidden flex flex-col transition-transform duration-300 hover:shadow-2xl hover:scale-[1.01]">
      <div className="p-4 flex-grow">
        <div className="flex items-start justify-between gap-3 mb-3">
          <Link to={`/tools/${tool.id}`} className="flex-1">
            <h3 className="text-lg font-semibold text-slate-100 leading-tight line-clamp-2">{name}</h3>
            <p className="text-sm text-slate-300 mt-2 line-clamp-2">{description}</p>
          </Link>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center text-sm font-semibold text-amber-300 bg-amber-900/20 px-2 py-1 rounded-full">
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

        <div className="flex items-center justify-between mt-4 text-sm text-slate-400">
          <div className="flex items-center gap-3">
            <Badge text={pricing.model.replace('_only', '')} color={getPricingBadgeColor(pricing.model)} />
            <span className="px-2 py-1 bg-slate-800 rounded-md text-xs">{category}</span>
          </div>
          <div className="text-xs text-slate-500">{mentionCount} mentions</div>
        </div>
      </div>

      <div className="px-4 py-3 bg-transparent border-t border-slate-800 flex gap-3">
        <Link 
          to={`/tools/${tool.id}`}
          className="flex-1 text-center bg-slate-800/60 hover:bg-slate-800/80 text-slate-100 font-semibold py-2 rounded-full transition-all"
        >
          View
        </Link>
        <a 
          href={officialUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex-1 text-center bg-gradient-to-r from-cyan-500 to-violet-500 hover:opacity-95 text-white font-bold py-2 rounded-full transition-all"
        >
          Visit
        </a>
      </div>
    </div>
  );
};