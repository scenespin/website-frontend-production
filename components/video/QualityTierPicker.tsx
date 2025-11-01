/**
 * QualityTierPicker.tsx
 * Extracted from QuickVideoCard.tsx for better modularity
 * Handles selection of video quality tier (budget, professional, cinematic)
 */

'use client';

import React from 'react';
import { Zap, Star, Crown } from 'lucide-react';

export type QualityTier = 'budget' | 'professional' | 'cinematic';

interface QualityTierPickerProps {
  selectedTier: QualityTier;
  onTierChange: (tier: QualityTier) => void;
  disabled?: boolean;
}

const QUALITY_TIERS = [
  {
    value: 'budget' as QualityTier,
    label: 'Budget',
    icon: Zap,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500',
    description: 'Fast & affordable',
    credits: '10-20 credits',
    provider: 'Luma Flash'
  },
  {
    value: 'professional' as QualityTier,
    label: 'Professional',
    icon: Star,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500',
    description: 'Best quality/speed balance',
    credits: '30-50 credits',
    provider: 'Luma Ray 2'
  },
  {
    value: 'cinematic' as QualityTier,
    label: 'Cinematic',
    icon: Crown,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500',
    description: 'Maximum quality',
    credits: '60-100 credits',
    provider: 'Google Veo 3.1'
  }
];

export function QualityTierPicker({ 
  selectedTier, 
  onTierChange,
  disabled = false 
}: QualityTierPickerProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        Quality Tier
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {QUALITY_TIERS.map(tier => {
          const Icon = tier.icon;
          const isSelected = selectedTier === tier.value;
          
          return (
            <button
              key={tier.value}
              onClick={() => onTierChange(tier.value)}
              disabled={disabled}
              className={`
                p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden
                ${isSelected 
                  ? `${tier.borderColor} ${tier.bgColor} shadow-lg` 
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Background decoration */}
              {isSelected && (
                <div className={`absolute top-0 right-0 w-32 h-32 ${tier.bgColor} rounded-full blur-3xl opacity-20 -translate-y-16 translate-x-16`} />
              )}
              
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-5 h-5 ${isSelected ? tier.color : 'text-slate-400'}`} />
                  <span className={`font-semibold ${isSelected ? tier.color : 'text-slate-900 dark:text-white'}`}>
                    {tier.label}
                  </span>
                </div>
                
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  {tier.description}
                </p>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Cost:</span>
                    <span className={`font-medium ${isSelected ? tier.color : 'text-slate-700 dark:text-slate-300'}`}>
                      {tier.credits}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Provider:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {tier.provider}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

