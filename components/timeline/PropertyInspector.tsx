/**
 * Property Inspector Panel
 * 
 * Inspector panel for selected asset properties with keyframe controls
 * Allows editing transform, opacity, audio properties, and keyframes
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Film,
  Music,
  Image as ImageIcon,
  Move,
  Maximize,
  RotateCw,
  Eye,
  Volume2,
  Clock,
  Plus,
  Trash2,
  Copy,
  Sparkles
} from 'lucide-react';
import { TimelineAsset, TimelineKeyframe } from '@/hooks/useTimeline';

// Inline Slider component (since @/components/ui/slider doesn't exist)
interface SliderProps {
  value: number[];
  onValueChange: (values: number[]) => void;
  min: number;
  max: number;
  step: number;
  className?: string;
}

function Slider({ value, onValueChange, min, max, step, className }: SliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0]}
      onChange={(e) => onValueChange([parseFloat(e.target.value)])}
      className={`w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 ${className || ''}`}
    />
  );
}

interface PropertyInspectorProps {
  asset: TimelineAsset | null;
  currentTime: number; // Playhead position
  frameRate: number;
  onUpdateAsset: (assetId: string, updates: Partial<TimelineAsset>) => void;
  onAddKeyframe: (assetId: string, keyframe: Omit<TimelineKeyframe, 'id'>) => void;
  onUpdateKeyframe: (assetId: string, index: number, updates: Partial<TimelineKeyframe>) => void;
  onRemoveKeyframe: (assetId: string, index: number) => void;
  onClose: () => void;
}

export function PropertyInspector({
  asset,
  currentTime,
  frameRate,
  onUpdateAsset,
  onAddKeyframe,
  onUpdateKeyframe,
  onRemoveKeyframe,
  onClose
}: PropertyInspectorProps) {
  const [activeSection, setActiveSection] = useState<'transform' | 'opacity' | 'audio'>('transform');

  if (!asset) {
    return (
      <Card className="w-80 h-full border-l">
        <CardContent className="flex items-center justify-center h-full text-center p-8">
          <div>
            <Sparkles className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Select an asset to edit properties and keyframes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isVideo = asset.type === 'video';
  const isImage = asset.type === 'image';
  const isAudio = asset.type === 'audio' || asset.type === 'music';

  // Get asset icon
  const getAssetIcon = () => {
    switch (asset.type) {
      case 'video':
        return <Film className="w-5 h-5" />;
      case 'audio':
      case 'music':
        return <Music className="w-5 h-5" />;
      case 'image':
        return <ImageIcon className="w-5 h-5" />;
      default:
        return <Film className="w-5 h-5" />;
    }
  };

  // Check if property has keyframe at current time
  const hasKeyframeAt = (property: keyof TimelineKeyframe, time: number): boolean => {
    return asset.keyframes?.some(kf => 
      kf[property] !== undefined && Math.abs(kf.time - time) < 0.01
    ) || false;
  };

  // Get current value (interpolated or base)
  const getCurrentValue = (property: keyof TimelineKeyframe): number => {
    // For now, just return base value or first keyframe
    // TODO: Implement interpolation
    const keyframe = asset.keyframes?.find(kf => kf[property] !== undefined);
    return keyframe?.[property] as number || 0;
  };

  // Add keyframe at current time
  const addKeyframeAtCurrentTime = (property: keyof TimelineKeyframe, value: number) => {
    const relativeTime = currentTime - asset.startTime;
    if (relativeTime < 0 || relativeTime > asset.duration) {
      return; // Playhead outside asset range
    }

    onAddKeyframe(asset.id, {
      time: relativeTime,
      [property]: value,
      easing: 'ease-in-out'
    });
  };

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, '0')}`;
  };

  return (
    <Card className="w-80 h-full border-l flex flex-col">
      {/* Header */}
      <CardHeader className="border-b flex-shrink-0 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {getAssetIcon()}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-bold truncate">
                {asset.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {asset.type}
                </Badge>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {asset.duration.toFixed(2)}s
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Current Time Indicator */}
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">Playhead:</span>
            <span className="font-mono font-bold">
              {formatTime(currentTime)}
              <span className="ml-2 text-slate-500">
                F{Math.round(currentTime * frameRate)}
              </span>
            </span>
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="flex-1 overflow-y-auto p-0">
        {/* Section Tabs */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b">
          <div className="flex">
            {(isVideo || isImage) && (
              <button
                className={`flex-1 py-3 px-4 text-xs font-medium transition-colors ${
                  activeSection === 'transform'
                    ? 'bg-[#DC143C]/10 text-[#DC143C] border-b-2 border-[#DC143C]'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                onClick={() => setActiveSection('transform')}
              >
                <Move className="w-4 h-4 mx-auto mb-1" />
                Transform
              </button>
            )}
            {(isVideo || isImage) && (
              <button
                className={`flex-1 py-3 px-4 text-xs font-medium transition-colors ${
                  activeSection === 'opacity'
                    ? 'bg-[#DC143C]/10 text-[#DC143C] border-b-2 border-[#DC143C]'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                onClick={() => setActiveSection('opacity')}
              >
                <Eye className="w-4 h-4 mx-auto mb-1" />
                Opacity
              </button>
            )}
            {isAudio && (
              <button
                className={`flex-1 py-3 px-4 text-xs font-medium transition-colors ${
                  activeSection === 'audio'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-b-2 border-green-500'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                onClick={() => setActiveSection('audio')}
              >
                <Volume2 className="w-4 h-4 mx-auto mb-1" />
                Audio
              </button>
            )}
          </div>
        </div>

        {/* Property Controls */}
        <div className="p-4 space-y-6">
          {/* Transform Properties */}
          {activeSection === 'transform' && (isVideo || isImage) && (
            <>
              {/* Position X */}
              <PropertyControl
                label="Position X"
                icon={<Move className="w-4 h-4" />}
                value={getCurrentValue('x')}
                min={-1000}
                max={2000}
                step={1}
                hasKeyframe={hasKeyframeAt('x', currentTime - asset.startTime)}
                onValueChange={(val) => {
                  // TODO: Update property or keyframe
                }}
                onAddKeyframe={() => addKeyframeAtCurrentTime('x', getCurrentValue('x'))}
              />

              {/* Position Y */}
              <PropertyControl
                label="Position Y"
                icon={<Move className="w-4 h-4" />}
                value={getCurrentValue('y')}
                min={-1000}
                max={2000}
                step={1}
                hasKeyframe={hasKeyframeAt('y', currentTime - asset.startTime)}
                onValueChange={(val) => {
                  // TODO: Update property or keyframe
                }}
                onAddKeyframe={() => addKeyframeAtCurrentTime('y', getCurrentValue('y'))}
              />

              {/* Scale */}
              <PropertyControl
                label="Scale"
                icon={<Maximize className="w-4 h-4" />}
                value={getCurrentValue('scale') || 1}
                min={0.1}
                max={5}
                step={0.1}
                hasKeyframe={hasKeyframeAt('scale', currentTime - asset.startTime)}
                onValueChange={(val) => {
                  // TODO: Update property or keyframe
                }}
                onAddKeyframe={() => addKeyframeAtCurrentTime('scale', getCurrentValue('scale') || 1)}
              />

              {/* Rotation */}
              <PropertyControl
                label="Rotation"
                icon={<RotateCw className="w-4 h-4" />}
                value={getCurrentValue('rotation')}
                min={-360}
                max={360}
                step={1}
                unit="°"
                hasKeyframe={hasKeyframeAt('rotation', currentTime - asset.startTime)}
                onValueChange={(val) => {
                  // TODO: Update property or keyframe
                }}
                onAddKeyframe={() => addKeyframeAtCurrentTime('rotation', getCurrentValue('rotation'))}
              />
            </>
          )}

          {/* Opacity */}
          {activeSection === 'opacity' && (isVideo || isImage) && (
            <PropertyControl
              label="Opacity"
              icon={<Eye className="w-4 h-4" />}
              value={getCurrentValue('opacity') || 1}
              min={0}
              max={1}
              step={0.01}
              unit="%"
              formatValue={(val) => Math.round(val * 100)}
              hasKeyframe={hasKeyframeAt('opacity', currentTime - asset.startTime)}
              onValueChange={(val) => {
                // TODO: Update property or keyframe
              }}
              onAddKeyframe={() => addKeyframeAtCurrentTime('opacity', getCurrentValue('opacity') || 1)}
            />
          )}

          {/* Audio Properties */}
          {activeSection === 'audio' && isAudio && (
            <>
              {/* Volume */}
              <PropertyControl
                label="Volume"
                icon={<Volume2 className="w-4 h-4" />}
                value={asset.volume}
                min={0}
                max={2}
                step={0.1}
                unit="%"
                formatValue={(val) => Math.round(val * 100)}
                hasKeyframe={hasKeyframeAt('volume', currentTime - asset.startTime)}
                onValueChange={(val) => {
                  onUpdateAsset(asset.id, { volume: val });
                }}
                onAddKeyframe={() => addKeyframeAtCurrentTime('volume', asset.volume)}
              />

              {/* Fade In */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Fade In Duration
                </label>
                <Slider
                  value={[asset.fadeIn || 0]}
                  onValueChange={(values: number[]) => onUpdateAsset(asset.id, { fadeIn: values[0] })}
                  min={0}
                  max={asset.duration / 2}
                  step={0.1}
                  className="flex-1"
                />
                <div className="text-xs text-slate-600 dark:text-slate-400 text-right">
                  {(asset.fadeIn || 0).toFixed(2)}s
                </div>
              </div>

              {/* Fade Out */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Fade Out Duration
                </label>
                <Slider
                  value={[asset.fadeOut || 0]}
                  onValueChange={(values: number[]) => onUpdateAsset(asset.id, { fadeOut: values[0] })}
                  min={0}
                  max={asset.duration / 2}
                  step={0.1}
                  className="flex-1"
                />
                <div className="text-xs text-slate-600 dark:text-slate-400 text-right">
                  {(asset.fadeOut || 0).toFixed(2)}s
                </div>
              </div>
            </>
          )}
        </div>

        {/* Keyframes List */}
        {asset.keyframes && asset.keyframes.length > 0 && (
          <div className="border-t p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Keyframes ({asset.keyframes.length})
              </h4>
            </div>
            <div className="space-y-2">
              {asset.keyframes.map((kf, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs"
                >
                  <div className="flex-1">
                    <div className="font-mono font-bold">
                      {formatTime(kf.time)}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 text-xs">
                      {Object.keys(kf).filter(k => k !== 'time' && k !== 'easing' && kf[k as keyof TimelineKeyframe] !== undefined).join(', ')}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveKeyframe(asset.id, index)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Property Control Component
interface PropertyControlProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  formatValue?: (val: number) => number;
  hasKeyframe?: boolean;
  onValueChange: (value: number) => void;
  onAddKeyframe: () => void;
}

function PropertyControl({
  label,
  icon,
  value,
  min,
  max,
  step,
  unit,
  formatValue,
  hasKeyframe,
  onValueChange,
  onAddKeyframe
}: PropertyControlProps) {
  const displayValue = formatValue ? formatValue(value) : value;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
          {icon}
          {label}
        </label>
        <Button
          variant={hasKeyframe ? "default" : "outline"}
          size="sm"
          className="h-6 px-2"
          onClick={onAddKeyframe}
          title={hasKeyframe ? "Keyframe exists" : "Add keyframe"}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Slider
          value={[value]}
          onValueChange={(values: number[]) => onValueChange(values[0])}
          min={min}
          max={max}
          step={step}
          className="flex-1"
        />
        <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 w-16 text-right">
          {displayValue}{unit}
        </div>
      </div>
    </div>
  );
}

