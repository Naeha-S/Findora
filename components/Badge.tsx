
import React from 'react';

interface BadgeProps {
  text: string;
  color: 'green' | 'blue' | 'orange' | 'yellow' | 'gray';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ text, color, icon }) => {
  const colorClasses = {
    green: 'bg-green-800/50 text-green-300 border border-green-700/50',
    blue: 'bg-blue-800/50 text-blue-300 border border-blue-700/50',
    orange: 'bg-orange-800/50 text-orange-300 border border-orange-700/50',
    yellow: 'bg-yellow-800/50 text-yellow-300 border border-yellow-700/50',
    gray: 'bg-gray-700/50 text-gray-300 border border-gray-600/50'
  };

  return (
    <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {icon && <span className="mr-1">{icon}</span>}
      {text}
    </div>
  );
};
