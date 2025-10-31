/**
 * LUTPicker Component
 * 
 * Modal for selecting from 34 cinematic LUTs (including Wryda Signature)
 * Includes before/after preview and intensity slider
 * Feature 0065: Timeline Transitions & LUTs Integration
 */

'use client';

import React, { useState } from 'react';
import { X, Palette, RotateCw } from 'lucide-react';
import { CINEMATIC_LUTS, TimelineAsset } from '@/hooks/useTimeline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface LUTPickerProps {
  asset: TimelineAsset;
  onSelect: (lut: { name: string; lutId: string; cubeFile: string; intensity: number } | null) => void;
  onClose: () => void;
}

export function LUTPicker({ asset, onSelect, onClose }: LUTPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [intensity, setIntensity] = useState<number>(asset.lut?.intensity || 1.0);
  const [hoveredLUT, setHoveredLUT] = useState<string | null>(null);
  const [selectedLUT, setSelectedLUT] = useState<string | null>(asset.lut?.lutId || null);

  // Get unique categories
  const categories = ['all', 'signature', ...Array.from(new Set(CINEMATIC_LUTS.filter(l => !l.isDefault).map(l => l.category)))];
  
  // Filter LUTs by category
  const filteredLUTs = selectedCategory === 'all' 
    ? CINEMATIC_LUTS 
    : CINEMATIC_LUTS.filter(l => l.category === selectedCategory);

  // Get count per category
  const getCategoryCount = (cat: string) => {
    if (cat === 'all') return CINEMATIC_LUTS.length;
    return CINEMATIC_LUTS.filter(l => l.category === cat).length;
  };

  const handleSelect = (lutId: string) => {
    const lut = CINEMATIC_LUTS.find(l => l.id === lutId);
    if (!lut) return;

    setSelectedLUT(lutId);
    onSelect({
      name: lut.name,
      lutId: lut.id,
      cubeFile: lut.file,
      intensity
    });
  };

  const handleRemoveLUT = () => {
    onSelect(null);
  };

  const formatCategoryName = (cat: string) => {
    if (cat === 'all') return 'All';
    if (cat === 'signature') return '✨ Signature';
    if (cat === 'black-white') return 'Black & White';
    if (cat === 'film-stock') return 'Film Stock';
    return cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-orange-900/20 to-gray-900">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Palette className="w-7 h-7 text-orange-400" />
              Cinematic LUTs
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Professional color grading • 34 LUTs • 100% FREE
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Before/After Preview */}
        <div className="p-6 bg-gray-800/30 border-b border-gray-700">
          <div className="relative rounded-lg overflow-hidden bg-gray-800 aspect-video max-h-64">
            {/* Preview Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🎨</div>
                <p className="text-gray-400 text-sm">
                  {hoveredLUT || selectedLUT ? 
                    `Preview: ${CINEMATIC_LUTS.find(l => l.id === (hoveredLUT || selectedLUT))?.name}` : 
                    'Hover over a LUT to preview'
                  }
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Intensity: {Math.round(intensity * 100)}%
                </p>
              </div>
            </div>
            
            {/* Before/After Labels */}
            <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
              <Badge className="bg-black/70 text-white">Before</Badge>
              <Badge className="bg-orange-500/90 text-white">After</Badge>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-700 bg-gray-800/50 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {formatCategoryName(cat)} ({getCategoryCount(cat)})
            </button>
          ))}
        </div>

        {/* LUTs Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredLUTs.map(lut => (
              <button
                key={lut.id}
                onClick={() => handleSelect(lut.id)}
                onMouseEnter={() => setHoveredLUT(lut.id)}
                onMouseLeave={() => setHoveredLUT(null)}
                className={`group relative bg-gray-800 hover:bg-gray-700 border-2 rounded-lg p-4 transition-all hover:shadow-xl hover:scale-105 ${
                  selectedLUT === lut.id
                    ? 'border-orange-500 shadow-lg shadow-orange-500/30'
                    : 'border-gray-700 hover:border-orange-500'
                }`}
              >
                {/* Preview Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 rounded mb-2 flex items-center justify-center">
                  {lut.isDefault ? (
                    <span className="text-3xl">✨</span>
                  ) : (
                    <Palette className="w-8 h-8 text-gray-600" />
                  )}
                </div>
                
                {/* Name */}
                <div className="text-white text-sm font-medium mb-1 truncate">
                  {lut.name}
                </div>
                
                {/* Category Badge */}
                <Badge variant="outline" className="text-xs bg-orange-500/20 text-orange-300 border-orange-500/30">
                  {formatCategoryName(lut.category)}
                </Badge>

                {/* Selected Indicator */}
                {selectedLUT === lut.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}

                {/* Default Badge */}
                {lut.isDefault && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-orange-500 text-white text-xs">
                      Default
                    </Badge>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer - Intensity & Color Adjustments */}
        <div className="p-6 border-t border-gray-700 bg-gray-800/50">
          
          {/* Intensity Slider */}
          <div className="mb-6">
            <label className="block text-white text-sm font-medium mb-2">
              LUT Intensity: {Math.round(intensity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={intensity}
              onChange={(e) => setIntensity(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0% (None)</span>
              <span>50% (Subtle)</span>
              <span>100% (Full)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              onClick={handleRemoveLUT}
              variant="outline"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              Remove LUT
            </Button>
            
            <Button
              onClick={() => {
                const defaultLUT = CINEMATIC_LUTS.find(l => l.isDefault);
                if (defaultLUT) handleSelect(defaultLUT.id);
              }}
              variant="outline"
              className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
            >
              <RotateCw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
            
            <Button
              onClick={onClose}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Done
            </Button>
          </div>

          {/* Info Text */}
          <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <p className="text-orange-300 text-sm">
              💡 <strong>Tip:</strong> LUTs (Lookup Tables) are color grading presets used in Hollywood films. Adjust intensity to blend the look with your original footage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

