import React from 'react';
import { TrustScore } from '../types';
import { getTrustBadgeColor, getTrustBadgeLabel } from '../services/trustEngine';
import { AlertTriangleIcon, CheckCircleIcon, ShieldCheckIcon } from './Icons';

interface TrustScoreBadgeProps {
  trustScore: TrustScore | null;
  compact?: boolean;
}

export const TrustScoreBadge: React.FC<TrustScoreBadgeProps> = ({ trustScore, compact = false }) => {
  if (!trustScore) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-800 text-gray-400 rounded-full text-sm">
        <span>Trust Score: Not Available</span>
      </div>
    );
  }

  const color = getTrustBadgeColor(trustScore.overall);
  const label = getTrustBadgeLabel(trustScore.overall);

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
        <ShieldCheckIcon className="w-3 h-3" />
        <span>{trustScore.overall}/100</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-white">Trust Score</h3>
        </div>
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-semibold ${color}`}>
          <span>{label}</span>
          <span className="text-lg">{trustScore.overall}/100</span>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Data Training:</span>
          <span className={`font-semibold ${
            trustScore.dataTraining === 'no-training' ? 'text-green-400' :
            trustScore.dataTraining === 'opting-out' ? 'text-yellow-400' :
            'text-gray-400'
          }`}>
            {trustScore.dataTraining === 'no-training' ? 'No Training' :
             trustScore.dataTraining === 'opting-out' ? 'Opt-Out Available' :
             trustScore.dataTraining === 'explicit' ? 'Trains on Data' :
             'Unknown'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400">Data Retention:</span>
          <span className="text-gray-300 capitalize">{trustScore.dataRetention}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400">Country of Origin:</span>
          <span className="text-gray-300">{trustScore.countryOfOrigin}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400">Third-Party Sharing:</span>
          {trustScore.thirdPartySharing ? (
            <span className="text-yellow-400 flex items-center gap-1">
              <AlertTriangleIcon className="w-4 h-4" />
              Yes
            </span>
          ) : (
            <span className="text-green-400 flex items-center gap-1">
              <CheckCircleIcon className="w-4 h-4" />
              No
            </span>
          )}
        </div>

        {trustScore.compliance.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Compliance:</span>
            <div className="flex gap-1">
              {trustScore.compliance.map(reg => (
                <span key={reg} className="px-2 py-0.5 bg-green-900/30 text-green-300 rounded text-xs">
                  {reg}
                </span>
              ))}
            </div>
          </div>
        )}

        {trustScore.concerns.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-400 mb-1">Concerns:</p>
            <ul className="text-xs text-yellow-400 space-y-1">
              {trustScore.concerns.map((concern, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <AlertTriangleIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{concern}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-500">
          Confidence: {Math.round(trustScore.confidence * 100)}%
        </div>
      </div>
    </div>
  );
};

