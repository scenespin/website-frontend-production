'use client';

/**
 * PoseGuidanceSection - Guides users on what poses/angles to upload
 * 
 * Features:
 * - Visual checklist of recommended poses
 * - Context-aware recommendations
 * - Shows what they already have vs. what's recommended
 */

import React, { useMemo } from 'react';
import { Check, Circle, AlertCircle, Info } from 'lucide-react';
import type { CharacterReference } from '../types';

interface PoseGuidanceSectionProps {
  existingReferences?: CharacterReference[];
  outfitName?: string;
}

interface PoseCategory {
  id: string;
  name: string;
  description: string;
  priority: 'essential' | 'recommended' | 'optional';
  poses: string[];
}

const POSE_CATEGORIES: PoseCategory[] = [
  {
    id: 'essential',
    name: 'Essential Poses',
    description: 'These are critical for video generation',
    priority: 'essential',
    poses: [
      'Front view (face visible)',
      'Side profile (left or right)',
      '3/4 angle (three-quarter view)'
    ]
  },
  {
    id: 'recommended',
    name: 'Recommended Poses',
    description: 'Improves video quality and consistency',
    priority: 'recommended',
    poses: [
      'Full body standing',
      'Upper body (chest up)',
      'Different expressions (neutral, happy, serious)'
    ]
  },
  {
    id: 'optional',
    name: 'Optional Poses',
    description: 'Nice to have for specific scenes',
    priority: 'optional',
    poses: [
      'Action poses (walking, sitting)',
      'Different lighting conditions',
      'Close-up details (hands, specific features)'
    ]
  }
];

export function PoseGuidanceSection({
  existingReferences = [],
  outfitName
}: PoseGuidanceSectionProps) {
  // Check what poses they already have (simplified - just count)
  const existingCount = existingReferences.length;

  return (
    <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3 mb-4">
        <Info className="w-5 h-5 text-[#DC143C] flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-white mb-1">Pose Guidance</h4>
          <p className="text-xs text-[#808080]">
            Upload images from different angles and poses for best video generation results.
            {existingCount > 0 && (
              <span className="ml-1">You have {existingCount} existing reference{existingCount !== 1 ? 's' : ''}.</span>
            )}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {POSE_CATEGORIES.map(category => (
          <div key={category.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <h5 className="text-xs font-semibold text-white">
                {category.name}
              </h5>
              {category.priority === 'essential' && (
                <span className="px-1.5 py-0.5 bg-[#DC143C]/20 text-[#DC143C] text-[10px] rounded">
                  Required
                </span>
              )}
            </div>
            <p className="text-xs text-[#6B7280]">{category.description}</p>
            <ul className="space-y-1.5 ml-4">
              {category.poses.map((pose, index) => (
                <li key={index} className="flex items-center gap-2 text-xs text-[#808080]">
                  <Circle className="w-3 h-3 flex-shrink-0" />
                  {pose}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Background Guidance Section */}
      <div className="mt-4 pt-4 border-t border-[#3F3F46]">
        <div className="flex items-start gap-2 mb-2">
          <Info className="w-4 h-4 text-[#DC143C] flex-shrink-0 mt-0.5" />
          <h5 className="text-xs font-semibold text-white">Background Guidance</h5>
        </div>
        <p className="text-xs text-[#808080] mb-2">
          For best results, use images with simple, solid-color backgrounds. This helps the AI focus on the character and improves consistency across different poses and outfits.
        </p>
        
        <div className="space-y-2">
          <div>
            <p className="text-xs font-medium text-white mb-1">✓ What works best:</p>
            <ul className="space-y-1 ml-4">
              <li className="text-xs text-[#808080] flex items-start gap-2">
                <span className="text-[#DC143C] mt-1">•</span>
                <span>Solid color backgrounds (green, white, gray, blue, etc.)</span>
              </li>
              <li className="text-xs text-[#808080] flex items-start gap-2">
                <span className="text-[#DC143C] mt-1">•</span>
                <span>Photography backdrops (fabric or paper backdrops commonly used in portrait photography)</span>
              </li>
              <li className="text-xs text-[#808080] flex items-start gap-2">
                <span className="text-[#DC143C] mt-1">•</span>
                <span>Green screen backgrounds (if you have access to a green screen setup)</span>
              </li>
              <li className="text-xs text-[#808080] flex items-start gap-2">
                <span className="text-[#DC143C] mt-1">•</span>
                <span>Any uniform background that contrasts clearly with the character</span>
              </li>
            </ul>
          </div>
          
          <div>
            <p className="text-xs font-medium text-white mb-1">✗ What to avoid:</p>
            <ul className="space-y-1 ml-4">
              <li className="text-xs text-[#808080] flex items-start gap-2">
                <span className="text-[#DC143C] mt-1">•</span>
                <span>Complex backgrounds with scenery, furniture, or other objects</span>
              </li>
              <li className="text-xs text-[#808080] flex items-start gap-2">
                <span className="text-[#DC143C] mt-1">•</span>
                <span>Busy patterns or cluttered environments</span>
              </li>
              <li className="text-xs text-[#808080] flex items-start gap-2">
                <span className="text-[#DC143C] mt-1">•</span>
                <span>Multiple people or distracting elements in the frame</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-[#1F1F1F]/50 border border-[#3F3F46] rounded p-2 mt-2">
            <p className="text-xs font-medium text-white mb-1">💡 Not sure where to start?</p>
            <p className="text-xs text-[#808080]">
              If you don't have a simple background, consider researching "photography backdrops" or "portrait backdrops" — these are affordable fabric or paper backgrounds designed specifically for clean, professional photos. Many photographers use them to create the clean, isolated look that works best for AI processing.
            </p>
            <p className="text-xs text-[#808080] mt-1.5">
              <strong className="text-white">Pro tip:</strong> Even a plain wall or a large sheet hung behind the subject can work well if it's a solid color and evenly lit.
            </p>
          </div>
        </div>
      </div>

      {outfitName && outfitName !== 'default' && (
        <div className="mt-4 pt-4 border-t border-[#3F3F46]">
          <p className="text-xs text-[#808080]">
            <strong className="text-white">Tip:</strong> Make sure all images show the character in the "{outfitName}" outfit for consistency.
          </p>
        </div>
      )}
    </div>
  );
}

