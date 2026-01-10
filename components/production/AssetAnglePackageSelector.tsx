'use client';
/**
 * Asset Angle Package Selector Component
 * 
 * UI for selecting asset angle packages
 * Similar to LocationAnglePackageSelector but for assets
 * 
 * 🔥 Feature 0190: Added 'single' package option for single image generation
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Star, Package, ImageIcon } from 'lucide-react';

interface AssetAnglePackage {
  id: string;
  name: string;
  angles: string[];
  credits: number; // Standard 1080p pricing
  credits4K: number; // High Quality 4K pricing
  consistencyRating: number;
  description: string;
  bestFor: string[];
  discount: number;
}

// All available asset angle types for single selection
const ALL_ANGLES = [
  { id: 'front', name: 'Front View', description: 'Direct front-facing view of the asset' },
  { id: 'side', name: 'Side View', description: 'Profile view from the side' },
  { id: 'top', name: 'Top View', description: 'Bird\'s eye view from above' },
  { id: 'back', name: 'Back View', description: 'View from behind the asset' },
  { id: 'detail', name: 'Detail', description: 'Close-up of specific features' },
  { id: 'context', name: 'Context', description: 'Asset in typical usage context' },
  { id: 'close-up', name: 'Close-up', description: 'Extreme close-up shot' },
  { id: 'lighting-variation', name: 'Lighting Variation', description: 'Same angle with different lighting' },
  { id: 'context-variation', name: 'Context Variation', description: 'Different usage context' },
  { id: 'aerial', name: 'Aerial', description: 'Elevated angle from above' }
];

interface AssetAnglePackageSelectorProps {
  assetName: string;
  onSelectPackage: (packageId: string) => void;
  selectedPackageId?: string;
  disabled?: boolean;
  quality?: 'standard' | 'high-quality'; // Quality tier affects pricing
  creditsPerImage?: number; // 🔥 NEW: Credits per image from selected model
  // 🔥 Feature 0190: Single angle selection
  selectedAngle?: string;
  onSelectedAngleChange?: (angleId: string) => void;
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

export default function AssetAnglePackageSelector({
  assetName,
  onSelectPackage,
  selectedPackageId,
  disabled = false,
  quality = 'standard',
  creditsPerImage = 20, // 🔥 NEW: Default to 20 credits if not provided
  // 🔥 Feature 0190: Single angle selection
  selectedAngle,
  onSelectedAngleChange
}: AssetAnglePackageSelectorProps) {
  
  // 🔥 NEW: Calculate credits dynamically based on selected model
  const calculatePackageCredits = (angleCount: number): number => {
    return angleCount * creditsPerImage;
  };
  
  const [packages, setPackages] = useState<AssetAnglePackage[]>([
    // 🔥 Feature 0190: Single package option
    {
      id: 'single',
      name: 'Single Angle',
      angles: [], // Dynamic - user selects one
      credits: creditsPerImage, // 1 × creditsPerImage
      credits4K: creditsPerImage,
      consistencyRating: 50,
      description: 'Generate one specific angle',
      bestFor: ['Quick test', 'Specific need'],
      discount: 0
    },
    {
      id: 'basic',
      name: 'Basic Package',
      angles: ['front', 'side', 'top'],
      credits: calculatePackageCredits(3), // 🔥 DYNAMIC: 3 angles × creditsPerImage
      credits4K: calculatePackageCredits(3), // Will be updated dynamically
      consistencyRating: 85,
      description: 'Essential 3 angles for quick tests',
      bestFor: ['Quick tests', 'Simple props', 'Single scenes'],
      discount: 0
    },
    {
      id: 'standard',
      name: 'Standard Package',
      angles: ['front', 'side', 'top', 'back', 'detail', 'context'],
      credits: calculatePackageCredits(6), // 🔥 DYNAMIC: 6 angles × creditsPerImage
      credits4K: calculatePackageCredits(6), // Will be updated dynamically
      consistencyRating: 88,
      description: '6 essential angles for multi-scene films',
      bestFor: ['Multiple scenes', 'Dialogue', 'Standard coverage'],
      discount: 0
    },
    {
      id: 'premium',
      name: 'Premium Package',
      angles: ['front', 'side', 'top', 'back', 'detail', 'context', 'close-up', 'lighting-variation', 'context-variation', 'aerial'],
      credits: calculatePackageCredits(10), // 🔥 DYNAMIC: 10 angles × creditsPerImage
      credits4K: calculatePackageCredits(10), // Will be updated dynamically
      consistencyRating: 90,
      description: '10 angles for professional productions',
      bestFor: ['Professional films', 'Complex scenes', 'Action sequences'],
      discount: 0
    }
  ]);
  
  // 🔥 NEW: Update package credits when creditsPerImage changes
  useEffect(() => {
    const calculateCredits = (angleCount: number): number => {
      return angleCount * creditsPerImage;
    };
    setPackages(prev => prev.map(pkg => ({
      ...pkg,
      credits: pkg.id === 'single' ? creditsPerImage : calculateCredits(pkg.angles.length),
      credits4K: pkg.id === 'single' ? creditsPerImage : calculateCredits(pkg.angles.length)
    })));
  }, [creditsPerImage]);
  
  // 🔥 FIX: Normalize selectedAngle to always be a string (never undefined)
  const normalizedSelectedAngle = selectedAngle || 'front';
  
  // 🔥 Feature 0190: Auto-select first angle when single package is selected
  useEffect(() => {
    if (selectedPackageId === 'single' && !selectedAngle && onSelectedAngleChange) {
      onSelectedAngleChange('front'); // Default to front view
    }
  }, [selectedPackageId, selectedAngle, onSelectedAngleChange]);
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-100 mb-2">
          Choose Angle Package for {assetName}
        </h2>
        <p className="text-base-content/60">
          More angles = better prop consistency across all scenes
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {packages.map((pkg) => {
          const Icon = PACKAGE_ICONS[pkg.id];
          const isSelected = selectedPackageId === pkg.id;
          const isRecommended = pkg.id === 'standard';
          const displayCredits = pkg.credits; // 🔥 DYNAMIC: Now uses calculated credits
          
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
                  {displayCredits}
                  <span className="text-sm font-normal text-base-content/60 ml-1">credits</span>
                </div>
                {quality === 'high-quality' && (
                  <div className="text-xs text-base-content/50">
                    (4K)
                  </div>
                )}
                {pkg.discount > 0 && (
                  <div className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded">
                    {pkg.discount}% OFF
                  </div>
                )}
              </div>
              
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
              
              {/* Description */}
              <p className="text-base-content/60 text-sm mb-4">
                {pkg.description}
              </p>
              
              {/* Angle Count */}
              <div className="text-sm text-base-content/70 mb-4">
                <strong>{pkg.angles.length} angles</strong> included
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
      
      {/* 🔥 Feature 0190: Single angle dropdown */}
      {selectedPackageId === 'single' && (
        <div className="p-4 bg-base-300/50 border border-base-content/20 rounded-lg">
          <label className="block text-sm font-medium text-base-content mb-2">
            Select Angle:
          </label>
          <select
            key={`single-angle-select-${selectedPackageId}`}
            value={normalizedSelectedAngle}
            onChange={(e) => {
              if (onSelectedAngleChange) {
                onSelectedAngleChange(e.target.value);
              }
            }}
            disabled={disabled}
            className="w-full px-4 py-2.5 bg-base-200 border border-base-content/20 rounded-lg text-base-content text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {ALL_ANGLES.map((angle) => (
              <option key={angle.id} value={angle.id}>
                {angle.name} - {angle.description}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-base-content/50">
            Generate a single angle image. Great for trying out a specific view before committing to a full package.
          </p>
        </div>
      )}
      
      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start">
          <Package className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-base-content/70">
            <strong className="text-base-content">Pro Tip:</strong> Higher tier packages generate more angle variations,
            which dramatically improves prop consistency across different camera angles and scenes.
            The AI will automatically select the best reference for each shot.
          </div>
        </div>
      </div>
    </div>
  );
}

