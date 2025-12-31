/**
 * Video Generation Selector Component
 * 
 * Allows users to select video generation type and quality for non-dialogue shots.
 * Options: Cinematic Visuals (Runway Gen-4), Natural Motion (Luma Ray Flash 2)
 * Quality: HD (1080p), 4K
 */

'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VideoGenerationSelectorProps {
  shotSlot: number;
  shotType: 'dialogue' | 'action' | 'establishing';
  selectedVideoType: 'cinematic-visuals' | 'natural-motion' | undefined;
  selectedQuality: 'hd' | '4k' | undefined;
  onVideoTypeChange: (shotSlot: number, videoType: 'cinematic-visuals' | 'natural-motion') => void;
  onQualityChange: (shotSlot: number, quality: 'hd' | '4k') => void;
}

export function VideoGenerationSelector({
  shotSlot,
  shotType,
  selectedVideoType,
  selectedQuality,
  onVideoTypeChange,
  onQualityChange
}: VideoGenerationSelectorProps) {
  // Only show for non-dialogue shots (dialogue has its own workflow system)
  if (shotType === 'dialogue') {
    return null;
  }

  const videoTypes = [
    {
      id: 'cinematic-visuals' as const,
      name: 'Cinematic Visuals',
      model: 'Runway Gen-4',
      description: 'Dramatic lighting, high contrast, visual effects, stylized looks',
      bestFor: 'Establishing shots, VFX, fantasy scenes'
    },
    {
      id: 'natural-motion' as const,
      name: 'Natural Motion',
      model: 'Luma Ray Flash 2',
      description: 'Physics-accurate movement, realistic motion, natural actions',
      bestFor: 'Action sequences, character movement, realistic scenes'
    }
  ];

  const currentVideoType = videoTypes.find(vt => vt.id === selectedVideoType) || videoTypes[0];

  return (
    <div className="pb-3 border-b border-[#3F3F46]">
      <div className="text-xs font-medium text-[#FFFFFF] mb-2">Video Generation</div>
      <div className="space-y-3">
        {/* Video Type Selection */}
        <div>
          <label className="text-[10px] text-[#808080] mb-1.5 block">Video</label>
          <Select
            value={selectedVideoType || 'cinematic-visuals'}
            onValueChange={(value) => {
              onVideoTypeChange(shotSlot, value as 'cinematic-visuals' | 'natural-motion');
            }}
          >
            <SelectTrigger className="w-full bg-[#0A0A0A] border-[#3F3F46] text-[#FFFFFF] text-xs h-9">
              <SelectValue>
                <span className="text-xs">{currentVideoType.name}</span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#3F3F46]">
              {videoTypes.map((videoType) => (
                <SelectItem
                  key={videoType.id}
                  value={videoType.id}
                  className="text-xs text-[#FFFFFF] hover:bg-[#3F3F46] focus:bg-[#3F3F46]"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{videoType.name}</span>
                    <span className="text-[10px] text-[#808080]">
                      {videoType.description}
                    </span>
                    <span className="text-[10px] text-[#808080] italic">
                      Best for: {videoType.bestFor}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quality Selection */}
        <div>
          <label className="text-[10px] text-[#808080] mb-1.5 block">Quality</label>
          <Select
            value={selectedQuality || '4k'}
            onValueChange={(value) => {
              onQualityChange(shotSlot, value as 'hd' | '4k');
            }}
          >
            <SelectTrigger className="w-full bg-[#0A0A0A] border-[#3F3F46] text-[#FFFFFF] text-xs h-9">
              <SelectValue>
                <span className="text-xs">{selectedQuality === 'hd' ? 'HD' : '4K'}</span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#3F3F46]">
              <SelectItem
                value="4k"
                className="text-xs text-[#FFFFFF] hover:bg-[#3F3F46] focus:bg-[#3F3F46]"
              >
                <div className="flex flex-col">
                  <span className="font-medium">4K</span>
                  <span className="text-[10px] text-[#808080]">Highest quality</span>
                </div>
              </SelectItem>
              <SelectItem
                value="hd"
                className="text-xs text-[#FFFFFF] hover:bg-[#3F3F46] focus:bg-[#3F3F46]"
              >
                <div className="flex flex-col">
                  <span className="font-medium">HD</span>
                  <span className="text-[10px] text-[#808080]">1080p, standard</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

