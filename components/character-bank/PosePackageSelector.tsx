'use client';
/**
 * Pose Package Selector Component
 * 
 * UI for selecting and generating character pose packages
 * Part of Feature 0098: Complete Character & Location Consistency System
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Star, Crown, MessageCircle } from 'lucide-react';

interface PosePackage {
  id: string;
  name: string;
  poses: string[];
  credits: number;
  consistencyRating: number;
  description: string;
  bestFor: string[];
  discount: number;
}

interface PosePackageSelectorProps {
  characterName: string;
  onSelectPackage: (packageId: string) => void;
  selectedPackageId?: string;
  disabled?: boolean;
  creditsPerImage?: number; // 🔥 NEW: Credits per image from selected model
}

const PACKAGE_ICONS: Record<string, any> = {
  basic: Zap,
  standard: Check,
  premium: Star,
  cinematic: Sparkles,
  master: Crown,
  dialogue: MessageCircle
};

const PACKAGE_COLORS: Record<string, string> = {
  basic: 'from-base-content/50 to-base-content/40',
  standard: 'from-blue-500 to-blue-600',
  premium: 'from-purple-500 to-purple-600',
  cinematic: 'from-pink-500 to-red-600',
  master: 'from-yellow-500 to-orange-600',
  dialogue: 'from-green-500 to-emerald-600'
};

export default function PosePackageSelector({
  characterName,
  onSelectPackage,
  selectedPackageId,
  disabled = false,
  creditsPerImage = 20 // 🔥 NEW: Default to 20 credits if not provided
}: PosePackageSelectorProps) {
  
  // 🔥 NEW: Calculate credits dynamically based on selected model
  const calculatePackageCredits = (poseCount: number): number => {
    return poseCount * creditsPerImage;
  };
  
  const [packages, setPackages] = useState<PosePackage[]>([
    {
      id: 'basic',
      name: 'Basic Package',
      poses: ['front-facing', 'three-quarter-left', 'close-up'],
      credits: calculatePackageCredits(3), // 🔥 DYNAMIC: 3 poses × creditsPerImage
      consistencyRating: 75,
      description: 'Essential 3 poses for quick tests (includes headshot for dialogue)',
      bestFor: ['Quick tests', 'Simple scenes', 'Dialogue scenes', 'Single locations'],
      discount: 17
    },
    {
      id: 'standard',
      name: 'Standard Package',
      poses: ['front-facing', 'three-quarter-left', 'three-quarter-right', 'full-body-front', 'full-body-three-quarter', 'close-up', 'back-view-upper'],
      credits: calculatePackageCredits(7), // 🔥 DYNAMIC: 7 poses × creditsPerImage
      consistencyRating: 87,
      description: '7 essential angles for multi-scene films',
      bestFor: ['Multiple scenes', 'Dialogue', 'Standard coverage'],
      discount: 0
    },
    {
      id: 'premium',
      name: 'Premium Package',
      poses: ['front-facing', 'three-quarter-left', 'three-quarter-right', 'side-profile-left', 'full-body-front', 'full-body-three-quarter', 'back-view-full-body', 'walking-forward', 'standing-casual', 'close-up', 'neutral-expression'],
      credits: calculatePackageCredits(11), // 🔥 DYNAMIC: 11 poses × creditsPerImage
      consistencyRating: 93,
      description: '11 poses for professional productions',
      bestFor: ['Professional films', 'Complex scenes', 'Action sequences'],
      discount: 0
    },
    {
      id: 'cinematic',
      name: 'Cinematic Package',
      poses: ['front-facing', 'three-quarter-left', 'three-quarter-right', 'side-profile-left', 'side-profile-right', 'back-view', 'back-view-full-body', 'three-quarter-back', 'full-body-front', 'full-body-three-quarter', 'full-body-side', 'walking-forward', 'running', 'sitting', 'standing-confident', 'high-angle', 'low-angle', 'close-up'],
      credits: calculatePackageCredits(18), // 🔥 DYNAMIC: 18 poses × creditsPerImage
      consistencyRating: 98,
      description: '18 poses for high-end productions (includes headshot for dialogue)',
      bestFor: ['High-end films', 'Multiple angles', 'Dialogue scenes', 'Camera variety'],
      discount: 0
    },
    {
      id: 'master',
      name: 'Master Package',
      poses: ['front-facing', 'three-quarter-left', 'three-quarter-right', 'side-profile-left', 'side-profile-right', 'back-view', 'back-view-full-body', 'back-view-upper', 'three-quarter-back', 'full-body-front', 'full-body-three-quarter', 'full-body-side', 'walking-forward', 'running', 'sitting', 'standing-casual', 'standing-confident', 'neutral-expression', 'smiling', 'serious', 'determined', 'high-angle', 'low-angle', 'close-up', 'extreme-close-up', 'close-up-three-quarter'],
      credits: calculatePackageCredits(27), // 🔥 DYNAMIC: 27 poses × creditsPerImage
      consistencyRating: 99,
      description: 'Complete 27-pose set for maximum coverage (includes dialogue variations)',
      bestFor: ['Feature films', 'Complete coverage', 'Professional studios', 'Dialogue scenes'],
      discount: 0
    },
    {
      id: 'dialogue',
      name: 'Dialogue Package',
      poses: ['close-up', 'extreme-close-up', 'extreme-close-up-mouth', 'close-up-three-quarter', 'front-facing', 'close-up-profile'],
      credits: calculatePackageCredits(6), // 🔥 DYNAMIC: 6 poses × creditsPerImage
      consistencyRating: 96,
      description: '6 headshot variations optimized for dialogue and lip sync scenes',
      bestFor: ['Dialogue scenes', 'Lip sync', 'Talking head videos', 'Voice-over work', 'Dramatic mouth focus'],
      discount: 0
    }
  ]);
  
  // 🔥 NEW: Update package credits when creditsPerImage changes
  useEffect(() => {
    const calculateCredits = (poseCount: number): number => {
      return poseCount * creditsPerImage;
    };
    setPackages(prev => prev.map(pkg => ({
      ...pkg,
      credits: calculateCredits(pkg.poses.length)
    })));
  }, [creditsPerImage]);
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-100 mb-2">
          Choose Pose Package for {characterName}
        </h2>
        <p className="text-base-content/60">
          More poses = better character consistency across all scenes
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
              
              {/* Pose Count */}
              <div className="text-sm text-base-content/70 mb-4">
                <strong>{pkg.poses.length} poses</strong> included
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
          <Sparkles className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-base-content/70">
            <strong className="text-base-content">Pro Tip:</strong> Higher tier packages generate more pose variations,
            which dramatically improves character consistency across different camera angles and scenes.
            The AI will automatically select the best reference for each shot.
          </div>
        </div>
      </div>
    </div>
  );
}

