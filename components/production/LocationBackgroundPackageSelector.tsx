'use client';
/**
 * Location Background Package Selector Component
 * 
 * UI for selecting location background packages
 * Backgrounds are close-up views of specific areas within a location
 * 
 * 🔥 Feature 0190: Added 'single' package option for single image generation
 */

import { useState, useEffect, useRef, useMemo } from 'react';
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

type LocationSceneType = 'interior' | 'exterior' | 'mixed';

const SINGLE_BACKGROUND_TYPES_BY_SCENE: Record<LocationSceneType, Array<{ id: string; name: string; description: string }>> = {
  interior: [
    { id: 'window', name: 'Window', description: 'View through or near a window' },
    { id: 'wall', name: 'Wall', description: 'Plain or decorated wall surface' },
    { id: 'texture', name: 'Texture', description: 'Detailed surface texture close-up' },
    { id: 'furniture', name: 'Furniture', description: 'Furniture or fixture background' },
    { id: 'threshold', name: 'Threshold', description: 'Doorway/transition framing with depth' },
  ],
  exterior: [
    { id: 'ground-plane', name: 'Ground Plane', description: 'Ground-level surface and paving close-up' },
    { id: 'facade', name: 'Facade', description: 'Exterior facade, wall, or frontage detail' },
    { id: 'foliage', name: 'Foliage', description: 'Vegetation and landscaping background' },
    { id: 'skyline', name: 'Skyline', description: 'Open sky and distant horizon context' },
    { id: 'street-edge', name: 'Street Edge', description: 'Street-side edge, curb, or boundary context' },
  ],
  mixed: [
    { id: 'window', name: 'Window', description: 'Interior framing with visible exterior context' },
    { id: 'wall', name: 'Wall', description: 'Interior wall or partition background' },
    { id: 'ground-plane', name: 'Ground Plane', description: 'Ground-level continuity in mixed space' },
    { id: 'street-edge', name: 'Street Edge', description: 'Interior/exterior threshold edge context' },
    { id: 'threshold', name: 'Threshold', description: 'Transition-zone framing with depth' },
  ],
};

interface LocationBackgroundPackageSelectorProps {
  locationName: string;
  onSelectPackage: (packageId: string) => void;
  selectedPackageId?: string;
  disabled?: boolean;
  creditsPerImage?: number; // Credits per image from selected model
  compact?: boolean; // 🔥 NEW: Compact mode for smaller display
  locationType?: LocationSceneType;
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
  locationType = 'interior',
  // 🔥 Feature 0190: Single background type selection
  selectedBackgroundType,
  onSelectedBackgroundTypeChange
}: LocationBackgroundPackageSelectorProps) {
  const normalizedLocationType: LocationSceneType = locationType || 'interior';
  const singleTypeOptions = SINGLE_BACKGROUND_TYPES_BY_SCENE[normalizedLocationType] || SINGLE_BACKGROUND_TYPES_BY_SCENE.interior;
  const packageBackgroundTypesByScene: Record<LocationSceneType, Record<'basic' | 'standard' | 'premium', string[]>> = {
    interior: {
      basic: ['window', 'wall'],
      standard: ['window', 'wall', 'texture', 'furniture'],
      premium: ['window', 'wall', 'texture', 'furniture', 'threshold'],
    },
    exterior: {
      basic: ['ground-plane', 'facade'],
      standard: ['ground-plane', 'facade', 'foliage', 'skyline'],
      premium: ['ground-plane', 'facade', 'foliage', 'skyline', 'street-edge'],
    },
    mixed: {
      basic: ['window', 'ground-plane'],
      standard: ['window', 'wall', 'ground-plane', 'street-edge'],
      premium: ['window', 'wall', 'ground-plane', 'street-edge', 'threshold'],
    },
  };
  const scenePackageTypes = packageBackgroundTypesByScene[normalizedLocationType] || packageBackgroundTypesByScene.interior;

  
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
      backgroundTypes: scenePackageTypes.basic,
      credits: calculatePackageCredits(2), // 2 backgrounds × creditsPerImage
      consistencyRating: 70,
      description: 'Essential 2 backgrounds for quick close-up coverage',
      bestFor: ['Quick dialogue', 'Simple close-ups', 'Basic coverage'],
      discount: 0
    },
    {
      id: 'standard',
      name: 'Standard Package',
      backgroundTypes: scenePackageTypes.standard,
      credits: calculatePackageCredits(4), // 4 backgrounds × creditsPerImage
      consistencyRating: 85,
      description: '4 core backgrounds for comprehensive dialogue coverage',
      bestFor: ['Multiple dialogue scenes', 'Varied close-ups', 'Standard coverage'],
      discount: 0
    },
    {
      id: 'premium',
      name: 'Premium Package',
      backgroundTypes: scenePackageTypes.premium,
      credits: calculatePackageCredits(5), // 5 backgrounds × creditsPerImage
      consistencyRating: 92,
      description: '5 backgrounds including threshold framing for depth continuity',
      bestFor: ['Professional films', 'Complex dialogue', 'Depth-rich close-ups', 'Detailed close-ups'],
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
  }, [creditsPerImage, normalizedLocationType]);
  
  // Normalize selectedBackgroundType to always be a valid single-select option.
  const singleTypeIds = useMemo(() => singleTypeOptions.map((t) => t.id), [singleTypeOptions]);
  const normalizedSelectedBackgroundType =
    selectedBackgroundType && singleTypeIds.includes(selectedBackgroundType) ? selectedBackgroundType : singleTypeIds[0];

  // 🔥 FIX: Only auto-select when package FIRST becomes 'single', not on every render
  const hasInitializedRef = useRef<string>('');
  // If stored single background type is no longer valid for the scene, reset to first available option.
  useEffect(() => {
    if (selectedPackageId === 'single' && selectedBackgroundType && !singleTypeIds.includes(selectedBackgroundType) && onSelectedBackgroundTypeChange) {
      onSelectedBackgroundTypeChange(singleTypeIds[0]);
    }
  }, [selectedPackageId, selectedBackgroundType, onSelectedBackgroundTypeChange, singleTypeIds]);

  // 🔥 Feature 0190: Auto-select first background type when single package is selected
  useEffect(() => {
    if (selectedPackageId === 'single' &&
        hasInitializedRef.current !== selectedPackageId &&
        !selectedBackgroundType &&
        onSelectedBackgroundTypeChange) {
      onSelectedBackgroundTypeChange(singleTypeIds[0]);
      hasInitializedRef.current = selectedPackageId;
    } else if (selectedPackageId !== 'single') {
      hasInitializedRef.current = '';
    }
  }, [selectedPackageId, selectedBackgroundType, onSelectedBackgroundTypeChange, singleTypeIds]);
  
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
              key={`single-background-select-${selectedPackageId}`}
              value={normalizedSelectedBackgroundType}
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
              {singleTypeOptions.map((bgType) => (
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
            key={`single-background-select-${selectedPackageId}`}
            value={normalizedSelectedBackgroundType}
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
            {singleTypeOptions.map((bgType) => (
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
            (windows, walls, textures, furniture) perfect for dialogue shots and close-ups. They're grouped with location 
            angles by metadata (time of day, weather) for easy selection.
          </div>
        </div>
      </div>
    </div>
  );
}

