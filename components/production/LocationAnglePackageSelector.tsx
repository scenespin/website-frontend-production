'use client';
/**
 * Location Angle Package Selector Component
 * 
 * UI for selecting location angle packages
 * Part of Feature 0098: Complete Character & Location Consistency System
 * 
 * 🔥 Feature 0190: Added 'single' package option for single image generation
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Star, MapPin, ImageIcon } from 'lucide-react';

interface LocationAnglePackage {
  id: string;
  name: string;
  angles: string[];
  credits: number;
  consistencyRating: number;
  description: string;
  bestFor: string[];
  discount: number;
}

// All available angle types for single selection
const ALL_ANGLES = [
  { id: 'front', name: 'Front View', description: 'Direct front-facing view of the location' },
  { id: 'corner', name: 'Corner View', description: '45° corner view showing depth and two sides' },
  { id: 'wide', name: 'Wide Shot', description: 'Wide-angle establishing shot from distance' },
  { id: 'low-angle', name: 'Low Angle', description: 'Dramatic low angle shot looking up' },
  { id: 'entrance', name: 'Entrance', description: 'View from doorway or entry point' },
  { id: 'foreground-framing', name: 'Foreground Framing', description: 'Location framed by foreground elements' },
  { id: 'aerial', name: 'Aerial', description: 'Bird\'s eye view from above' },
  { id: 'pov', name: 'POV', description: 'First-person point of view at eye level' },
  { id: 'detail', name: 'Detail', description: 'Close-up of architectural features' },
  { id: 'atmospheric', name: 'Atmospheric', description: 'Moody shot with fog, mist, or haze' },
  { id: 'golden-hour', name: 'Golden Hour', description: 'Warm golden lighting at sunrise/sunset' }
];

interface LocationAnglePackageSelectorProps {
  locationName: string;
  onSelectPackage: (packageId: string) => void;
  selectedPackageId?: string;
  disabled?: boolean;
  creditsPerImage?: number; // 🔥 NEW: Credits per image from selected model
  compact?: boolean; // 🔥 NEW: Compact mode for smaller display
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

export default function LocationAnglePackageSelector({
  locationName,
  onSelectPackage,
  selectedPackageId,
  disabled = false,
  creditsPerImage = 20, // 🔥 NEW: Default to 20 credits if not provided
  compact = false, // 🔥 NEW: Compact mode
  // 🔥 Feature 0190: Single angle selection
  selectedAngle,
  onSelectedAngleChange
}: LocationAnglePackageSelectorProps) {
  
  // 🔥 NEW: Calculate credits dynamically based on selected model
  const calculatePackageCredits = (angleCount: number): number => {
    return angleCount * creditsPerImage;
  };
  
  const [packages, setPackages] = useState<LocationAnglePackage[]>([
    // 🔥 Feature 0190: Single package option
    {
      id: 'single',
      name: 'Single Angle',
      angles: [], // Dynamic - user selects one
      credits: creditsPerImage, // 1 × creditsPerImage
      consistencyRating: 50,
      description: 'Generate one specific angle',
      bestFor: ['Quick test', 'Specific need'],
      discount: 0
    },
    {
      id: 'basic',
      name: 'Basic Package',
      angles: ['front', 'corner', 'wide'],
      credits: calculatePackageCredits(3), // 🔥 DYNAMIC: 3 angles × creditsPerImage
      consistencyRating: 70,
      description: 'Essential 3 angles for quick tests',
      bestFor: ['Quick tests', 'Simple scenes', 'Single locations'],
      discount: 0
    },
    {
      id: 'standard',
      name: 'Standard Package',
      angles: ['front', 'corner', 'wide', 'low-angle', 'entrance', 'foreground-framing'],
      credits: calculatePackageCredits(6), // 🔥 DYNAMIC: 6 angles × creditsPerImage
      consistencyRating: 85,
      description: '6 cinematic angles for multi-scene films',
      bestFor: ['Multiple scenes', 'Dialogue', 'Standard coverage'],
      discount: 0
    },
    {
      id: 'premium',
      name: 'Premium Package',
      angles: ['front', 'corner', 'wide', 'low-angle', 'entrance', 'foreground-framing', 'aerial', 'pov', 'detail', 'atmospheric', 'golden-hour'],
      credits: calculatePackageCredits(11), // 🔥 DYNAMIC: 11 angles × creditsPerImage
      consistencyRating: 92,
      description: '11 cinematic angles for professional productions',
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
      credits: pkg.id === 'single' ? creditsPerImage : calculateCredits(pkg.angles.length)
    })));
  }, [creditsPerImage]);
  
  // 🔥 Feature 0190: Auto-select first angle when single package is selected
  // 🔥 FIX: Only auto-select if selectedAngle is explicitly undefined/null/empty
  useEffect(() => {
    if (selectedPackageId === 'single' && (!selectedAngle || selectedAngle === '') && onSelectedAngleChange) {
      console.log('[LocationAnglePackageSelector] Auto-selecting front angle (was:', selectedAngle, ')');
      onSelectedAngleChange('front'); // Default to front view
    }
  }, [selectedPackageId]); // 🔥 FIX: Only depend on packageId, not selectedAngle (prevents reset loop)
  
  if (compact) {
    // Compact horizontal layout
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-[#808080] mb-2">
          <span>More angles = better location consistency</span>
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
                
                {/* Consistency & Angles */}
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
                    {pkg.angles.length} angles
                  </div>
                  {/* Angle Preview - Show all angles */}
                  <div className="text-[9px] text-[#808080] mt-1">
                    <div className="flex flex-wrap gap-1">
                      {pkg.angles.map((angle, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
                          {angle.charAt(0).toUpperCase() + angle.slice(1).replace(/-/g, ' ')}
                        </span>
                      ))}
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
        
        {/* 🔥 Feature 0190: Single angle dropdown */}
        {selectedPackageId === 'single' && (
          <div className="mt-4 p-4 bg-[#1A1A1A] border border-[#3F3F46] rounded-lg">
            <label className="block text-xs font-medium text-white mb-2">
              Select Angle:
            </label>
            <select
              value={selectedAngle || 'front'}
              onChange={(e) => {
                const newAngle = e.target.value;
                console.log('[LocationAnglePackageSelector] Compact dropdown changed:', { from: selectedAngle, to: newAngle });
                if (onSelectedAngleChange) {
                  onSelectedAngleChange(newAngle);
                }
              }}
              disabled={disabled}
              className="select select-bordered w-full"
            >
              {ALL_ANGLES.map((angle) => (
                <option key={angle.id} value={angle.id}>
                  {angle.name} - {angle.description}
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
          Choose Angle Package for {locationName}
        </h2>
        <p className="text-base-content/60">
          More angles = better location consistency across all scenes
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
              <div className="text-sm text-base-content/70 mb-3">
                <strong>{pkg.angles.length} angles</strong> included
              </div>
              
              {/* Angle List - Show all angles without truncation */}
              <div className="mb-4 space-y-2 max-h-48 overflow-y-auto">
                <div className="flex flex-wrap gap-1.5">
                  {pkg.angles.map((angle, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30 text-[10px]"
                    >
                      {angle.charAt(0).toUpperCase() + angle.slice(1).replace(/-/g, ' ')}
                    </span>
                  ))}
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
      
      {/* 🔥 Feature 0190: Single angle dropdown */}
      {selectedPackageId === 'single' && (
        <div className="p-4 bg-base-300/50 border border-base-content/20 rounded-lg">
          <label className="block text-sm font-medium text-base-content mb-2">
            Select Angle:
          </label>
          <select
            value={selectedAngle || 'front'}
            onChange={(e) => {
              const newAngle = e.target.value;
              console.log('[LocationAnglePackageSelector] Dropdown changed:', { from: selectedAngle, to: newAngle });
              if (onSelectedAngleChange) {
                onSelectedAngleChange(newAngle);
              }
            }}
            disabled={disabled}
            className="select select-bordered w-full"
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
          <MapPin className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-base-content/70">
            <strong className="text-base-content">Pro Tip:</strong> Higher tier packages generate more angle variations,
            which dramatically improves location consistency across different camera angles and scenes.
            The AI will automatically select the best reference for each shot.
          </div>
        </div>
      </div>
    </div>
  );
}

