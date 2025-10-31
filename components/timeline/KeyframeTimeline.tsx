/**
 * Keyframe Timeline Component
 * 
 * Visual timeline showing keyframes for the selected asset
 * Displays property animation curves and allows keyframe manipulation
 */

'use client';

import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Move,
  Maximize,
  RotateCw,
  Eye,
  Volume2,
  Sparkles,
  Plus,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { TimelineAsset, TimelineKeyframe } from '@/hooks/useTimeline';

interface KeyframeTimelineProps {
  asset: TimelineAsset | null;
  currentTime: number;
  zoomLevel: number;
  onSeek: (time: number) => void;
  onAddKeyframe: (assetId: string, keyframe: Omit<TimelineKeyframe, 'id'>) => void;
  onUpdateKeyframe: (assetId: string, index: number, updates: Partial<TimelineKeyframe>) => void;
  onRemoveKeyframe: (assetId: string, index: number) => void;
}

type PropertyKey = 'x' | 'y' | 'scale' | 'rotation' | 'opacity' | 'blur' | 'volume';

interface PropertyTrack {
  key: PropertyKey;
  label: string;
  icon: React.ReactNode;
  color: string;
  min: number;
  max: number;
}

const PROPERTY_TRACKS: PropertyTrack[] = [
  { key: 'x', label: 'Position X', icon: <Move className="w-3 h-3" />, color: 'red', min: -1000, max: 2000 },
  { key: 'y', label: 'Position Y', icon: <Move className="w-3 h-3" />, color: 'green', min: -1000, max: 2000 },
  { key: 'scale', label: 'Scale', icon: <Maximize className="w-3 h-3" />, color: 'blue', min: 0.1, max: 5 },
  { key: 'rotation', label: 'Rotation', icon: <RotateCw className="w-3 h-3" />, color: 'purple', min: -360, max: 360 },
  { key: 'opacity', label: 'Opacity', icon: <Eye className="w-3 h-3" />, color: 'yellow', min: 0, max: 1 },
  { key: 'volume', label: 'Volume', icon: <Volume2 className="w-3 h-3" />, color: 'green', min: 0, max: 2 },
];

export function KeyframeTimeline({
  asset,
  currentTime,
  zoomLevel,
  onSeek,
  onAddKeyframe,
  onUpdateKeyframe,
  onRemoveKeyframe
}: KeyframeTimelineProps) {
  const [expandedProps, setExpandedProps] = useState<Set<PropertyKey>>(new Set(['x', 'y', 'scale', 'opacity']));
  const [selectedKeyframe, setSelectedKeyframe] = useState<{ propKey: PropertyKey; index: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  if (!asset) {
    return (
      <Card className="h-48 border-t flex items-center justify-center">
        <div className="text-center p-4">
          <Sparkles className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Select an asset to view keyframes
          </p>
        </div>
      </Card>
    );
  }

  const timelineWidth = asset.duration * zoomLevel;
  const trackHeight = 40;

  // Get keyframes for a specific property
  const getKeyframesForProperty = (propKey: PropertyKey): TimelineKeyframe[] => {
    return asset.keyframes?.filter(kf => kf[propKey] !== undefined) || [];
  };

  // Toggle property expansion
  const toggleProperty = (propKey: PropertyKey) => {
    setExpandedProps(prev => {
      const next = new Set(prev);
      if (next.has(propKey)) {
        next.delete(propKey);
      } else {
        next.add(propKey);
      }
      return next;
    });
  };

  // Handle canvas click to seek
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / zoomLevel) + asset.startTime;
    onSeek(Math.max(asset.startTime, Math.min(asset.startTime + asset.duration, time)));
  };

  // Get color for property
  const getPropertyColor = (propKey: PropertyKey): string => {
    const track = PROPERTY_TRACKS.find(t => t.key === propKey);
    return track?.color || 'gray';
  };

  // Normalize value for visual display (0-1)
  const normalizeValue = (value: number, min: number, max: number): number => {
    return (value - min) / (max - min);
  };

  // Filter properties that apply to this asset type
  const relevantProperties = PROPERTY_TRACKS.filter(track => {
    if (asset.type === 'audio' || asset.type === 'music') {
      return track.key === 'volume';
    }
    return track.key !== 'volume';
  });

  // Calculate playhead position relative to asset
  const relativePlayheadPos = (currentTime - asset.startTime) * zoomLevel;
  const isPlayheadInAsset = currentTime >= asset.startTime && currentTime <= (asset.startTime + asset.duration);

  return (
    <Card className="border-t flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-2 border-b bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Keyframe Timeline
          </h3>
          <Badge variant="outline" className="text-xs">
            {asset.keyframes?.length || 0} keyframes
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="flex">
          {/* Property Labels */}
          <div className="flex-shrink-0 w-32 bg-white dark:bg-slate-800 border-r">
            {relevantProperties.map(track => {
              const keyframes = getKeyframesForProperty(track.key);
              const isExpanded = expandedProps.has(track.key);
              
              return (
                <div
                  key={track.key}
                  className={`border-b ${isExpanded ? `h-[${trackHeight * 2}px]` : 'h-10'}`}
                >
                  <button
                    onClick={() => toggleProperty(track.key)}
                    className="w-full h-10 px-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      )}
                      <div className={`w-2 h-2 rounded-full bg-${track.color}-500`} />
                      {track.icon}
                      <span className="text-xs font-medium">{track.label}</span>
                    </div>
                    {keyframes.length > 0 && (
                      <Badge variant="secondary" className="text-xs h-4 px-1">
                        {keyframes.length}
                      </Badge>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Keyframe Canvas */}
          <div
            ref={canvasRef}
            className="flex-1 relative cursor-crosshair"
            style={{ width: `${timelineWidth}px` }}
            onClick={handleCanvasClick}
          >
            {/* Time Ruler */}
            <div className="h-10 border-b bg-slate-100 dark:bg-slate-800 relative">
              {Array.from({ length: Math.ceil(asset.duration) + 1 }, (_, i) => i).map(i => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 flex flex-col items-center"
                  style={{ left: `${i * zoomLevel}px` }}
                >
                  <div className="h-2 w-px bg-slate-400 dark:bg-slate-600" />
                  <span className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {i}s
                  </span>
                </div>
              ))}
              
              {/* Playhead in ruler */}
              {isPlayheadInAsset && (
                <div
                  className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
                  style={{ left: `${relativePlayheadPos}px` }}
                >
                  <div className="absolute top-0 -left-1 w-2 h-2 bg-red-500 rounded-full" />
                </div>
              )}
            </div>

            {/* Property Tracks */}
            {relevantProperties.map(track => {
              const keyframes = getKeyframesForProperty(track.key);
              const isExpanded = expandedProps.has(track.key);

              return (
                <div
                  key={track.key}
                  className={`border-b relative ${isExpanded ? `h-[${trackHeight * 2}px]` : 'h-10'}`}
                  style={{ height: isExpanded ? `${trackHeight * 2}px` : '40px' }}
                >
                  {/* Curve visualization (if expanded) */}
                  {isExpanded && keyframes.length > 0 && (
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{ width: `${timelineWidth}px` }}
                    >
                      <polyline
                        points={keyframes.map(kf => {
                          const x = kf.time * zoomLevel;
                          const normalized = normalizeValue(kf[track.key] as number, track.min, track.max);
                          const y = (trackHeight * 2) * (1 - normalized);
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke={`var(--${track.color}-500)`}
                        strokeWidth="2"
                        className={`stroke-${track.color}-500`}
                      />
                    </svg>
                  )}

                  {/* Keyframe diamonds */}
                  {keyframes.map((kf, index) => {
                    const x = kf.time * zoomLevel;
                    const isSelected = selectedKeyframe?.propKey === track.key && selectedKeyframe?.index === index;

                    return (
                      <button
                        key={index}
                        className={`absolute w-3 h-3 transform rotate-45 -translate-x-1.5 -translate-y-1.5 transition-all ${
                          isSelected
                            ? `bg-${track.color}-600 scale-125 shadow-lg ring-2 ring-${track.color}-400`
                            : `bg-${track.color}-500 hover:scale-110`
                        }`}
                        style={{
                          left: `${x}px`,
                          top: isExpanded ? `${trackHeight}px` : '20px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedKeyframe({ propKey: track.key, index });
                        }}
                        title={`${track.label}: ${kf[track.key]}`}
                      />
                    );
                  })}
                </div>
              );
            })}

            {/* Playhead line */}
            {isPlayheadInAsset && (
              <div
                className="absolute top-0 bottom-0 w-px bg-red-500 pointer-events-none z-20"
                style={{ left: `${relativePlayheadPos}px` }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex-shrink-0 p-2 border-t bg-white dark:bg-slate-800 flex items-center justify-between">
        <div className="text-xs text-slate-600 dark:text-slate-400">
          {selectedKeyframe ? (
            <span>Keyframe selected at {asset.keyframes?.[selectedKeyframe.index]?.time.toFixed(2)}s</span>
          ) : (
            <span>Click timeline to seek, click keyframe to select</span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => {
            // Add keyframe at current time for all expanded properties
            const relativeTime = currentTime - asset.startTime;
            if (relativeTime >= 0 && relativeTime <= asset.duration) {
              expandedProps.forEach(propKey => {
                onAddKeyframe(asset.id, {
                  time: relativeTime,
                  [propKey]: 0, // Default value
                  easing: 'linear'
                });
              });
            }
          }}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Keyframe
        </Button>
      </div>
    </Card>
  );
}

