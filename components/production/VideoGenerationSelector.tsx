/**
 * Video Generation Selector Component
 * 
 * Allows users to select video generation type for non-dialogue shots.
 * Options: Cinematic Visuals, Natural Motion
 * Note: Quality (1080p/4K) is set globally in the Review Step, not per-shot.
 */

'use client';

import React from 'react';

interface VideoGenerationSelectorProps {
  shotSlot: number;
  shotType: 'dialogue' | 'action' | 'establishing';
  selectedVideoType: 'cinematic-visuals' | 'natural-motion' | 'premium-quality' | undefined;
  onVideoTypeChange: (shotSlot: number, videoType: 'cinematic-visuals' | 'natural-motion' | 'premium-quality') => void;
  // Camera Angle and Shot Duration (moved from ShotConfigurationPanel)
  shotCameraAngle?: 'close-up' | 'medium-shot' | 'wide-shot' | 'extreme-close-up' | 'extreme-wide-shot' | 'over-the-shoulder' | 'low-angle' | 'high-angle' | 'dutch-angle' | 'auto';
  onCameraAngleChange?: (shotSlot: number, angle: 'close-up' | 'medium-shot' | 'wide-shot' | 'extreme-close-up' | 'extreme-wide-shot' | 'over-the-shoulder' | 'low-angle' | 'high-angle' | 'dutch-angle' | 'auto' | undefined) => void;
  shotDuration?: 'quick-cut' | 'extended-take';
  onDurationChange?: (shotSlot: number, duration: 'quick-cut' | 'extended-take' | undefined) => void;
  isLipSyncWorkflow?: boolean; // If true, hide this component (no per-shot options for lip-sync)
}

export function VideoGenerationSelector({
  shotSlot,
  shotType,
  selectedVideoType,
  onVideoTypeChange,
  shotCameraAngle,
  onCameraAngleChange,
  shotDuration,
  onDurationChange,
  isLipSyncWorkflow = false // If true, hide this component (no per-shot options for lip-sync)
}: VideoGenerationSelectorProps) {
  // For dialogue lip-sync shots, hide this component (quality is set globally in Review Step)
  if (shotType === 'dialogue' && isLipSyncWorkflow) {
    return null;
  }
  
  // For dialogue non-lip-sync shots, show Camera Angle, Shot Duration, and Video Style
  if (shotType === 'dialogue' && !isLipSyncWorkflow) {
    const selectCameraAngle = shotCameraAngle ?? 'auto';
    const selectVideoType = selectedVideoType ?? 'cinematic-visuals';
    const selectDuration = shotDuration ?? 'quick-cut';
    
    const videoTypes = [
      {
        id: 'cinematic-visuals' as const,
        name: 'Cinematic Visuals',
        description: 'Dramatic lighting, high contrast, visual effects, stylized looks',
        bestFor: 'Establishing shots, VFX, fantasy scenes'
      },
      {
        id: 'natural-motion' as const,
        name: 'Natural Motion',
        description: 'Physics-accurate movement, realistic motion, natural actions',
        bestFor: 'Action sequences, character movement, realistic scenes'
      },
      {
        id: 'premium-quality' as const,
        name: 'Premium Quality',
        description: 'Highest quality generation with advanced motion understanding',
        bestFor: 'Premium productions, high-end content, maximum quality'
      }
    ];
    
    return (
      <div className="pt-3 pb-3 border-t border-b border-[#3F3F46]">
        <div className="text-xs font-medium text-[#FFFFFF] mb-2">Video Generation</div>
        <div className="space-y-3">
          {/* Camera Angle */}
          {onCameraAngleChange && (
            <div>
              <label className="text-[10px] text-[#808080] mb-1.5 block">Camera Angle</label>
              <select
                value={selectCameraAngle}
                onChange={(e) => {
                  const angle = e.target.value as 'close-up' | 'medium-shot' | 'wide-shot' | 'extreme-close-up' | 'extreme-wide-shot' | 'over-the-shoulder' | 'low-angle' | 'high-angle' | 'dutch-angle' | 'auto';
                  if (angle === 'auto') {
                    onCameraAngleChange(shotSlot, undefined);
                  } else {
                    onCameraAngleChange(shotSlot, angle);
                  }
                }}
                className="select select-bordered w-full bg-[#0A0A0A] border-[#3F3F46] text-[#FFFFFF] text-xs h-9 focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
              >
                <option value="auto" className="bg-[#1A1A1A] text-[#FFFFFF]">Auto (Content-aware) - Default</option>
                <option value="close-up" className="bg-[#1A1A1A] text-[#FFFFFF]">Close-up</option>
                <option value="medium-shot" className="bg-[#1A1A1A] text-[#FFFFFF]">Medium Shot</option>
                <option value="wide-shot" className="bg-[#1A1A1A] text-[#FFFFFF]">Wide Shot</option>
                <option value="extreme-close-up" className="bg-[#1A1A1A] text-[#FFFFFF]">Extreme Close-up</option>
                <option value="extreme-wide-shot" className="bg-[#1A1A1A] text-[#FFFFFF]">Extreme Wide Shot</option>
                <option value="over-the-shoulder" className="bg-[#1A1A1A] text-[#FFFFFF]">Over-the-Shoulder</option>
                <option value="low-angle" className="bg-[#1A1A1A] text-[#FFFFFF]">Low Angle</option>
                <option value="high-angle" className="bg-[#1A1A1A] text-[#FFFFFF]">High Angle</option>
                <option value="dutch-angle" className="bg-[#1A1A1A] text-[#FFFFFF]">Dutch Angle</option>
              </select>
              {selectCameraAngle !== 'auto' ? (
                <div className="text-[10px] text-[#808080] italic mt-1">
                  Override: Using {selectCameraAngle.replace('-', ' ')} instead of auto-detection
                </div>
              ) : (
                <div className="text-[10px] text-[#808080] italic mt-1">
                  Using auto-detection (content-aware selection)
                </div>
              )}
            </div>
          )}

          {/* Video Style (Video Type) */}
          {onVideoTypeChange && (
            <div>
              <label className="text-[10px] text-[#808080] mb-1.5 block">Video</label>
              <select
                value={selectVideoType}
                onChange={(e) => {
                  onVideoTypeChange(shotSlot, e.target.value as 'cinematic-visuals' | 'natural-motion' | 'premium-quality');
                }}
                className="select select-bordered w-full bg-[#0A0A0A] border-[#3F3F46] text-[#FFFFFF] text-xs h-9 focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
              >
                {videoTypes.map((videoType) => (
                  <option key={videoType.id} value={videoType.id} className="bg-[#1A1A1A] text-[#FFFFFF]">
                    {videoType.name} - {videoType.description} (Best for: {videoType.bestFor})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Shot Duration */}
          {onDurationChange && (
            <div>
              <label className="text-[10px] text-[#808080] mb-1.5 block">Shot Duration</label>
              <select
                value={selectDuration}
                onChange={(e) => {
                  onDurationChange(shotSlot, e.target.value as 'quick-cut' | 'extended-take');
                }}
                className="select select-bordered w-full bg-[#0A0A0A] border-[#3F3F46] text-[#FFFFFF] text-xs h-9 focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
              >
                <option value="quick-cut" className="bg-[#1A1A1A] text-[#FFFFFF]">Quick Cut (~5s) - 4-5 seconds (default)</option>
                <option value="extended-take" className="bg-[#1A1A1A] text-[#FFFFFF]">Extended Take (~10s) - 8-10 seconds</option>
              </select>
              <div className="text-[10px] text-[#808080] italic mt-1">
                {selectDuration === 'quick-cut' 
                  ? 'Quick Cut: 4-5 seconds (default)'
                  : 'Extended Take: 8-10 seconds'}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const videoTypes = [
    {
      id: 'cinematic-visuals' as const,
      name: 'Cinematic Visuals',
      description: 'Dramatic lighting, high contrast, visual effects, stylized looks',
      bestFor: 'Establishing shots, VFX, fantasy scenes'
    },
    {
      id: 'natural-motion' as const,
      name: 'Natural Motion',
      description: 'Physics-accurate movement, realistic motion, natural actions',
      bestFor: 'Action sequences, character movement, realistic scenes'
    },
    {
      id: 'premium-quality' as const,
      name: 'Premium Quality',
      description: 'Highest quality generation with advanced motion understanding',
      bestFor: 'Premium productions, high-end content, maximum quality'
    }
  ];

  const currentVideoType = videoTypes.find(vt => vt.id === selectedVideoType) || videoTypes[0];
  // Ensure all Select values are always strings (never undefined) to prevent React error #185
  const selectCameraAngle = shotCameraAngle ?? 'auto';
  const selectVideoType = selectedVideoType ?? 'cinematic-visuals';
  const selectDuration = shotDuration ?? 'quick-cut';

  return (
    <div className="pt-3 pb-3 border-t border-b border-[#3F3F46]">
      <div className="text-xs font-medium text-[#FFFFFF] mb-2">Video Generation</div>
      <div className="space-y-3">
        {/* Camera Angle */}
        {onCameraAngleChange && (
          <div>
            <label className="text-[10px] text-[#808080] mb-1.5 block">Camera Angle</label>
            <select
              value={selectCameraAngle}
              onChange={(e) => {
                const angle = e.target.value as 'close-up' | 'medium-shot' | 'wide-shot' | 'extreme-close-up' | 'extreme-wide-shot' | 'over-the-shoulder' | 'low-angle' | 'high-angle' | 'dutch-angle' | 'auto';
                if (angle === 'auto') {
                  onCameraAngleChange(shotSlot, undefined);
                } else {
                  onCameraAngleChange(shotSlot, angle);
                }
              }}
              className="select select-bordered w-full bg-[#0A0A0A] border-[#3F3F46] text-[#FFFFFF] text-xs h-9 focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
            >
              <option value="auto" className="bg-[#1A1A1A] text-[#FFFFFF]">Auto (Content-aware) - Default</option>
              <option value="close-up" className="bg-[#1A1A1A] text-[#FFFFFF]">Close-up</option>
              <option value="medium-shot" className="bg-[#1A1A1A] text-[#FFFFFF]">Medium Shot</option>
              <option value="wide-shot" className="bg-[#1A1A1A] text-[#FFFFFF]">Wide Shot</option>
              <option value="extreme-close-up" className="bg-[#1A1A1A] text-[#FFFFFF]">Extreme Close-up</option>
              <option value="extreme-wide-shot" className="bg-[#1A1A1A] text-[#FFFFFF]">Extreme Wide Shot</option>
              <option value="over-the-shoulder" className="bg-[#1A1A1A] text-[#FFFFFF]">Over-the-Shoulder</option>
              <option value="low-angle" className="bg-[#1A1A1A] text-[#FFFFFF]">Low Angle</option>
              <option value="high-angle" className="bg-[#1A1A1A] text-[#FFFFFF]">High Angle</option>
              <option value="dutch-angle" className="bg-[#1A1A1A] text-[#FFFFFF]">Dutch Angle</option>
            </select>
            {selectCameraAngle !== 'auto' ? (
              <div className="text-[10px] text-[#808080] italic mt-1">
                Override: Using {selectCameraAngle.replace('-', ' ')} instead of auto-detection
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
          <select
            value={selectVideoType}
            onChange={(e) => {
              onVideoTypeChange(shotSlot, e.target.value as 'cinematic-visuals' | 'natural-motion' | 'premium-quality');
            }}
            className="select select-bordered w-full bg-[#0A0A0A] border-[#3F3F46] text-[#FFFFFF] text-xs h-9 focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
          >
            {videoTypes.map((videoType) => (
              <option key={videoType.id} value={videoType.id} className="bg-[#1A1A1A] text-[#FFFFFF]">
                {videoType.name} - {videoType.description} (Best for: {videoType.bestFor})
              </option>
            ))}
          </select>
        </div>

        {/* Shot Duration */}
        {onDurationChange && (
          <div>
            <label className="text-[10px] text-[#808080] mb-1.5 block">Shot Duration</label>
            <select
              value={selectDuration}
              onChange={(e) => {
                onDurationChange(shotSlot, e.target.value as 'quick-cut' | 'extended-take');
              }}
              className="select select-bordered w-full bg-[#0A0A0A] border-[#3F3F46] text-[#FFFFFF] text-xs h-9 focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
            >
              <option value="quick-cut" className="bg-[#1A1A1A] text-[#FFFFFF]">Quick Cut (~5s) - 4-5 seconds (default)</option>
              <option value="extended-take" className="bg-[#1A1A1A] text-[#FFFFFF]">Extended Take (~10s) - 8-10 seconds</option>
            </select>
            <div className="text-[10px] text-[#808080] italic mt-1">
              {selectDuration === 'quick-cut' 
                ? 'Quick Cut: 4-5 seconds (default)'
                : 'Extended Take: 8-10 seconds'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

