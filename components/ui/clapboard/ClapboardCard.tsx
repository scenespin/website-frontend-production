/**
 * Sleek Clapboard Card Component
 * Modern card with optional film slate accent
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ClapboardCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  children?: React.ReactNode;
  showAccent?: boolean;
  accentPosition?: 'top' | 'left';
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function ClapboardCard({
  title,
  description,
  icon: Icon,
  iconColor = 'from-yellow-400 to-amber-500',
  children,
  showAccent = true,
  accentPosition = 'top',
  className = '',
  onClick,
  hover = true
}: ClapboardCardProps) {
  
  const isClickable = !!onClick;
  
  return (
    <div 
      onClick={onClick}
      className={`
        relative bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 
        overflow-hidden transition-all
        ${hover ? 'hover:shadow-2xl hover:border-yellow-400 dark:hover:border-yellow-500' : ''}
        ${isClickable ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Film Slate Accent */}
      {showAccent && accentPosition === 'top' && (
        <div className="h-2 flex">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className={`flex-1 ${i % 2 === 0 ? 'bg-slate-900 dark:bg-slate-100' : 'bg-slate-100 dark:bg-slate-900'}`}
            />
          ))}
        </div>
      )}
      
      {showAccent && accentPosition === 'left' && (
        <div className="absolute left-0 top-0 bottom-0 w-2 flex flex-col">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className={`flex-1 ${i % 2 === 0 ? 'bg-slate-900 dark:bg-slate-100' : 'bg-slate-100 dark:bg-slate-900'}`}
            />
          ))}
        </div>
      )}
      
      {/* Content */}
      <div className={`p-6 ${accentPosition === 'left' ? 'pl-8' : ''}`}>
        {/* Header with Icon */}
        <div className="flex items-start gap-4 mb-4">
          {Icon && (
            <div className={`w-12 h-12 bg-gradient-to-br ${iconColor} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
              <Icon className="w-6 h-6 text-slate-900" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
        </div>
        
        {/* Custom Content */}
        {children}
      </div>
    </div>
  );
}

export default ClapboardCard;

