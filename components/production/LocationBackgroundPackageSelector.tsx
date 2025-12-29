'use client';
/**
 * Location Background Package Selector Component
 * 
 * UI for selecting location background packages
 * Backgrounds are close-up views of specific areas within a location
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Star, Image } from 'lucide-react';

interface LocationBackgroundPackage {
  id: string;
  name: string;
  backgroundTypes: string[];
  credits: number;
  description: string;
  bestFor: string[];
  discount: number;
}

interface LocationBackgroundPackageSelectorProps {
  locationName: string;
  onSelectPackage: (packageId: string) => void;
  selectedPackageId?: string;
  disabled?: boolean;
  creditsPerImage?: number; // Credits per image from selected model
}

const PACKAGE_ICONS: Record<string, any> = {
  basic: Zap,
  standard: Check,
  premium: Star
};

const PACKAGE_COLORS: Record<string, string> = {
  basic: 'from-base-content/50 to-base-content/40',
  standard: 'from-blue-500 to-blue-600',
  premium: 'from-purple-500 to-purple-600'
};

export default function LocationBackgroundPackageSelector({
  locationName,
  onSelectPackage,
  selectedPackageId,
  disabled = false,
  creditsPerImage = 20 // Default to 20 credits if not provided
}: LocationBackgroundPackageSelectorProps) {
  
  // Calculate credits dynamically based on selected model
  const calculatePackageCredits = (backgroundCount: number): number => {
    return backgroundCount * creditsPerImage;
  };
  
  const [packages, setPackages] = useState<LocationBackgroundPackage[]>([
    {
      id: 'basic',
      name: 'Basic Package',
      backgroundTypes: ['window', 'wall', 'doorway'],
      credits: calculatePackageCredits(3), // 3 backgrounds × creditsPerImage
      description: 'Essential 3 backgrounds for close-up shots',
      bestFor: ['Quick dialogue', 'Simple close-ups', 'Basic coverage'],
      discount: 0
    },
    {
      id: 'standard',
      name: 'Standard Package',
      backgroundTypes: ['window', 'wall', 'doorway', 'texture', 'corner-detail', 'furniture'],
      credits: calculatePackageCredits(6), // 6 backgrounds × creditsPerImage
      description: '6 backgrounds for comprehensive dialogue coverage',
      bestFor: ['Multiple dialogue scenes', 'Varied close-ups', 'Standard coverage'],
      discount: 0
    },
    {
      id: 'premium',
      name: 'Premium Package',
      backgroundTypes: ['window', 'wall', 'doorway', 'texture', 'corner-detail', 'furniture', 'architectural-feature', 'custom', 'custom'],
      credits: calculatePackageCredits(9), // 9 backgrounds × creditsPerImage
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
      credits: calculateCredits(pkg.backgroundTypes.length)
    })));
  }, [creditsPerImage]);
  
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              
              {/* Background Count */}
              <div className="text-sm text-base-content/70 mb-4">
                <strong>{pkg.backgroundTypes.length} backgrounds</strong> included
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

