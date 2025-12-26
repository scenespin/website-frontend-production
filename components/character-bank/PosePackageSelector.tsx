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
  compact?: boolean; // 🔥 NEW: Compact mode for smaller display
}

const PACKAGE_ICONS: Record<string, any> = {
  basic: Zap,
  standard: Check,
  premium: Star,
  cinematic: Sparkles,
  dialogue: MessageCircle
};

const PACKAGE_COLORS: Record<string, string> = {
  basic: 'from-base-content/50 to-base-content/40',
  standard: 'from-blue-500 to-blue-600',
  premium: 'from-purple-500 to-purple-600',
  cinematic: 'from-pink-500 to-red-600',
  dialogue: 'from-green-500 to-emerald-600'
};

/**
 * Format pose name for display (convert kebab-case to readable)
 */
function formatPoseName(pose: string): string {
  return pose
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Group poses by category for better display
 */
function groupPosesByCategory(poses: string[]): { category: string; poses: string[] }[] {
  const categories: Record<string, string[]> = {
    'Angles': [],
    'Expressions': [],
    'Actions': [],
    'Close-ups': [],
    'Other': []
  };

  poses.forEach(pose => {
    const formatted = formatPoseName(pose);
    if (pose.includes('close-up') || pose.includes('extreme-close-up')) {
      categories['Close-ups'].push(formatted);
    } else if (pose.includes('smiling') || pose.includes('serious') || pose.includes('neutral-expression') || pose.includes('determined')) {
      categories['Expressions'].push(formatted);
    } else if (pose.includes('walking') || pose.includes('running') || pose.includes('sitting') || pose.includes('standing')) {
      categories['Actions'].push(formatted);
    } else if (pose.includes('front') || pose.includes('side') || pose.includes('back') || pose.includes('three-quarter') || pose.includes('angle') || pose.includes('profile')) {
      categories['Angles'].push(formatted);
    } else {
      categories['Other'].push(formatted);
    }
  });

  return Object.entries(categories)
    .filter(([_, poses]) => poses.length > 0)
    .map(([category, poses]) => ({ category, poses }));
}

export default function PosePackageSelector({
  characterName,
  onSelectPackage,
  selectedPackageId,
  disabled = false,
  creditsPerImage = 20, // 🔥 NEW: Default to 20 credits if not provided
  compact = false // 🔥 NEW: Compact mode
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
      // 🔥 CAPPED AT 12 POSES: Balanced selection for maximum first frame usage (with location/assets)
      // Builds on Premium (11) by adding: side-profile-right, three-quarter-back, high-angle, low-angle
      // Removed redundant poses, focused on unique camera angles and expressions
      poses: ['front-facing', 'three-quarter-left', 'three-quarter-right', 'side-profile-left', 'side-profile-right', 'three-quarter-back', 'full-body-front', 'full-body-three-quarter', 'back-view-full-body', 'high-angle', 'low-angle', 'close-up'],
      credits: calculatePackageCredits(12), // 🔥 DYNAMIC: 12 poses × creditsPerImage (capped at model limit minus location/assets)
      consistencyRating: 98,
      description: '12 carefully curated poses for high-end productions (optimized for first frame generation with locations/assets)',
      bestFor: ['High-end films', 'Multiple angles', 'Camera variety', 'Maximum consistency'],
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
  
  if (compact) {
    // Compact horizontal layout
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-[#808080] mb-2">
          <span>More poses = better character consistency</span>
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
                
                {/* Consistency & Poses */}
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
                    {pkg.poses.length} poses
                  </div>
                  {/* Pose Preview */}
                  <div className="text-[9px] text-[#808080] mt-1 line-clamp-2">
                    {pkg.poses.slice(0, 3).map(formatPoseName).join(', ')}
                    {pkg.poses.length > 3 && ` +${pkg.poses.length - 3} more`}
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
      </div>
    );
  }
  
  // Full layout (original)
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
              <div className="text-sm text-base-content/70 mb-3">
                <strong>{pkg.poses.length} poses</strong> included
              </div>
              
              {/* Pose List by Category */}
              <div className="mb-4 space-y-2 max-h-48 overflow-y-auto">
                {groupPosesByCategory(pkg.poses).map(({ category, poses }) => (
                  <div key={category}>
                    <div className="text-xs font-semibold text-base-content/50 uppercase mb-1">
                      {category}:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {poses.map((pose, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-base-content/10 text-base-content/70 text-[10px] rounded"
                        >
                          {pose}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Usage Note */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2 mb-4">
                <div className="text-[10px] text-base-content/60">
                  <strong className="text-base-content/80">Note:</strong> Up to 12 character poses used per first frame (with 1-2 location/asset references). All poses available for character consistency across multiple scenes.
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

