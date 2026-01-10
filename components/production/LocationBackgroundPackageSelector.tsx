'use client';
/**
 * Location Background Package Selector Component
 * 
 * UI for selecting location background packages
 * Backgrounds are close-up views of specific areas within a location
 * 
 * 🔥 Feature 0190: Added 'single' package option for single image generation
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Star, Image, ImageIcon } from 'lucide-react';

interface LocationBackgroundPackage {
  id: string;
  name: string;
  backgroundTypes: string[];
  credits: number;
  consistencyRating: number;
  description: string;
  bestFor: string[];
  discount: number;
}

// All available background types for single selection
const ALL_BACKGROUND_TYPES = [
  { id: 'window', name: 'Window', description: 'View through or near a window' },
  { id: 'wall', name: 'Wall', description: 'Plain or decorated wall surface' },
  { id: 'doorway', name: 'Doorway', description: 'Door or entrance frame' },
  { id: 'texture', name: 'Texture', description: 'Detailed surface texture close-up' },
  { id: 'corner-detail', name: 'Corner Detail', description: 'Architectural corner elements' },
  { id: 'furniture', name: 'Furniture', description: 'Furniture or fixture background' },
  { id: 'architectural-feature', name: 'Architectural Feature', description: 'Unique architectural elements' },
  { id: 'custom', name: 'Custom', description: 'Custom background with description prompt' }
];

interface LocationBackgroundPackageSelectorProps {
  locationName: string;
  onSelectPackage: (packageId: string) => void;
  selectedPackageId?: string;
  disabled?: boolean;
  creditsPerImage?: number; // Credits per image from selected model
  compact?: boolean; // 🔥 NEW: Compact mode for smaller display
  // 🔥 Feature 0190: Single background type selection
  selectedBackgroundType?: string;
  onSelectedBackgroundTypeChange?: (backgroundTypeId: string) => void;
}

const PACKAGE_ICONS: Record<string, any> = {
  single: ImageIcon,
  basic: Zap,
  standard: Check,
  premium: Star
};

const PACKAGE_COLORS: Record<string, string> = {
  single: 'from-emerald-500 to-emerald-600',
  basic: 'from-base-content/50 to-base-content/40',
  standard: 'from-blue-500 to-blue-600',
  premium: 'from-purple-500 to-purple-600'
};

export default function LocationBackgroundPackageSelector({
  locationName,
  onSelectPackage,
  selectedPackageId,
  disabled = false,
  creditsPerImage = 20, // Default to 20 credits if not provided
  compact = false, // 🔥 NEW: Compact mode
  // 🔥 Feature 0190: Single background type selection
  selectedBackgroundType,
  onSelectedBackgroundTypeChange
}: LocationBackgroundPackageSelectorProps) {
  
  // Calculate credits dynamically based on selected model
  const calculatePackageCredits = (backgroundCount: number): number => {
    return backgroundCount * creditsPerImage;
  };
  
  const [packages, setPackages] = useState<LocationBackgroundPackage[]>([
    // 🔥 Feature 0190: Single package option
    {
      id: 'single',
      name: 'Single Background',
      backgroundTypes: [], // Dynamic - user selects one
      credits: creditsPerImage, // 1 × creditsPerImage
      consistencyRating: 50,
      description: 'Generate one specific background',
      bestFor: ['Quick test', 'Specific need'],
      discount: 0
    },
    {
      id: 'basic',
      name: 'Basic Package',
      backgroundTypes: ['window', 'wall', 'doorway'],
      credits: calculatePackageCredits(3), // 3 backgrounds × creditsPerImage
      consistencyRating: 70,
      description: 'Essential 3 backgrounds for close-up shots',
      bestFor: ['Quick dialogue', 'Simple close-ups', 'Basic coverage'],
      discount: 0
    },
    {
      id: 'standard',
      name: 'Standard Package',
      backgroundTypes: ['window', 'wall', 'doorway', 'texture', 'corner-detail', 'furniture'],
      credits: calculatePackageCredits(6), // 6 backgrounds × creditsPerImage
      consistencyRating: 85,
      description: '6 backgrounds for comprehensive dialogue coverage',
      bestFor: ['Multiple dialogue scenes', 'Varied close-ups', 'Standard coverage'],
      discount: 0
    },
    {
      id: 'premium',
      name: 'Premium Package',
      backgroundTypes: ['window', 'wall', 'doorway', 'texture', 'corner-detail', 'furniture', 'architectural-feature', 'custom', 'custom'],
      credits: calculatePackageCredits(9), // 9 backgrounds × creditsPerImage
      consistencyRating: 92,
      description: '9 backgrounds including custom options for professional productions',
      bestFor: ['Professional films', 'Complex dialogue', 'Detailed close-ups'],
      discount: 0
    }
  ]);
  
  // Update package credits when creditsPerImage changes
  useEffect(() => {
    const calculateCredits = (backgroundCount: number): number => {
      return backgroundCount * creditsPerImage;
    };
    setPackages(prev => prev.map(pkg => ({
      ...pkg,
      credits: pkg.id === 'single' ? creditsPerImage : calculateCredits(pkg.backgroundTypes.length)
    })));
  }, [creditsPerImage]);
  
  // 🔥 Feature 0190: Auto-select first background type when single package is selected
  useEffect(() => {
    if (selectedPackageId === 'single' && !selectedBackgroundType && onSelectedBackgroundTypeChange) {
      onSelectedBackgroundTypeChange('window'); // Default to window
    }
  }, [selectedPackageId, selectedBackgroundType, onSelectedBackgroundTypeChange]);
  
  if (compact) {
    // Compact horizontal layout
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-[#808080] mb-2">
          <span>More backgrounds = better variety for close-up shots</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {packages.map((pkg) => {
          const Icon = PACKAGE_ICONS[pkg.id];
          const isSelected = selectedPackageId === pkg.id;
          const isRecommended = pkg.id === 'standard';
          
          // Compact card design
          return (
              <motion.div
                key={pkg.id}
                whileHover={!disabled ? { scale: 1.05 } : {}}
                whileTap={!disabled ? { scale: 0.95 } : {}}
                className={`
                  relative rounded-lg border-2 p-3 cursor-pointer transition-all
                  ${isSelected 
                    ? 'border-[#DC143C] bg-[#DC143C]/10' 
                    : 'border-[#3F3F46] bg-[#0A0A0A] hover:border-[#DC143C]/50'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => !disabled && onSelectPackage(pkg.id)}
              >
                {/* Recommended Badge */}
                {isRecommended && (
                  <div className="absolute -top-1.5 -right-1.5">
                    <div className="bg-[#DC143C] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      REC
                    </div>
                  </div>
                )}
                
                {/* Package Icon & Name */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded bg-gradient-to-br ${PACKAGE_COLORS[pkg.id]}`}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h3 className="text-xs font-semibold text-white truncate">
                    {pkg.name.replace(' Package', '')}
                  </h3>
                </div>
                
                {/* Credits */}
                <div className="text-sm font-bold text-white mb-1.5">
                  {pkg.credits} <span className="text-[10px] font-normal text-[#808080]">credits</span>
                </div>
                
                {/* Consistency & Backgrounds */}
                <div className="space-y-1 mb-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#808080]">Consistency</span>
                    <span className="text-white font-semibold">{pkg.consistencyRating}%</span>
                  </div>
                  <div className="w-full bg-[#3F3F46] rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full bg-gradient-to-r ${PACKAGE_COLORS[pkg.id]}`}
                      style={{ width: `${pkg.consistencyRating}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-[#808080]">
                    {pkg.backgroundTypes.length} backgrounds
                  </div>
                  {/* Background Preview - Show all types */}
                  <div className="text-[9px] text-[#808080] mt-1">
                    <div className="flex flex-wrap gap-1">
                      {pkg.backgroundTypes.map((bgType, idx) => {
                        const formatted = bgType
                          .split('-')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');
                        return (
                          <span key={idx} className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
                            {formatted}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Selected Indicator */}
                {isSelected && (
                  <div className="mt-2 py-1 bg-[#DC143C] text-white text-center rounded text-[10px] font-semibold">
                    ✓ Selected
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
        
        {/* 🔥 Feature 0190: Single background type dropdown */}
        {selectedPackageId === 'single' && (
          <div className="mt-4 p-4 bg-[#1A1A1A] border border-[#3F3F46] rounded-lg">
            <label className="block text-xs font-medium text-white mb-2">
              Select Background Type:
            </label>
            <select
              value={selectedBackgroundType || 'window'}
              onChange={(e) => {
                console.log('[LocationBackgroundPackageSelector] Compact dropdown changed:', e.target.value);
                if (onSelectedBackgroundTypeChange) {
                  onSelectedBackgroundTypeChange(e.target.value);
                } else {
                  console.warn('[LocationBackgroundPackageSelector] onSelectedBackgroundTypeChange callback not provided');
                }
              }}
              disabled={disabled}
              className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent"
            >
              {ALL_BACKGROUND_TYPES.map((bgType) => (
                <option key={bgType.id} value={bgType.id}>
                  {bgType.name} - {bgType.description}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  }
  
  // Full layout (original)
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-100 mb-2">
          Choose Background Package for {locationName}
        </h2>
        <p className="text-base-content/60">
          More backgrounds = better variety for close-up shots and dialogue scenes
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((pkg) => {
          const Icon = PACKAGE_ICONS[pkg.id];
          const isSelected = selectedPackageId === pkg.id;
          const isRecommended = pkg.id === 'standard';
          
          return (
            <motion.div
              key={pkg.id}
              whileHover={!disabled ? { scale: 1.02 } : {}}
              whileTap={!disabled ? { scale: 0.98 } : {}}
              className={`
                relative rounded-xl border-2 p-6 cursor-pointer transition-all
                ${isSelected 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-base-content/20 bg-base-300/50 hover:border-base-content/30'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onClick={() => !disabled && onSelectPackage(pkg.id)}
            >
              {/* Recommended Badge */}
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-blue-500 text-base-content text-xs font-bold px-3 py-1 rounded-full">
                    RECOMMENDED
                  </div>
                </div>
              )}
              
              {/* Package Icon */}
              <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${PACKAGE_COLORS[pkg.id]} mb-4`}>
                <Icon className="w-6 h-6 text-base-content" />
              </div>
              
              {/* Package Name */}
              <h3 className="text-xl font-bold text-gray-100 mb-2">
                {pkg.name}
              </h3>
              
              {/* Credits */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl font-bold text-base-content">
                  {pkg.credits}
                  <span className="text-sm font-normal text-base-content/60 ml-1">credits</span>
                </div>
                {pkg.discount > 0 && (
                  <div className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded">
                    {pkg.discount}% OFF
                  </div>
                )}
              </div>
              
              {/* Description */}
              <p className="text-base-content/60 text-sm mb-4">
                {pkg.description}
              </p>
              
              {/* Consistency Rating */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-base-content/60">Consistency</span>
                  <span className="text-base-content font-bold">{pkg.consistencyRating}%</span>
                </div>
                <div className="w-full bg-base-content/20 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full bg-gradient-to-r ${PACKAGE_COLORS[pkg.id]}`}
                    style={{ width: `${pkg.consistencyRating}%` }}
                  />
                </div>
              </div>
              
              {/* Background Count */}
              <div className="text-sm text-base-content/70 mb-3">
                <strong>{pkg.backgroundTypes.length} backgrounds</strong> included
              </div>
              
              {/* Background Type List - Show all types without truncation */}
              <div className="mb-4 space-y-2 max-h-48 overflow-y-auto">
                <div className="flex flex-wrap gap-1.5">
                  {pkg.backgroundTypes.map((bgType, idx) => {
                    const formatted = bgType
                      .split('-')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ');
                    return (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30 text-[10px]"
                      >
                        {formatted}
                      </span>
                    );
                  })}
                </div>
              </div>
              
              {/* Best For */}
              <div className="space-y-1 mb-4">
                <div className="text-xs font-semibold text-base-content/50 uppercase">Best For:</div>
                {pkg.bestFor.map((use, idx) => (
                  <div key={idx} className="flex items-center text-sm text-base-content/60">
                    <Check className="w-3 h-3 text-green-400 mr-2 flex-shrink-0" />
                    {use}
                  </div>
                ))}
              </div>
              
              {/* Select Button */}
              {isSelected && (
                <div className="mt-4 py-2 bg-blue-500 text-base-content text-center rounded-lg font-semibold">
                  ✓ Selected
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      
      {/* 🔥 Feature 0190: Single background type dropdown */}
      {selectedPackageId === 'single' && (
        <div className="p-4 bg-base-300/50 border border-base-content/20 rounded-lg">
          <label className="block text-sm font-medium text-base-content mb-2">
            Select Background Type:
          </label>
          <select
            value={selectedBackgroundType || 'window'}
            onChange={(e) => {
              console.log('[LocationBackgroundPackageSelector] Dropdown changed:', e.target.value);
              if (onSelectedBackgroundTypeChange) {
                onSelectedBackgroundTypeChange(e.target.value);
              } else {
                console.warn('[LocationBackgroundPackageSelector] onSelectedBackgroundTypeChange callback not provided');
              }
            }}
            disabled={disabled}
            className="w-full px-4 py-2.5 bg-base-200 border border-base-content/20 rounded-lg text-base-content text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {ALL_BACKGROUND_TYPES.map((bgType) => (
              <option key={bgType.id} value={bgType.id}>
                {bgType.name} - {bgType.description}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-base-content/50">
            Generate a single background image. Great for trying out a specific type before committing to a full package.
          </p>
        </div>
      )}
      
      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start">
          <Image className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-base-content/70">
            <strong className="text-base-content">Pro Tip:</strong> Backgrounds are close-up views of specific areas 
            (windows, walls, doorways, etc.) perfect for dialogue shots and close-ups. They're grouped with location 
            angles by metadata (time of day, weather) for easy selection.
          </div>
        </div>
      </div>
    </div>
  );
}

