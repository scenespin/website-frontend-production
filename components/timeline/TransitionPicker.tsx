/**
 * TransitionPicker Component
 * 
 * Modal for selecting from 55 Hollywood transitions
 * Feature 0065: Timeline Transitions & LUTs Integration
 */

'use client';

import React, { useState } from 'react';
import { X, Play } from 'lucide-react';
import { HOLLYWOOD_TRANSITIONS } from '@/hooks/useTimeline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TransitionPickerProps {
  onSelect: (transition: { type: string; duration: number; easing?: string }) => void;
  onClose: () => void;
}

export function TransitionPicker({ onSelect, onClose }: TransitionPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [duration, setDuration] = useState<number>(1.0);
  const [easing, setEasing] = useState<'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'>('ease-in-out');
  const [hoveredTransition, setHoveredTransition] = useState<string | null>(null);

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(HOLLYWOOD_TRANSITIONS.map(t => t.category)))];
  
  // Filter transitions by category
  const filteredTransitions = selectedCategory === 'all' 
    ? HOLLYWOOD_TRANSITIONS 
    : HOLLYWOOD_TRANSITIONS.filter(t => t.category === selectedCategory);

  // Get count per category
  const getCategoryCount = (cat: string) => {
    if (cat === 'all') return HOLLYWOOD_TRANSITIONS.length;
    return HOLLYWOOD_TRANSITIONS.filter(t => t.category === cat).length;
  };

  const handleSelect = (transitionId: string) => {
    onSelect({
      type: transitionId,
      duration,
      easing
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-base-200 border border-base-content/20 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-content/20 bg-gradient-to-r from-purple-900/20 to-base-300">
          <div>
            <h2 className="text-2xl font-bold text-base-content flex items-center gap-2">
              🎬 Hollywood Transitions
            </h2>
            <p className="text-base-content/60 text-sm mt-1">
              55 professional transitions included
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-base-300 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-base-content/60" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 p-4 border-b border-base-content/20 bg-base-300/50 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-base-content shadow-lg shadow-purple-500/30'
                  : 'bg-base-content/20 text-base-content/70 hover:bg-base-content/30'
              }`}
            >
              {cat === 'all' ? 'All' : cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} ({getCategoryCount(cat)})
            </button>
          ))}
        </div>

        {/* Transitions Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredTransitions.map(transition => (
              <button
                key={transition.id}
                onClick={() => handleSelect(transition.id)}
                onMouseEnter={() => setHoveredTransition(transition.id)}
                onMouseLeave={() => setHoveredTransition(null)}
                className="group relative bg-base-300 hover:bg-base-content/10 border-2 border-base-content/20 hover:border-purple-500 rounded-lg p-4 transition-all hover:shadow-xl hover:shadow-purple-500/20 hover:scale-105"
              >
                {/* Icon */}
                <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                  {transition.icon}
                </div>
                
                {/* Name */}
                <div className="text-base-content text-sm font-medium mb-1">
                  {transition.name}
                </div>
                
                {/* Duration Badge */}
                <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30">
                  {transition.duration}s
                </Badge>

                {/* Preview Video on Hover */}
                {hoveredTransition === transition.id && (
                  <div className="absolute inset-0 bg-black/80 rounded-lg flex items-center justify-center">
                    <Play className="w-8 h-8 text-purple-400" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* No Results */}
          {filteredTransitions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-base-content/60">No transitions found in this category</p>
            </div>
          )}
        </div>

        {/* Footer - Duration & Easing Controls */}
        <div className="p-6 border-t border-base-content/20 bg-base-300/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Duration Slider */}
            <div>
              <label className="block text-base-content text-sm font-medium mb-2">
                Duration: {duration.toFixed(1)}s
              </label>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                value={duration}
                onChange={(e) => setDuration(parseFloat(e.target.value))}
                className="w-full h-2 bg-base-content/20 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-base-content/60 mt-1">
                <span>0.1s (Fast)</span>
                <span>3.0s (Slow)</span>
              </div>
            </div>

            {/* Easing Selector */}
            <div>
              <label className="block text-base-content text-sm font-medium mb-2">
                Easing
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['linear', 'ease-in', 'ease-out', 'ease-in-out'] as const).map(e => (
                  <button
                    key={e}
                    onClick={() => setEasing(e)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                      easing === e
                        ? 'bg-purple-600 text-base-content'
                        : 'bg-base-content/20 text-base-content/70 hover:bg-base-content/30'
                    }`}
                  >
                    {e.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Info Text */}
          <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <p className="text-purple-300 text-sm">
              💡 <strong>Tip:</strong> Transitions are applied between clips. Position this clip before another clip to see the transition effect during playback and export.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
