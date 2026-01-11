'use client';

/**
 * AssetGuidanceSection - Guides users on what angles to upload for props/assets
 * 
 * Feature 0192: Location/Asset Upload Tab
 * 
 * Features:
 * - Visual checklist of recommended angles
 * - Context-aware recommendations
 * - Shows what they already have vs. what's recommended
 */

import React from 'react';
import { Circle, Info } from 'lucide-react';

interface AssetGuidanceSectionProps {
  existingCount?: number;
  angleName?: string;
}

interface AngleCategory {
  id: string;
  name: string;
  description: string;
  priority: 'essential' | 'recommended' | 'optional';
  angles: string[];
}

const ANGLE_CATEGORIES: AngleCategory[] = [
  {
    id: 'essential',
    name: 'Essential Angles',
    description: 'These are critical for prop consistency',
    priority: 'essential',
    angles: [
      'Front view (main identifying angle)',
      'Side view (left or right profile)',
      '3/4 angle (three-quarter perspective)'
    ]
  },
  {
    id: 'recommended',
    name: 'Recommended Angles',
    description: 'Improves prop quality and consistency',
    priority: 'recommended',
    angles: [
      'Top-down view',
      'Detail/close-up shots',
      'Back view (if relevant)'
    ]
  },
  {
    id: 'optional',
    name: 'Optional Angles',
    description: 'Nice to have for specific scenes',
    priority: 'optional',
    angles: [
      '"In use" context shot (prop being used)',
      'Different lighting conditions',
      'Scale reference (with hand or common object)'
    ]
  }
];

export function AssetGuidanceSection({
  existingCount = 0,
  angleName
}: AssetGuidanceSectionProps) {
  return (
    <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3 mb-4">
        <Info className="w-5 h-5 text-[#DC143C] flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-white mb-1">Prop/Asset Guidance</h4>
          <p className="text-xs text-[#808080]">
            Upload images from different angles for best prop consistency in scenes.
            {existingCount > 0 && (
              <span className="ml-1">You have {existingCount} existing image{existingCount !== 1 ? 's' : ''}.</span>
            )}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {ANGLE_CATEGORIES.map(category => (
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
              {category.angles.map((angle, index) => (
                <li key={index} className="flex items-center gap-2 text-xs text-[#808080]">
                  <Circle className="w-3 h-3 flex-shrink-0" />
                  {angle}
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
          For best results, use images with simple, solid-color backgrounds. This helps the AI focus on the prop and improves consistency.
        </p>
        
        <div className="space-y-2">
          <div>
            <p className="text-xs font-medium text-white mb-1">✓ What works best:</p>
            <ul className="space-y-1 ml-4">
              <li className="text-xs text-[#808080] flex items-start gap-2">
                <span className="text-[#DC143C] mt-1">•</span>
                <span>Solid color backgrounds (white, gray, black, etc.)</span>
              </li>
              <li className="text-xs text-[#808080] flex items-start gap-2">
                <span className="text-[#DC143C] mt-1">•</span>
                <span>Product photography style (clean, well-lit)</span>
              </li>
              <li className="text-xs text-[#808080] flex items-start gap-2">
                <span className="text-[#DC143C] mt-1">•</span>
                <span>Good lighting without harsh shadows</span>
              </li>
            </ul>
          </div>
          
          <div>
            <p className="text-xs font-medium text-white mb-1">✗ What to avoid:</p>
            <ul className="space-y-1 ml-4">
              <li className="text-xs text-[#808080] flex items-start gap-2">
                <span className="text-[#DC143C] mt-1">•</span>
                <span>Cluttered backgrounds with other objects</span>
              </li>
              <li className="text-xs text-[#808080] flex items-start gap-2">
                <span className="text-[#DC143C] mt-1">•</span>
                <span>Images where the prop is partially hidden</span>
              </li>
              <li className="text-xs text-[#808080] flex items-start gap-2">
                <span className="text-[#DC143C] mt-1">•</span>
                <span>Blurry or low-resolution images</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {angleName && angleName !== 'default' && (
        <div className="mt-4 pt-4 border-t border-[#3F3F46]">
          <p className="text-xs text-[#808080]">
            <strong className="text-white">Tip:</strong> Make sure all images in "{angleName}" are from the same angle for consistency.
          </p>
        </div>
      )}
    </div>
  );
}
