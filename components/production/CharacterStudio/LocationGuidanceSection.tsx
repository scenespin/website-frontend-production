'use client';

/**
 * LocationGuidanceSection - Guides users on what views/angles to upload for locations
 * 
 * Feature 0192: Location/Asset Upload Tab
 * 
 * Features:
 * - Visual checklist of recommended views
 * - Context-aware recommendations
 * - Shows what they already have vs. what's recommended
 */

import React from 'react';
import { Circle, Info } from 'lucide-react';

interface LocationGuidanceSectionProps {
  existingCount?: number;
  viewName?: string;
}

interface ViewCategory {
  id: string;
  name: string;
  description: string;
  priority: 'essential' | 'recommended' | 'optional';
  views: string[];
}

const VIEW_CATEGORIES: ViewCategory[] = [
  {
    id: 'essential',
    name: 'Essential Views',
    description: 'These are critical for scene generation',
    priority: 'essential',
    views: [
      'Wide establishing shot (shows full location)',
      'Medium shot (main action area)',
      'Key focal point (where scenes will take place)'
    ]
  },
  {
    id: 'recommended',
    name: 'Recommended Views',
    description: 'Improves scene quality and consistency',
    priority: 'recommended',
    views: [
      'Different angles (left, right, center)',
      'Entrance/exit points',
      'Detail shots (textures, props, signage)'
    ]
  },
  {
    id: 'optional',
    name: 'Optional Views',
    description: 'Nice to have for specific scenes',
    priority: 'optional',
    views: [
      'Different times of day (morning, afternoon, evening, night)',
      'Different weather/lighting conditions',
      'Aerial or high-angle views'
    ]
  }
];

export function LocationGuidanceSection({
  existingCount = 0,
  viewName
}: LocationGuidanceSectionProps) {
  return (
    <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3 mb-4">
        <Info className="w-5 h-5 text-[#DC143C] flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-white mb-1">Location Guidance</h4>
          <p className="text-xs text-[#808080]">
            Upload images from different angles and views for best scene generation results.
            {existingCount > 0 && (
              <span className="ml-1">You have {existingCount} existing reference{existingCount !== 1 ? 's' : ''}.</span>
            )}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {VIEW_CATEGORIES.map(category => (
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
              {category.views.map((view, index) => (
                <li key={index} className="flex items-center gap-2 text-xs text-[#808080]">
                  <Circle className="w-3 h-3 flex-shrink-0" />
                  {view}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Image Quality Tips */}
      <div className="mt-4 pt-4 border-t border-[#3F3F46]">
        <div className="flex items-start gap-2 mb-2">
          <Info className="w-4 h-4 text-[#DC143C] flex-shrink-0 mt-0.5" />
          <h5 className="text-xs font-semibold text-white">Image Quality Tips</h5>
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-xs font-medium text-white mb-1">✓ What works best:</p>
            <ul className="space-y-1 ml-4">
              <li className="text-xs text-[#808080] flex items-start gap-2">
                <span className="text-[#DC143C] mt-1">•</span>
                <span>High-resolution images with good lighting</span>
              </li>
              <li className="text-xs text-[#808080] flex items-start gap-2">
                <span className="text-[#DC143C] mt-1">•</span>
                <span>Consistent style and time of day across images</span>
              </li>
              <li className="text-xs text-[#808080] flex items-start gap-2">
                <span className="text-[#DC143C] mt-1">•</span>
                <span>Empty locations (no people in frame)</span>
              </li>
              <li className="text-xs text-[#808080] flex items-start gap-2">
                <span className="text-[#DC143C] mt-1">•</span>
                <span>Stable camera shots (avoid motion blur)</span>
              </li>
            </ul>
          </div>
          
          <div>
            <p className="text-xs font-medium text-white mb-1">✗ What to avoid:</p>
            <ul className="space-y-1 ml-4">
              <li className="text-xs text-[#808080] flex items-start gap-2">
                <span className="text-[#DC143C] mt-1">•</span>
                <span>Low-resolution or blurry images</span>
              </li>
              <li className="text-xs text-[#808080] flex items-start gap-2">
                <span className="text-[#DC143C] mt-1">•</span>
                <span>Images with people, animals, or moving objects</span>
              </li>
              <li className="text-xs text-[#808080] flex items-start gap-2">
                <span className="text-[#DC143C] mt-1">•</span>
                <span>Heavily edited or filtered photos</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {viewName && viewName !== 'default' && (
        <div className="mt-4 pt-4 border-t border-[#3F3F46]">
          <p className="text-xs text-[#808080]">
            <strong className="text-white">Tip:</strong> Make sure all images in "{viewName}" are from the same perspective for consistency.
          </p>
        </div>
      )}
    </div>
  );
}
