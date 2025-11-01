'use client';
/**
 * Pose Package Selector Component
 * 
 * UI for selecting and generating character pose packages
 * Part of Feature 0098: Complete Character & Location Consistency System
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Star, Crown } from 'lucide-react';

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
}

const PACKAGE_ICONS: Record<string, any> = {
  basic: Zap,
  standard: Check,
  premium: Star,
  cinematic: Sparkles,
  master: Crown
};

const PACKAGE_COLORS: Record<string, string> = {
  basic: 'from-gray-500 to-gray-600',
  standard: 'from-blue-500 to-blue-600',
  premium: 'from-purple-500 to-purple-600',
  cinematic: 'from-pink-500 to-red-600',
  master: 'from-yellow-500 to-orange-600'
};

export default function PosePackageSelector({
  characterName,
  onSelectPackage,
  selectedPackageId,
  disabled = false
}: PosePackageSelectorProps) {
  
  const [packages, setPackages] = useState<PosePackage[]>([
    {
      id: 'basic',
      name: 'Basic Package',
      poses: ['front-facing', 'three-quarter-left', 'full-body-front'],
      credits: 60,
      consistencyRating: 70,
      description: 'Essential 3 poses for quick tests',
      bestFor: ['Quick tests', 'Simple scenes', 'Single locations'],
      discount: 17
    },
    {
      id: 'standard',
      name: 'Standard Package',
      poses: ['front-facing', 'three-quarter-left', 'three-quarter-right', 'full-body-front', 'full-body-three-quarter', 'close-up'],
      credits: 120,
      consistencyRating: 85,
      description: '6 essential angles for multi-scene films',
      bestFor: ['Multiple scenes', 'Dialogue', 'Standard coverage'],
      discount: 17
    },
    {
      id: 'premium',
      name: 'Premium Package',
      poses: ['front-facing', 'three-quarter-left', 'three-quarter-right', 'side-profile-left', 'full-body-front', 'full-body-three-quarter', 'walking-forward', 'standing-casual', 'close-up', 'neutral-expression'],
      credits: 200,
      consistencyRating: 92,
      description: '10 poses for professional productions',
      bestFor: ['Professional films', 'Complex scenes', 'Action sequences'],
      discount: 0
    },
    {
      id: 'cinematic',
      name: 'Cinematic Package',
      poses: ['front-facing', 'three-quarter-left', 'three-quarter-right', 'side-profile-left', 'side-profile-right', 'back-view', 'full-body-front', 'full-body-three-quarter', 'full-body-side', 'walking-forward', 'running', 'sitting', 'standing-confident', 'high-angle', 'low-angle'],
      credits: 300,
      consistencyRating: 96,
      description: '15 poses for high-end productions',
      bestFor: ['High-end films', 'Multiple angles', 'Camera variety'],
      discount: 0
    },
    {
      id: 'master',
      name: 'Master Package',
      poses: ['front-facing', 'three-quarter-left', 'three-quarter-right', 'side-profile-left', 'side-profile-right', 'back-view', 'full-body-front', 'full-body-three-quarter', 'full-body-side', 'walking-forward', 'running', 'sitting', 'standing-casual', 'standing-confident', 'neutral-expression', 'smiling', 'serious', 'determined', 'high-angle', 'low-angle', 'close-up', 'extreme-close-up'],
      credits: 500,
      consistencyRating: 98,
      description: 'Complete 22-pose set for maximum coverage',
      bestFor: ['Feature films', 'Complete coverage', 'Professional studios'],
      discount: 9
    }
  ]);
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-100 mb-2">
          Choose Pose Package for {characterName}
        </h2>
        <p className="text-gray-400">
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
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onClick={() => !disabled && onSelectPackage(pkg.id)}
            >
              {/* Recommended Badge */}
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    RECOMMENDED
                  </div>
                </div>
              )}
              
              {/* Package Icon */}
              <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${PACKAGE_COLORS[pkg.id]} mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              
              {/* Package Name */}
              <h3 className="text-xl font-bold text-gray-100 mb-2">
                {pkg.name}
              </h3>
              
              {/* Credits */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl font-bold text-white">
                  {pkg.credits}
                  <span className="text-sm font-normal text-gray-400 ml-1">credits</span>
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
                  <span className="text-gray-400">Consistency</span>
                  <span className="text-white font-bold">{pkg.consistencyRating}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full bg-gradient-to-r ${PACKAGE_COLORS[pkg.id]}`}
                    style={{ width: `${pkg.consistencyRating}%` }}
                  />
                </div>
              </div>
              
              {/* Description */}
              <p className="text-gray-400 text-sm mb-4">
                {pkg.description}
              </p>
              
              {/* Pose Count */}
              <div className="text-sm text-gray-300 mb-4">
                <strong>{pkg.poses.length} poses</strong> included
              </div>
              
              {/* Best For */}
              <div className="space-y-1 mb-4">
                <div className="text-xs font-semibold text-gray-500 uppercase">Best For:</div>
                {pkg.bestFor.map((use, idx) => (
                  <div key={idx} className="flex items-center text-sm text-gray-400">
                    <Check className="w-3 h-3 text-green-400 mr-2 flex-shrink-0" />
                    {use}
                  </div>
                ))}
              </div>
              
              {/* Select Button */}
              {isSelected && (
                <div className="mt-4 py-2 bg-blue-500 text-white text-center rounded-lg font-semibold">
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
          <div className="text-sm text-gray-300">
            <strong className="text-white">Pro Tip:</strong> Higher tier packages generate more pose variations,
            which dramatically improves character consistency across different camera angles and scenes.
            The AI will automatically select the best reference for each shot.
          </div>
        </div>
      </div>
    </div>
  );
}

