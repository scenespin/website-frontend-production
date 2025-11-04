/**
 * AspectRatioSelector.tsx
 * 
 * Platform-focused aspect ratio selector for video generation
 * Makes it easy for users to choose based on their target platform
 */

import React from 'react';
import { VideoIcon, SmartphoneIcon, SquareIcon, Globe2Icon, TvIcon, ClapperboardIcon } from 'lucide-react';

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '21:9';

export interface Platform {
  value: AspectRatio;
  label: string;
  icon: React.ReactNode;
  platforms: string;
  description: string;
  isNew?: boolean;
  isPremium?: boolean;
}

const ASPECT_RATIO_OPTIONS: Platform[] = [
  {
    value: '16:9',
    label: 'Landscape',
    icon: <VideoIcon className="w-5 h-5" />,
    platforms: 'YouTube, Web, Vimeo',
    description: 'Classic widescreen format',
  },
  {
    value: '9:16',
    label: 'Vertical',
    icon: <SmartphoneIcon className="w-5 h-5" />,
    platforms: 'TikTok, Reels, Stories',
    description: 'Mobile-first vertical video',
  },
  {
    value: '1:1',
    label: 'Square',
    icon: <SquareIcon className="w-5 h-5" />,
    platforms: 'Instagram Feed, Twitter',
    description: 'Perfect for social feeds',
  },
  {
    value: '4:3',
    label: 'Classic',
    icon: <TvIcon className="w-5 h-5" />,
    platforms: 'Retro, Nostalgia, Facebook',
    description: 'Classic TV format',
    isNew: true,
  },
  {
    value: '21:9',
    label: 'Cinema',
    icon: <ClapperboardIcon className="w-5 h-5" />,
    platforms: 'Film Festivals, Trailers',
    description: 'Hollywood widescreen format',
    isNew: true,
    isPremium: true,
  },
];

interface AspectRatioSelectorProps {
  value: AspectRatio;
  onChange: (value: AspectRatio) => void;
  className?: string;
}

export default function AspectRatioSelector({
  value,
  onChange,
  className = '',
}: AspectRatioSelectorProps) {
  return (
    <div className={`aspect-ratio-selector ${className}`}>
      <label className="block text-sm font-medium text-base-content mb-3">
        Video Format
      </label>
      
      {/* Updated grid to handle 5 items - 3 top row, 2 bottom row */}
      <div className="space-y-3">
        {/* Top row: Standard formats */}
        <div className="grid grid-cols-3 gap-3">
          {ASPECT_RATIO_OPTIONS.slice(0, 3).map((option) => {
            const isSelected = value === option.value;
            
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={`
                  relative flex flex-col items-center justify-center
                  p-4 rounded-lg border-2 transition-all duration-200
                  hover:scale-105 hover:shadow-lg
                  ${
                    isSelected
                      ? 'border-blue-500 bg-[#DC143C]/20 text-base-content'
                      : 'border-base-content/20 bg-base-300/50 text-base-content/70 hover:border-base-content/30'
                  }
                `}
              >
                {/* NEW Badge */}
                {option.isNew && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-base-content text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    NEW
                  </span>
                )}
                
                {/* Icon */}
                <div className={`mb-2 ${isSelected ? 'text-[#DC143C]' : 'text-[#B3B3B3]'}`}>
                  {option.icon}
                </div>
                
                {/* Label */}
                <div className="text-sm font-semibold mb-1">
                  {option.label}
                </div>
                
                {/* Aspect Ratio */}
                <div className="text-xs text-base-content/60 mb-2">
                  {option.value}
                </div>
                
                {/* Platforms */}
                <div className="text-xs text-center text-base-content/50">
                  {option.platforms}
                </div>
                
                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                    <div className="w-2 h-2 bg-[#DC143C] rounded-full"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Bottom row: Advanced formats */}
        <div className="grid grid-cols-2 gap-3">
          {ASPECT_RATIO_OPTIONS.slice(3).map((option) => {
            const isSelected = value === option.value;
            
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={`
                  relative flex flex-col items-center justify-center
                  p-4 rounded-lg border-2 transition-all duration-200
                  hover:scale-105 hover:shadow-lg
                  ${
                    isSelected
                      ? option.isPremium
                        ? 'border-yellow-500 bg-yellow-500/20 text-base-content'
                        : 'border-blue-500 bg-[#DC143C]/20 text-base-content'
                      : option.isPremium
                        ? 'border-yellow-700 bg-yellow-900/20 text-base-content/70 hover:border-yellow-600'
                        : 'border-base-content/20 bg-base-300/50 text-base-content/70 hover:border-base-content/30'
                  }
                `}
              >
                {/* Premium Badge */}
                {option.isPremium && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    PREMIUM
                  </span>
                )}
                
                {/* NEW Badge (for non-premium new items) */}
                {option.isNew && !option.isPremium && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-base-content text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    NEW
                  </span>
                )}
                
                {/* Icon */}
                <div className={`mb-2 ${isSelected ? option.isPremium ? 'text-[#FFD700]' : 'text-[#DC143C]' : 'text-[#B3B3B3]'}`}>
                  {option.icon}
                </div>
                
                {/* Label */}
                <div className="text-sm font-semibold mb-1">
                  {option.label}
                </div>
                
                {/* Aspect Ratio */}
                <div className="text-xs text-base-content/60 mb-2">
                  {option.value}
                </div>
                
                {/* Platforms */}
                <div className="text-xs text-center text-base-content/50">
                  {option.platforms}
                </div>
                
                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                    <div className={`w-2 h-2 ${option.isPremium ? 'bg-[#FFD700]' : 'bg-[#DC143C]'} rounded-full`}></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Description for selected option */}
      <div className="mt-3 text-sm text-[#B3B3B3] text-center">
        {ASPECT_RATIO_OPTIONS.find((opt) => opt.value === value)?.description}
      </div>
    </div>
  );
}

/**
 * Platform Preset Buttons (Alternative UI - can be used instead or in addition)
 * Provides quick access to common platform combinations
 */

interface PlatformPreset {
  name: string;
  icon: string;
  aspectRatio: AspectRatio;
  credits: number;
  popular?: boolean;
}

const PLATFORM_PRESETS: PlatformPreset[] = [
  {
    name: 'YouTube Pack',
    icon: '📺',
    aspectRatio: '16:9',
    credits: 50,
  },
  {
    name: 'TikTok Pack',
    icon: '📱',
    aspectRatio: '9:16',
    credits: 50,
    popular: true,
  },
  {
    name: 'Instagram Pack',
    icon: '⬛',
    aspectRatio: '1:1',
    credits: 50,
  },
];

interface PlatformPresetsProps {
  onSelect: (aspectRatio: AspectRatio) => void;
  className?: string;
}

export function PlatformPresets({ onSelect, className = '' }: PlatformPresetsProps) {
  return (
    <div className={`platform-presets ${className}`}>
      <label className="block text-sm font-medium text-base-content mb-3">
        Quick Select
      </label>
      
      <div className="flex gap-2">
        {PLATFORM_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => onSelect(preset.aspectRatio)}
            className={`
              flex-1 flex flex-col items-center gap-1
              p-3 rounded-lg border border-base-content/20
              bg-base-300/50 hover:bg-base-content/20/50
              transition-all duration-200
              hover:scale-105 hover:border-base-content/30
              ${preset.popular ? 'ring-2 ring-green-500/50' : ''}
            `}
          >
            <span className="text-2xl">{preset.icon}</span>
            <span className="text-xs font-medium text-base-content">
              {preset.name}
            </span>
            <span className="text-xs text-[#B3B3B3]">
              {preset.credits} credits
            </span>
            {preset.popular && (
              <span className="text-xs text-green-400 font-semibold">
                Popular
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Multi-Format Bundle Option (Future Enhancement)
 * Allows users to generate for all platforms at once with a discount
 */

interface BundleOptionData {
  formats: AspectRatio[];
  name: string;
  icon: string;
  credits: number;
  savings: number;
}

const BUNDLE_OPTION: BundleOptionData = {
  formats: ['16:9', '9:16', '1:1'],
  name: 'Social Bundle',
  icon: '🌐',
  credits: 120,
  savings: 30,
};

interface BundleOptionProps {
  selected: boolean;
  onToggle: () => void;
  className?: string;
}

export function BundleOption({ selected, onToggle, className = '' }: BundleOptionProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        ${className}
        w-full flex items-center justify-between
        p-4 rounded-lg border-2 transition-all duration-200
        ${
          selected
            ? 'border-purple-500 bg-purple-500/20'
            : 'border-base-content/20 bg-base-300/50 hover:border-base-content/30'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{BUNDLE_OPTION.icon}</span>
        <div className="text-left">
          <div className="font-semibold text-base-content">
            {BUNDLE_OPTION.name}
          </div>
          <div className="text-xs text-[#B3B3B3]">
            All 3 formats (16:9, 9:16, 1:1)
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <div className="text-lg font-bold text-base-content">
          {BUNDLE_OPTION.credits} credits
        </div>
        <div className="text-xs text-green-400 font-semibold">
          Save {BUNDLE_OPTION.savings} credits
        </div>
      </div>
    </button>
  );
}

