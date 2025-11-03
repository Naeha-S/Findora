
import React from 'react';

interface BadgeProps {
  text: string;
  color: 'green' | 'blue' | 'orange' | 'yellow' | 'gray';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ text, color, icon }) => {
  const colorClasses = {
    green: 'bg-emerald-900/40 text-emerald-300 border border-emerald-800/40 shadow-sm',
    blue: 'bg-indigo-900/40 text-indigo-300 border border-indigo-800/40 shadow-sm',
    orange: 'bg-amber-900/40 text-amber-300 border border-amber-800/40 shadow-sm',
    yellow: 'bg-amber-800/40 text-amber-200 border border-amber-700/30 shadow-sm',
    gray: 'bg-slate-800/40 text-slate-300 border border-slate-700/30 shadow-sm'
  };

  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {icon && <span className="mr-1">{icon}</span>}
      {text}
    </div>
  );
};
