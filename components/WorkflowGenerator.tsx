import React, { useState } from 'react';
import { SendIcon, XIcon, CheckCircleIcon, AlertCircleIcon } from './Icons';

interface WorkflowStep {
  stepNumber: number;
  name: string;
  description: string;
  recommendedTool: {
    name: string;
    toolId?: string;
    reason: string;
    pricing: {
      model: string;
      freeTierLimit?: string;
      watermark: boolean;
      requiresCard: boolean;
      commercialUse: boolean;
    };
  };
  pricing: {
    cost: string;
    freeTierAvailable: boolean;
    notes: string;
  };
  estimatedTime?: string;
}

interface Workflow {
  steps: WorkflowStep[];
  estimatedTime: string;
  totalCost: string;
  summary: string;
}

interface WorkflowGeneratorProps {
  onClose: () => void;
}

export const WorkflowGenerator: React.FC<WorkflowGeneratorProps> = ({ onClose }) => {
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateWorkflow = async () => {
    if (!goal.trim()) {
      setError('Please enter a goal');
      return;
    }

    setLoading(true);
    setError(null);
    setWorkflow(null);

    try {
      // Try to use backend API if available, otherwise show helpful message
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/workflows/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goal: goal.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setWorkflow(data);
    } catch (err) {
      console.error('Error generating workflow:', err);
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Could not connect to the backend API. Make sure the backend server is running on port 8080.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to generate workflow. Make sure the backend API is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">AI Workflow Generator</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {!workflow ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  What do you want to accomplish?
                </label>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g., Create a marketing video from scratch, Generate a blog post with images, Build a website landing page..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                  rows={4}
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      generateWorkflow();
                    }
                  }}
                />
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-300 font-semibold">Error</p>
                    <p className="text-red-400 text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}

              <button
                onClick={generateWorkflow}
                disabled={loading || !goal.trim()}
                className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating Workflow...</span>
                  </>
                ) : (
                  <>
                    <SendIcon className="w-5 h-5" />
                    <span>Generate Workflow</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-3">Workflow Summary</h3>
                <p className="text-gray-300">{workflow.summary}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Estimated Time:</span>
                    <span className="text-cyan-400 font-semibold">{workflow.estimatedTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Total Cost:</span>
                    <span className="text-green-400 font-semibold">{workflow.totalCost}</span>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Step-by-Step Process</h3>
                {workflow.steps.map((step, index) => (
                  <div
                    key={step.stepNumber}
                    className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 relative"
                  >
                    {/* Step Number */}
                    <div className="absolute -left-4 top-6 w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {step.stepNumber}
                    </div>

                    <div className="ml-6">
                      <h4 className="text-lg font-bold text-white mb-2">{step.name}</h4>
                      <p className="text-gray-400 mb-4">{step.description}</p>

                      {/* Recommended Tool */}
                      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-sm text-gray-400 mb-1">Recommended Tool</p>
                            <p className="text-cyan-400 font-semibold text-lg">{step.recommendedTool.name}</p>
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            {step.pricing.freeTierAvailable && (
                              <span className="px-2 py-1 bg-green-900/50 text-green-300 rounded text-xs font-semibold">
                                Free Tier Available
                              </span>
                            )}
                            {step.recommendedTool.pricing && (
                              <>
                                {!step.recommendedTool.pricing.requiresCard && (
                                  <span className="px-2 py-1 bg-green-900/50 text-green-300 rounded text-xs font-semibold">
                                    No Card Required
                                  </span>
                                )}
                                {!step.recommendedTool.pricing.watermark && (
                                  <span className="px-2 py-1 bg-green-900/50 text-green-300 rounded text-xs font-semibold">
                                    No Watermark
                                  </span>
                                )}
                                {step.recommendedTool.pricing.commercialUse && (
                                  <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-xs font-semibold">
                                    Commercial Use OK
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{step.recommendedTool.reason}</p>
                        {step.recommendedTool.pricing?.freeTierLimit && (
                          <p className="text-xs text-gray-500">
                            Free Limit: {step.recommendedTool.pricing.freeTierLimit}
                          </p>
                        )}
                      </div>

                      {/* Pricing Info */}
                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Cost:</span>
                          <span className={`font-semibold ${step.pricing.cost === '$0' ? 'text-green-400' : 'text-yellow-400'}`}>
                            {step.pricing.cost}
                          </span>
                        </div>
                        {step.estimatedTime && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">Time:</span>
                            <span className="text-gray-300">{step.estimatedTime}</span>
                          </div>
                        )}
                        {step.pricing.notes && (
                          <span className="text-gray-500">{step.pricing.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    setWorkflow(null);
                    setGoal('');
                    setError(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Generate Another
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

