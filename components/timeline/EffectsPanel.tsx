/**
 * Effects Panel
 * 
 * Apply visual effects and filters to timeline clips
 * Feature 0103 Sprint 3: Professional NLE Effects
 */

'use client';

import React, { useState } from 'react';
import { X, Sparkles, Eye, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { TimelineAsset } from '@/hooks/useTimeline';

interface EffectsPanelProps {
  asset: TimelineAsset;
  onApply: (effects: NonNullable<TimelineAsset['effects']>, colorGrading: NonNullable<TimelineAsset['colorGrading']>) => void;
  onClose: () => void;
}

export function EffectsPanel({ asset, onApply, onClose }: EffectsPanelProps) {
  // Initialize state from asset
  const [effects, setEffects] = useState({
    blur: asset.effects?.blur || 0,
    sharpen: asset.effects?.sharpen || 0,
    vignette: asset.effects?.vignette || 0,
    grain: asset.effects?.grain || 0
  });

  const [colorGrading, setColorGrading] = useState({
    brightness: asset.colorGrading?.brightness || 0,
    contrast: asset.colorGrading?.contrast || 0,
    saturation: asset.colorGrading?.saturation || 0,
    temperature: asset.colorGrading?.temperature || 0,
    tint: asset.colorGrading?.tint || 0
  });

  const hasChanges = 
    Object.values(effects).some(v => v !== 0) || 
    Object.values(colorGrading).some(v => v !== 0);

  const handleApply = () => {
    onApply(effects, colorGrading);
    onClose();
  };

  const handleReset = () => {
    setEffects({ blur: 0, sharpen: 0, vignette: 0, grain: 0 });
    setColorGrading({ brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0 });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
      <div className="bg-base-200 border border-base-content/20 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Header - Mobile Optimized */}
        <div className="flex items-center justify-between p-3 md:p-6 border-b border-base-content/20 bg-gradient-to-r from-purple-900/20 to-base-300 sticky top-0 z-10">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-2xl font-bold text-base-content flex items-center gap-2">
              <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-purple-400 flex-shrink-0" />
              <span className="truncate">Visual Effects</span>
            </h2>
            <p className="text-base-content/60 text-xs md:text-sm mt-1 hidden sm:block">
              Professional filters & color adjustments
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 md:p-2 hover:bg-base-300 rounded-lg transition-colors flex-shrink-0 ml-2"
          >
            <X className="w-5 h-5 md:w-6 md:h-6 text-base-content/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 md:p-6 space-y-4 md:space-y-6">
          
          {/* Visual Effects Section */}
          <Card className="bg-purple-500/5 border-purple-500/20">
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-base md:text-lg text-purple-400 flex items-center gap-2">
                <Eye className="w-4 h-4 md:w-5 md:h-5" />
                Visual Effects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              
              {/* Blur */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm md:text-base font-medium text-base-content">
                    Blur
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {effects.blur}
                  </Badge>
                </div>
                <Slider
                  value={[effects.blur]}
                  onValueChange={([value]) => setEffects({ ...effects, blur: value })}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-base-content/50 mt-1">Gaussian blur (0 = none, 100 = max)</p>
              </div>

              {/* Sharpen */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm md:text-base font-medium text-base-content">
                    Sharpen
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {effects.sharpen}
                  </Badge>
                </div>
                <Slider
                  value={[effects.sharpen]}
                  onValueChange={([value]) => setEffects({ ...effects, sharpen: value })}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-base-content/50 mt-1">Unsharp mask (0 = none, 100 = max)</p>
              </div>

              {/* Vignette */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm md:text-base font-medium text-base-content">
                    Vignette
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {effects.vignette}
                  </Badge>
                </div>
                <Slider
                  value={[effects.vignette]}
                  onValueChange={([value]) => setEffects({ ...effects, vignette: value })}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-base-content/50 mt-1">Edge darkening (0 = none, 100 = max)</p>
              </div>

              {/* Film Grain */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm md:text-base font-medium text-base-content">
                    Film Grain
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {effects.grain}
                  </Badge>
                </div>
                <Slider
                  value={[effects.grain]}
                  onValueChange={([value]) => setEffects({ ...effects, grain: value })}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-base-content/50 mt-1">Analog film texture (0 = none, 100 = max)</p>
              </div>

            </CardContent>
          </Card>

          {/* Color Grading Section */}
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-base md:text-lg text-[#DC143C] flex items-center gap-2">
                🎨 Color Grading
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              
              {/* Brightness */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm md:text-base font-medium text-base-content">
                    Brightness
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {colorGrading.brightness > 0 ? '+' : ''}{colorGrading.brightness}
                  </Badge>
                </div>
                <Slider
                  value={[colorGrading.brightness]}
                  onValueChange={([value]) => setColorGrading({ ...colorGrading, brightness: value })}
                  min={-100}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Contrast */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm md:text-base font-medium text-base-content">
                    Contrast
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {colorGrading.contrast > 0 ? '+' : ''}{colorGrading.contrast}
                  </Badge>
                </div>
                <Slider
                  value={[colorGrading.contrast]}
                  onValueChange={([value]) => setColorGrading({ ...colorGrading, contrast: value })}
                  min={-100}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Saturation */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm md:text-base font-medium text-base-content">
                    Saturation
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {colorGrading.saturation > 0 ? '+' : ''}{colorGrading.saturation}
                  </Badge>
                </div>
                <Slider
                  value={[colorGrading.saturation]}
                  onValueChange={([value]) => setColorGrading({ ...colorGrading, saturation: value })}
                  min={-100}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Temperature */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm md:text-base font-medium text-base-content">
                    Temperature
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {colorGrading.temperature > 0 ? 'Warm +' : colorGrading.temperature < 0 ? 'Cool ' : ''}{colorGrading.temperature}
                  </Badge>
                </div>
                <Slider
                  value={[colorGrading.temperature]}
                  onValueChange={([value]) => setColorGrading({ ...colorGrading, temperature: value })}
                  min={-100}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-base-content/50 mt-1">Cool (blue) ← → Warm (orange)</p>
              </div>

              {/* Tint */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm md:text-base font-medium text-base-content">
                    Tint
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {colorGrading.tint > 0 ? 'Magenta +' : colorGrading.tint < 0 ? 'Green ' : ''}{colorGrading.tint}
                  </Badge>
                </div>
                <Slider
                  value={[colorGrading.tint]}
                  onValueChange={([value]) => setColorGrading({ ...colorGrading, tint: value })}
                  min={-100}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-base-content/50 mt-1">Green ← → Magenta</p>
              </div>

            </CardContent>
          </Card>

        </div>

        {/* Footer Actions - Mobile Optimized */}
        <div className="p-3 md:p-6 border-t border-base-content/20 bg-base-300/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-xs md:text-sm text-base-content/60 text-center sm:text-left">
            💡 <span className="font-medium">Tip:</span> <span className="hidden sm:inline">Effects applied during export (free!)</span><span className="sm:hidden">Free!</span>
          </div>
          <div className="flex gap-2 md:gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges}
              className="flex-1 sm:flex-initial"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 sm:flex-initial"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              className="bg-purple-600 hover:bg-purple-700 text-white flex-1 sm:flex-initial"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

