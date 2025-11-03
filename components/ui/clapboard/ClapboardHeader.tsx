/**
 * Sleek Clapboard Header Component
 * Refined, modern take on the Hollywood film slate aesthetic
 */

import React from 'react';
import { Film, Calendar, User, Hash } from 'lucide-react';

interface ClapboardHeaderProps {
  title: string;
  subtitle?: string;
  director?: string;
  scene?: string;
  take?: string;
  date?: string;
  variant?: 'default' | 'compact' | 'hero';
  showStripes?: boolean;
  className?: string;
}

export function ClapboardHeader({
  title,
  subtitle,
  director = 'You',
  scene = '001',
  take = '1',
  date = new Date().toLocaleDateString(),
  variant = 'default',
  showStripes = true,
  className = ''
}: ClapboardHeaderProps) {
  
  const isHero = variant === 'hero';
  const isCompact = variant === 'compact';
  
  return (
    <div className={`relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 ${className}`}>
      {/* Refined Clapboard Stripes - Sleek & Modern */}
      {showStripes && (
        <div className="h-10 md:h-12 flex shadow-inner">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i}
              className={`flex-1 ${i % 2 === 0 ? 'bg-slate-900 dark:bg-white' : 'bg-white dark:bg-slate-900'}`}
            />
          ))}
        </div>
      )}
      
      {/* Main Content */}
      <div className={`bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 ${
        isHero ? 'p-8 md:p-12' : isCompact ? 'p-4 md:p-6' : 'p-6 md:p-8'
      }`}>
        <div className="flex items-start justify-between gap-6">
          {/* Title Section */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#DC143C] to-[#B01030] rounded-xl flex items-center justify-center shadow-lg">
                <Film className="w-5 h-5 md:w-6 md:h-6 text-slate-900" />
              </div>
              <div>
                <h1 className={`font-bold text-slate-900 dark:text-base-content ${
                  isHero ? 'text-3xl md:text-5xl' : isCompact ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'
                }`}>
                  {title}
                </h1>
                {subtitle && (
                  <p className={`text-slate-600 dark:text-slate-400 ${
                    isHero ? 'text-base md:text-lg' : 'text-sm md:text-base'
                  }`}>
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Current Take Badge - Yellow Accent */}
          {!isCompact && (
            <div className="hidden md:flex flex-col items-end">
              <div className="px-4 py-2 bg-gradient-to-br from-[#DC143C] to-[#B01030] rounded-lg shadow-lg">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wide">Current Take</div>
                <div className="text-2xl font-bold text-slate-900">#{take}</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Metadata Cards - Sleek & Minimal */}
        {!isCompact && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 md:p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium uppercase tracking-wide">
                <User className="w-3 h-3" />
                Director
              </div>
              <div className="text-sm md:text-base font-semibold text-slate-900 dark:text-base-content truncate">
                {director}
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 md:p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium uppercase tracking-wide">
                <Film className="w-3 h-3" />
                Scene
              </div>
              <div className="text-sm md:text-base font-semibold text-slate-900 dark:text-base-content">
                {scene}
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 md:p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium uppercase tracking-wide">
                <Hash className="w-3 h-3" />
                Take
              </div>
              <div className="text-sm md:text-base font-semibold text-slate-900 dark:text-base-content">
                {take}
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 md:p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium uppercase tracking-wide">
                <Calendar className="w-3 h-3" />
                Date
              </div>
              <div className="text-sm md:text-base font-semibold text-slate-900 dark:text-base-content">
                {date}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClapboardHeader;

