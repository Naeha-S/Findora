import React, { Fragment } from 'react';
import { Category, Filters, PricingModel } from '../types';
import { XIcon } from './Icons';

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  freshnessFilter: '24h' | '7d' | '30d' | 'all';
  setFreshnessFilter: (value: '24h' | '7d' | '30d' | 'all') => void;
}

const pricingModelOptions = Object.values(PricingModel);
const categoryOptions = Object.values(Category);

const Checkbox: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, onChange }) => (
    <label className="flex items-center space-x-3 cursor-pointer">
        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${checked ? 'bg-cyan-500 border-cyan-500' : 'bg-gray-700 border-gray-600'}`}>
            {checked && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
        </div>
        <span className="text-gray-300 select-none">{label}</span>
    </label>
);

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ isOpen, onClose, filters, setFilters, freshnessFilter, setFreshnessFilter }) => {

  const handleQuickFilterChange = (key: keyof Filters, value: boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleArrayFilterChange = <T extends PricingModel | Category,>(key: 'pricingModels' | 'categories', value: T) => {
    setFilters(prev => {
        const currentValues = prev[key] as T[];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(item => item !== value)
            : [...currentValues, value];
        return { ...prev, [key]: newValues };
    });
  };
  
  const clearFilters = () => {
    setFilters({
      trulyFree: false,
      noSignup: false,
      commercialUse: false,
      pricingModels: [],
      categories: [],
    });
    setFreshnessFilter('all');
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}></div>
      <aside className={`fixed top-0 right-0 h-full w-full max-w-sm bg-gray-900 border-l border-gray-700 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">Filters</h2>
                <button onClick={onClose} className="p-1 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors">
                    <XIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="flex-grow p-6 overflow-y-auto space-y-8">
                <div>
                    <h3 className="text-lg font-semibold text-gray-200 mb-3">Quick Filters</h3>
                    <div className="space-y-3">
                        <Checkbox label="Truly Free" checked={filters.trulyFree} onChange={(c) => handleQuickFilterChange('trulyFree', c)} />
                        <Checkbox label="No Signup Required" checked={filters.noSignup} onChange={(c) => handleQuickFilterChange('noSignup', c)} />
                        <Checkbox label="Commercial Use OK" checked={filters.commercialUse} onChange={(c) => handleQuickFilterChange('commercialUse', c)} />
                    </div>
                </div>
                 <div>
                    <h3 className="text-lg font-semibold text-gray-200 mb-3">Pricing Model</h3>
                    <div className="space-y-3">
                        {pricingModelOptions.map(model => (
                            <Checkbox key={model} label={model.charAt(0).toUpperCase() + model.slice(1).replace('_only', '')} checked={filters.pricingModels.includes(model)} onChange={() => handleArrayFilterChange('pricingModels', model)} />
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-200 mb-3">Category</h3>
                    <div className="space-y-3">
                        {categoryOptions.map(cat => (
                           <Checkbox key={cat} label={cat} checked={filters.categories.includes(cat)} onChange={() => handleArrayFilterChange('categories', cat)} />
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-200 mb-3">Freshness</h3>
                    <div className="space-y-3">
                        <Checkbox label="Last 24 hours" checked={freshnessFilter === '24h'} onChange={(c) => setFreshnessFilter(c ? '24h' : 'all')} />
                        <Checkbox label="Last 7 days" checked={freshnessFilter === '7d'} onChange={(c) => setFreshnessFilter(c ? '7d' : 'all')} />
                        <Checkbox label="Last 30 days" checked={freshnessFilter === '30d'} onChange={(c) => setFreshnessFilter(c ? '30d' : 'all')} />
                    </div>
                </div>
            </div>
            <div className="p-4 border-t border-gray-700 flex space-x-4">
                <button onClick={clearFilters} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-gray-700 rounded-md hover:bg-gray-600 transition-colors">Clear</button>
                <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-500 transition-colors">Apply</button>
            </div>
        </div>
      </aside>
    </>
  );
};