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
  // Camera Angle and Shot Duration (moved from ShotConfigurationPanel)
  shotCameraAngle?: 'close-up' | 'medium-shot' | 'wide-shot' | 'extreme-close-up' | 'extreme-wide-shot' | 'over-the-shoulder' | 'low-angle' | 'high-angle' | 'dutch-angle' | 'auto';
  onCameraAngleChange?: (shotSlot: number, angle: 'close-up' | 'medium-shot' | 'wide-shot' | 'extreme-close-up' | 'extreme-wide-shot' | 'over-the-shoulder' | 'low-angle' | 'high-angle' | 'dutch-angle' | 'auto' | undefined) => void;
  shotDuration?: 'quick-cut' | 'extended-take';
  onDurationChange?: (shotSlot: number, duration: 'quick-cut' | 'extended-take' | undefined) => void;
}

export function VideoGenerationSelector({
  shotSlot,
  shotType,
  selectedVideoType,
  selectedQuality,
  onVideoTypeChange,
  onQualityChange,
  shotCameraAngle,
  onCameraAngleChange,
  shotDuration,
  onDurationChange
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
    <div className="pt-3 pb-3 border-t border-b border-[#3F3F46]">
      <div className="text-xs font-medium text-[#FFFFFF] mb-2">Video Generation</div>
      <div className="space-y-3">
        {/* Camera Angle */}
        {onCameraAngleChange && (
          <div>
            <label className="text-[10px] text-[#808080] mb-1.5 block">Camera Angle</label>
            <Select
              value={shotCameraAngle || 'auto'}
              onValueChange={(value) => {
                const angle = value as 'close-up' | 'medium-shot' | 'wide-shot' | 'extreme-close-up' | 'extreme-wide-shot' | 'over-the-shoulder' | 'low-angle' | 'high-angle' | 'dutch-angle' | 'auto';
                if (angle === 'auto') {
                  onCameraAngleChange(shotSlot, undefined);
                } else {
                  onCameraAngleChange(shotSlot, angle);
                }
              }}
            >
              <SelectTrigger className="w-full bg-[#0A0A0A] border-[#3F3F46] text-[#FFFFFF] text-xs h-9">
                <SelectValue>
                  <span className="text-xs">
                    {shotCameraAngle && shotCameraAngle !== 'auto' 
                      ? shotCameraAngle.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                      : 'Auto (Content-aware) - Default'}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-[#3F3F46]">
                <SelectItem value="auto" className="text-xs text-[#FFFFFF] hover:bg-[#3F3F46] focus:bg-[#3F3F46]">
                  Auto (Content-aware) - Default
                </SelectItem>
                <SelectItem value="close-up" className="text-xs text-[#FFFFFF] hover:bg-[#3F3F46] focus:bg-[#3F3F46]">
                  Close-up
                </SelectItem>
                <SelectItem value="medium-shot" className="text-xs text-[#FFFFFF] hover:bg-[#3F3F46] focus:bg-[#3F3F46]">
                  Medium Shot
                </SelectItem>
                <SelectItem value="wide-shot" className="text-xs text-[#FFFFFF] hover:bg-[#3F3F46] focus:bg-[#3F3F46]">
                  Wide Shot
                </SelectItem>
                <SelectItem value="extreme-close-up" className="text-xs text-[#FFFFFF] hover:bg-[#3F3F46] focus:bg-[#3F3F46]">
                  Extreme Close-up
                </SelectItem>
                <SelectItem value="extreme-wide-shot" className="text-xs text-[#FFFFFF] hover:bg-[#3F3F46] focus:bg-[#3F3F46]">
                  Extreme Wide Shot
                </SelectItem>
                <SelectItem value="over-the-shoulder" className="text-xs text-[#FFFFFF] hover:bg-[#3F3F46] focus:bg-[#3F3F46]">
                  Over-the-Shoulder
                </SelectItem>
                <SelectItem value="low-angle" className="text-xs text-[#FFFFFF] hover:bg-[#3F3F46] focus:bg-[#3F3F46]">
                  Low Angle
                </SelectItem>
                <SelectItem value="high-angle" className="text-xs text-[#FFFFFF] hover:bg-[#3F3F46] focus:bg-[#3F3F46]">
                  High Angle
                </SelectItem>
                <SelectItem value="dutch-angle" className="text-xs text-[#FFFFFF] hover:bg-[#3F3F46] focus:bg-[#3F3F46]">
                  Dutch Angle
                </SelectItem>
              </SelectContent>
            </Select>
            {shotCameraAngle && shotCameraAngle !== 'auto' ? (
              <div className="text-[10px] text-[#808080] italic mt-1">
                Override: Using {shotCameraAngle.replace('-', ' ')} instead of auto-detection
              </div>
            ) : (
              <div className="text-[10px] text-[#808080] italic mt-1">
                Using auto-detection (content-aware selection)
              </div>
            )}
          </div>
        )}

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

        {/* Shot Duration */}
        {onDurationChange && (
          <div>
            <label className="text-[10px] text-[#808080] mb-1.5 block">Shot Duration</label>
            <Select
              value={shotDuration || 'quick-cut'}
              onValueChange={(value) => {
                onDurationChange(shotSlot, value as 'quick-cut' | 'extended-take');
              }}
            >
              <SelectTrigger className="w-full bg-[#0A0A0A] border-[#3F3F46] text-[#FFFFFF] text-xs h-9">
                <SelectValue>
                  <span className="text-xs">
                    {shotDuration === 'extended-take' ? 'Extended Take (~10s)' : 'Quick Cut (~5s)'}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-[#3F3F46]">
                <SelectItem value="quick-cut" className="text-xs text-[#FFFFFF] hover:bg-[#3F3F46] focus:bg-[#3F3F46]">
                  <div className="flex flex-col">
                    <span className="font-medium">Quick Cut (~5s)</span>
                    <span className="text-[10px] text-[#808080]">4-5 seconds (default)</span>
                  </div>
                </SelectItem>
                <SelectItem value="extended-take" className="text-xs text-[#FFFFFF] hover:bg-[#3F3F46] focus:bg-[#3F3F46]">
                  <div className="flex flex-col">
                    <span className="font-medium">Extended Take (~10s)</span>
                    <span className="text-[10px] text-[#808080]">8-10 seconds</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="text-[10px] text-[#808080] italic mt-1">
              {shotDuration === 'quick-cut' 
                ? 'Quick Cut: 4-5 seconds (default)'
                : 'Extended Take: 8-10 seconds'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

