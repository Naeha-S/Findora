import React from 'react';
import { XIcon } from './Icons';

interface ActiveFilterTagProps {
  label: string;
  onRemove: () => void;
}

export const ActiveFilterTag: React.FC<ActiveFilterTagProps> = ({ label, onRemove }) => {
  return (
    <div className="flex items-center bg-gray-700 text-cyan-300 text-sm font-medium pl-3 pr-2 py-1 rounded-full animate-fade-in">
      <span>{label}</span>
      <button 
        onClick={onRemove} 
        className="ml-2 p-0.5 rounded-full hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        aria-label={`Remove filter: ${label}`}
      >
        <XIcon className="w-3 h-3 text-cyan-200" />
      </button>
    </div>
  );
};
