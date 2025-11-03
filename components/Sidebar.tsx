import React from 'react';
import { Category, Filters, PricingModel } from '../types';

interface SidebarProps {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  freshnessFilter: '24h' | '7d' | '30d' | 'all';
  setFreshnessFilter: (value: '24h' | '7d' | '30d' | 'all') => void;
}

const pricingModelOptions = Object.values(PricingModel);
const categoryOptions = Object.values(Category);

const Checkbox: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, onChange }) => (
    <label className="flex items-center space-x-3 cursor-pointer group">
        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${checked ? 'bg-cyan-500 border-cyan-500' : 'bg-gray-700 border-gray-600 group-hover:border-cyan-500'}`}>
            {checked && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
        </div>
        <span className="text-gray-300 select-none group-hover:text-white">{label}</span>
    </label>
);

export const Sidebar: React.FC<SidebarProps> = ({ filters, setFilters, freshnessFilter, setFreshnessFilter }) => {
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
        <aside className="hidden lg:flex flex-col w-72 bg-slate-900/70 border-r border-slate-800 h-screen fixed top-0 left-0 z-40 backdrop-blur-md">
            <div className="flex items-center h-16 px-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-cyan-400/10 rounded-lg flex items-center justify-center text-cyan-300 font-bold">F</div>
                    <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Findora</h1>
                </div>
            </div>
            <div className="flex-grow p-6 overflow-y-auto space-y-6 custom-scrollbar">
                <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Filters</h3>
                    <div className="space-y-3">
                        <Checkbox label="Truly Free" checked={filters.trulyFree} onChange={(c) => handleQuickFilterChange('trulyFree', c)} />
                        <Checkbox label="No Signup Required" checked={filters.noSignup} onChange={(c) => handleQuickFilterChange('noSignup', c)} />
                        <Checkbox label="Commercial Use OK" checked={filters.commercialUse} onChange={(c) => handleQuickFilterChange('commercialUse', c)} />
                    </div>
                </div>
                 <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Pricing</h3>
                    <div className="grid grid-cols-1 gap-2">
                        {pricingModelOptions.map(model => (
                            <Checkbox key={model} label={model.charAt(0).toUpperCase() + model.slice(1).replace('_only', '')} checked={filters.pricingModels.includes(model)} onChange={() => handleArrayFilterChange('pricingModels', model)} />
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Category</h3>
                    <div className="grid grid-cols-1 gap-2">
                        {categoryOptions.map(cat => (
                           <Checkbox key={cat} label={cat} checked={filters.categories.includes(cat)} onChange={() => handleArrayFilterChange('categories', cat)} />
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Freshness</h3>
                    <div className="space-y-3">
                        <Checkbox label="Last 24 hours" checked={freshnessFilter === '24h'} onChange={(c) => setFreshnessFilter(c ? '24h' : 'all')} />
                        <Checkbox label="Last 7 days" checked={freshnessFilter === '7d'} onChange={(c) => setFreshnessFilter(c ? '7d' : 'all')} />
                        <Checkbox label="Last 30 days" checked={freshnessFilter === '30d'} onChange={(c) => setFreshnessFilter(c ? '30d' : 'all')} />
                    </div>
                </div>
            </div>
            <div className="p-6 border-t border-slate-800">
                <button onClick={clearFilters} className="w-full px-4 py-2 text-sm font-semibold text-slate-900 bg-cyan-300 rounded-md hover:opacity-95 transition">Clear Filters</button>
            </div>
        </aside>
    );
};