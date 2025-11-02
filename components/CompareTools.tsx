import React, { useState } from 'react';
import { Tool } from '../types';
import { XIcon, PlusIcon, CheckCircleIcon, AlertTriangleIcon } from './Icons';

interface CompareToolsProps {
  tools: Tool[];
  onClose: () => void;
}

export const CompareTools: React.FC<CompareToolsProps> = ({ tools, onClose }) => {
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);

  const selectedTools = tools.filter(tool => selectedToolIds.includes(tool.id));
  const availableTools = tools.filter(tool => !selectedToolIds.includes(tool.id));

  const toggleTool = (toolId: string) => {
    setSelectedToolIds(prev => {
      if (prev.includes(toolId)) {
        return prev.filter(id => id !== toolId);
      } else if (prev.length < 4) {
        return [...prev, toolId];
      } else {
        return prev; // Max 4 tools
      }
    });
  };

  const getPricingBadgeColor = (model: string) => {
    switch (model) {
      case 'free': return 'bg-green-900/50 text-green-300';
      case 'freemium': return 'bg-blue-900/50 text-blue-300';
      case 'paid': return 'bg-orange-900/50 text-orange-300';
      case 'trial_only': return 'bg-yellow-900/50 text-yellow-300';
      default: return 'bg-gray-900/50 text-gray-300';
    }
  };

  if (selectedTools.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">Compare Tools</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <p className="text-gray-400 mb-6">Select 2-4 tools to compare:</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableTools.slice(0, 20).map(tool => (
                <button
                  key={tool.id}
                  onClick={() => toggleTool(tool.id)}
                  className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 text-left hover:border-cyan-500 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white">{tool.name}</h3>
                    <PlusIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">{tool.description}</p>
                  <p className="text-xs text-gray-500 mt-2">{tool.category}</p>
                </button>
              ))}
            </div>

            {selectedToolIds.length > 0 && (
              <div className="mt-6 p-4 bg-cyan-900/20 border border-cyan-700 rounded-lg">
                <p className="text-cyan-300 font-semibold mb-2">Selected: {selectedToolIds.length}/4</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTools.map(tool => (
                    <span
                      key={tool.id}
                      className="px-3 py-1 bg-cyan-900/50 text-cyan-300 rounded-full text-sm flex items-center gap-2"
                    >
                      {tool.name}
                      <button
                        onClick={() => toggleTool(tool.id)}
                        className="hover:text-red-400"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedToolIds([])}
                  className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Compare Tools</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedToolIds([])}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
            >
              Change Selection
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
          <table className="w-full">
            <thead className="bg-gray-900/50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">Feature</th>
                {selectedTools.map(tool => (
                  <th key={tool.id} className="px-6 py-4 text-center text-sm font-semibold text-gray-300 border-b border-gray-700 min-w-[200px]">
                    <div>
                      <div className="font-bold text-white mb-1">{tool.name}</div>
                      <div className="text-xs text-gray-400">{tool.category}</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Pricing Model */}
              <tr className="border-b border-gray-700">
                <td className="px-6 py-4 text-sm font-semibold text-gray-300">Pricing Model</td>
                {selectedTools.map(tool => (
                  <td key={tool.id} className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getPricingBadgeColor(tool.pricing.model)}`}>
                      {tool.pricing.model.replace('_only', '').charAt(0).toUpperCase() + tool.pricing.model.slice(1).replace('_only', '')}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Free Tier Exists */}
              <tr className="border-b border-gray-700/50 bg-gray-800/30">
                <td className="px-6 py-4 text-sm font-semibold text-gray-300">Free Tier</td>
                {selectedTools.map(tool => (
                  <td key={tool.id} className="px-6 py-4 text-center">
                    {tool.pricing.freeTier.exists ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-400 mx-auto" />
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Free Tier Limit */}
              {selectedTools.some(t => t.pricing.freeTier.exists) && (
                <tr className="border-b border-gray-700">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-300">Free Tier Limit</td>
                  {selectedTools.map(tool => (
                    <td key={tool.id} className="px-6 py-4 text-center text-sm text-gray-300">
                      {tool.pricing.freeTier.exists ? tool.pricing.freeTier.limit : '—'}
                    </td>
                  ))}
                </tr>
              )}

              {/* Watermark */}
              {selectedTools.some(t => t.pricing.freeTier.exists) && (
                <tr className="border-b border-gray-700/50 bg-gray-800/30">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-300">Watermark</td>
                  {selectedTools.map(tool => (
                    <td key={tool.id} className="px-6 py-4 text-center">
                      {tool.pricing.freeTier.exists ? (
                        tool.pricing.freeTier.watermark ? (
                          <div className="flex items-center justify-center gap-1 text-yellow-400">
                            <AlertTriangleIcon className="w-4 h-4" />
                            <span className="text-xs">Yes</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1 text-green-400">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span className="text-xs">No</span>
                          </div>
                        )
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              )}

              {/* Card Required */}
              {selectedTools.some(t => t.pricing.freeTier.exists) && (
                <tr className="border-b border-gray-700">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-300">Card Required</td>
                  {selectedTools.map(tool => (
                    <td key={tool.id} className="px-6 py-4 text-center">
                      {tool.pricing.freeTier.exists ? (
                        tool.pricing.freeTier.requiresCard ? (
                          <div className="flex items-center justify-center gap-1 text-yellow-400">
                            <AlertTriangleIcon className="w-4 h-4" />
                            <span className="text-xs">Yes</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1 text-green-400">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span className="text-xs">No</span>
                          </div>
                        )
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              )}

              {/* Signup Required */}
              {selectedTools.some(t => t.pricing.freeTier.exists) && (
                <tr className="border-b border-gray-700/50 bg-gray-800/30">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-300">Signup Required</td>
                  {selectedTools.map(tool => (
                    <td key={tool.id} className="px-6 py-4 text-center">
                      {tool.pricing.freeTier.exists ? (
                        tool.pricing.freeTier.requiresSignup ? (
                          <span className="text-xs text-gray-400">Yes</span>
                        ) : (
                          <CheckCircleIcon className="w-4 h-4 text-green-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              )}

              {/* Commercial Use */}
              {selectedTools.some(t => t.pricing.freeTier.exists) && (
                <tr className="border-b border-gray-700">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-300">Commercial Use</td>
                  {selectedTools.map(tool => (
                    <td key={tool.id} className="px-6 py-4 text-center">
                      {tool.pricing.freeTier.exists ? (
                        tool.pricing.freeTier.commercialUse ? (
                          <div className="flex items-center justify-center gap-1 text-green-400">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span className="text-xs">
                              Yes {tool.pricing.freeTier.attribution && '(with attribution)'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No</span>
                        )
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              )}

              {/* Paid Tier Price */}
              {selectedTools.some(t => t.pricing.paidTier.startPrice !== 'N/A') && (
                <tr className="border-b border-gray-700/50 bg-gray-800/30">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-300">Paid Tier (Starting)</td>
                  {selectedTools.map(tool => (
                    <td key={tool.id} className="px-6 py-4 text-center text-sm text-gray-300">
                      {tool.pricing.paidTier.startPrice !== 'N/A' ? (
                        <span className="font-semibold text-white">{tool.pricing.paidTier.startPrice}</span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              )}

              {/* Visit Link */}
              <tr className="border-b border-gray-700">
                <td className="px-6 py-4 text-sm font-semibold text-gray-300">Action</td>
                {selectedTools.map(tool => (
                  <td key={tool.id} className="px-6 py-4 text-center">
                    <a
                      href={tool.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      Visit Tool →
                    </a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

