import React, { useState, useEffect, useRef } from 'react';
import { Tool } from '../types';
import { searchToolsByTask, taskSuggestions } from '../services/taskSearch';
import { XIcon, SparklesIcon } from './Icons';

interface TaskSearchProps {
  tools: Tool[];
  onSelectTools: (toolIds: string[]) => void;
  onClose: () => void;
}

export const TaskSearch: React.FC<TaskSearchProps> = ({ tools, onSelectTools, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [reasoning, setReasoning] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const { toolIds, reasoning: reason } = await searchToolsByTask(query.trim(), tools);
      setResults(toolIds);
      setReasoning(reason);
    } catch (error) {
      console.error('Task search error:', error);
      setResults([]);
      setReasoning('Error searching for tools');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setTimeout(() => handleSearch(), 100);
  };

  const handleApply = () => {
    if (results.length > 0) {
      onSelectTools(results);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Search by What You Need To Do</h2>
            <p className="text-sm text-gray-400">Describe your task in plain language, not tech jargon</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {/* Search Input */}
          <div className="mb-6">
            <div className="relative">
              <SparklesIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                placeholder="e.g., Remove background from product photo"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Task Suggestions */}
          {!query && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Popular Tasks</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {taskSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 text-left hover:border-purple-500 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{suggestion.icon}</span>
                      <div className="flex-1">
                        <p className="text-white font-semibold group-hover:text-purple-400 transition-colors">
                          {suggestion.text}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{suggestion.category}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {query && (
            <div>
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400">Analyzing your task and finding the best tools...</p>
                </div>
              ) : results.length > 0 ? (
                <>
                  {reasoning && (
                    <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4 mb-4">
                      <p className="text-sm text-purple-300">{reasoning}</p>
                    </div>
                  )}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white">
                      Found {results.length} tool{results.length !== 1 ? 's' : ''}
                    </h3>
                    <div className="space-y-2">
                      {tools
                        .filter(tool => results.includes(tool.id))
                        .map(tool => (
                          <div
                            key={tool.id}
                            className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-purple-500 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="text-white font-semibold mb-1">{tool.name}</h4>
                                <p className="text-sm text-gray-400 mb-2">{tool.description}</p>
                                <p className="text-xs text-gray-500">{tool.category}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              ) : query ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-2">No tools found for this task</p>
                  <p className="text-sm text-gray-500">Try rephrasing your task or use one of the suggestions above</p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="p-6 border-t border-gray-700 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors"
            >
              Show {results.length} Tool{results.length !== 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

