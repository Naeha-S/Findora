import React, { useState, useMemo } from 'react';
import { useMockData } from './hooks/useMockData';
import { Tool, Filters, SortOption, Category, PricingModel } from './types';
import { Sidebar } from './components/Sidebar';
import { ToolCard } from './components/ToolCard';
import { FilterSidebar } from './components/FilterSidebar';
import { ActiveFilterTag } from './components/ActiveFilterTag';
import { FilterIcon, SearchIcon } from './components/Icons';
import { Chatbot } from './components/Chatbot';

const App: React.FC = () => {
  const { tools, loading } = useMockData();
  const [filters, setFilters] = useState<Filters>({
    trulyFree: false,
    noSignup: false,
    commercialUse: false,
    pricingModels: [],
    categories: [],
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>(SortOption.Rising);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

  const filteredAndSortedTools = useMemo(() => {
    let filtered = tools.filter(tool => {
      // Search filter
      const searchMatch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tool.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Quick filters
      const trulyFreeMatch = !filters.trulyFree || (tool.pricing.model === PricingModel.Free && !tool.pricing.freeTier.requiresCard);
      const noSignupMatch = !filters.noSignup || !tool.pricing.freeTier.requiresSignup;
      const commercialUseMatch = !filters.commercialUse || tool.pricing.freeTier.commercialUse;

      // Array filters
      const pricingModelMatch = filters.pricingModels.length === 0 || filters.pricingModels.includes(tool.pricing.model);
      const categoryMatch = filters.categories.length === 0 || filters.categories.includes(tool.category);

      return searchMatch && trulyFreeMatch && noSignupMatch && commercialUseMatch && pricingModelMatch && categoryMatch;
    });

    // Sorting
    switch (sortOption) {
      case SortOption.Rising:
        filtered.sort((a, b) => b.trendScore - a.trendScore);
        break;
      case SortOption.Recent:
        filtered.sort((a, b) => new Date(b.firstSeenAt).getTime() - new Date(a.firstSeenAt).getTime());
        break;
      case SortOption.Established:
        filtered.sort((a, b) => b.mentionCount - a.mentionCount);
        break;
      default:
        break;
    }

    return filtered;
  }, [tools, filters, searchTerm, sortOption]);

  const removeFilter = (key: keyof Filters, value?: Category | PricingModel) => {
    setFilters(prev => {
        if (key === 'categories' || key === 'pricingModels') {
            const currentValues = prev[key] as (Category | PricingModel)[];
            return {
                ...prev,
                [key]: currentValues.filter(item => item !== value)
            };
        }
        return { ...prev, [key]: false };
    });
  };

  const getActiveFilters = () => {
    const active: {label: string, onRemove: () => void}[] = [];
    if(filters.trulyFree) active.push({ label: "Truly Free", onRemove: () => removeFilter('trulyFree') });
    if(filters.noSignup) active.push({ label: "No Signup", onRemove: () => removeFilter('noSignup') });
    if(filters.commercialUse) active.push({ label: "Commercial Use", onRemove: () => removeFilter('commercialUse') });
    filters.pricingModels.forEach(pm => active.push({ label: pm.charAt(0).toUpperCase() + pm.slice(1).replace('_only',''), onRemove: () => removeFilter('pricingModels', pm) }));
    filters.categories.forEach(cat => active.push({ label: cat, onRemove: () => removeFilter('categories', cat) }));
    return active;
  };

  const activeFilters = getActiveFilters();

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <Sidebar filters={filters} setFilters={setFilters} />
      <FilterSidebar isOpen={isFilterSidebarOpen} onClose={() => setIsFilterSidebarOpen(false)} filters={filters} setFilters={setFilters} />

      <main className="lg:ml-64">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 sticky top-0 z-30">
             <h1 className="text-xl font-bold text-white">Findora <span className="text-cyan-400">✨</span></h1>
             <button onClick={() => setIsFilterSidebarOpen(true)} className="p-2 rounded-md hover:bg-gray-700">
                <FilterIcon className="w-6 h-6" />
             </button>
        </header>
        
        <div className="p-4 md:p-6 lg:p-8">
          <div className="mb-6 sticky top-16 lg:top-0 z-20 bg-gray-900/80 backdrop-blur-sm py-4 -mx-4 px-4 md:-mx-6 md:px-6 lg:mx-0 lg:px-0">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:max-w-md">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for AI tools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">Sort by:</span>
                <select 
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="bg-gray-800 border border-gray-700 rounded-lg pl-3 pr-8 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none bg-no-repeat bg-right-2"
                    style={{backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`}}
                >
                  <option value={SortOption.Rising}>🔥 Rising</option>
                  <option value={SortOption.Recent}>✨ Recent</option>
                  <option value={SortOption.Established}>🏆 Established</option>
                </select>
              </div>
            </div>
            {activeFilters.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-gray-400">Active:</span>
                    {activeFilters.map(f => <ActiveFilterTag key={f.label} label={f.label} onRemove={f.onRemove} />)}
                </div>
            )}
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 animate-pulse">
                        <div className="h-6 bg-gray-700 rounded w-3/4 mb-3"></div>
                        <div className="h-4 bg-gray-700 rounded w-full mb-1"></div>
                        <div className="h-4 bg-gray-700 rounded w-5/6 mb-4"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
          ) : (
            <>
              {filteredAndSortedTools.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredAndSortedTools.map(tool => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                    <h2 className="text-2xl font-bold text-white mb-2">No tools found</h2>
                    <p className="text-gray-400">Try adjusting your search or filters.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Chatbot tools={tools} />
    </div>
  );
};

export default App;
