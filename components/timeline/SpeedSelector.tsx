/**
 * Speed Selector Modal
 * 
 * Choose playback speed for timeline clips (0.25x - 4.0x)
 * Feature 0103: Timeline Advanced Editing Features
 */

'use client';

import React, { useState } from 'react';
import { X, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SpeedSelectorProps {
  currentSpeed: number;
  clipDuration: number;
  onSelect: (speed: number) => void;
  onClose: () => void;
}

const SPEED_OPTIONS = [
  { speed: 0.25, label: '0.25x', icon: '🐌', description: 'Super Slow Motion', color: 'bg-[#DC143C]' },
  { speed: 0.5, label: '0.5x', icon: '🚶', description: 'Slow Motion', color: 'bg-cyan-600' },
  { speed: 1.0, label: '1.0x', icon: '▶️', description: 'Normal Speed', color: 'bg-green-600' },
  { speed: 2.0, label: '2.0x', icon: '🏃', description: 'Fast Forward', color: 'bg-orange-600' },
  { speed: 4.0, label: '4.0x', icon: '⚡', description: 'Timelapse', color: 'bg-red-600' },
];

export function SpeedSelector({ currentSpeed, clipDuration, onSelect, onClose }: SpeedSelectorProps) {
  const [selectedSpeed, setSelectedSpeed] = useState(currentSpeed || 1.0);

  const calculateNewDuration = (speed: number) => {
    return (clipDuration / speed).toFixed(2);
  };

  const handleSelect = () => {
    onSelect(selectedSpeed);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
      <div className="bg-base-200 border border-base-content/20 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Header - Mobile Optimized */}
        <div className="flex items-center justify-between p-3 md:p-6 border-b border-base-content/20 bg-gradient-to-r from-indigo-900/20 to-base-300 sticky top-0 z-10">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-2xl font-bold text-base-content flex items-center gap-2">
              <Gauge className="w-5 h-5 md:w-7 md:h-7 text-indigo-400 flex-shrink-0" />
              <span className="truncate">Playback Speed</span>
            </h2>
            <p className="text-base-content/60 text-xs md:text-sm mt-1 hidden sm:block">
              Change clip playback speed • Slow motion or timelapse
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 md:p-2 hover:bg-base-300 rounded-lg transition-colors flex-shrink-0 ml-2"
          >
            <X className="w-5 h-5 md:w-6 md:h-6 text-base-content/60" />
          </button>
        </div>

        {/* Duration Preview - Mobile Optimized */}
        <div className="p-3 md:p-6 bg-base-300/30 border-b border-base-content/20">
          <div className="flex items-center justify-between gap-2">
            <div className="text-center flex-1">
              <p className="text-xs md:text-sm text-base-content/60 mb-1">Current</p>
              <p className="text-lg md:text-2xl font-mono font-bold text-base-content">{clipDuration.toFixed(2)}s</p>
            </div>
            <div className="text-2xl md:text-4xl text-base-content/40 flex-shrink-0">→</div>
            <div className="text-center flex-1">
              <p className="text-xs md:text-sm text-base-content/60 mb-1">New</p>
              <p className="text-lg md:text-2xl font-mono font-bold text-indigo-400">{calculateNewDuration(selectedSpeed)}s</p>
            </div>
          </div>
          
          {selectedSpeed !== 1.0 && (
            <div className="mt-3 md:mt-4 text-center">
              <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-xs">
                {selectedSpeed < 1.0 ? 
                  `${(1/selectedSpeed).toFixed(0)}x slower` : 
                  `${selectedSpeed.toFixed(0)}x faster`
                }
              </Badge>
            </div>
          )}
        </div>

        {/* Speed Options - Mobile Optimized */}
        <div className="p-3 md:p-6">
          <div className="grid grid-cols-1 gap-2 md:gap-3">
            {SPEED_OPTIONS.map((option) => {
              const isSelected = selectedSpeed === option.speed;
              
              return (
                <button
                  key={option.speed}
                  onClick={() => setSelectedSpeed(option.speed)}
                  className={`group relative p-3 md:p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected 
                      ? `${option.color} border-transparent shadow-lg text-white` 
                      : 'bg-base-300 border-base-content/20 hover:border-indigo-500 hover:bg-base-content/10 active:bg-base-content/20'
                  }`}
                >
                  <div className="flex items-center gap-2 md:gap-4">
                    {/* Icon - Smaller on mobile */}
                    <div className={`text-2xl md:text-4xl flex-shrink-0 ${isSelected ? '' : 'opacity-70'}`}>
                      {option.icon}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 md:mb-1">
                        <h3 className={`text-base md:text-xl font-bold ${isSelected ? 'text-white' : 'text-base-content'}`}>
                          {option.label}
                        </h3>
                        {isSelected && (
                          <Badge className="bg-white/20 text-white text-xs hidden sm:inline-flex">Selected</Badge>
                        )}
                      </div>
                      <p className={`text-xs md:text-sm ${isSelected ? 'text-white/90' : 'text-base-content/60'}`}>
                        {option.description}
                      </p>
                    </div>

                    {/* Duration Change - Hidden on small mobile */}
                    <div className={`text-right flex-shrink-0 hidden xs:block ${isSelected ? 'text-white/80' : 'text-base-content/50'}`}>
                      <div className="text-xs font-medium mb-1">Duration</div>
                      <div className="text-sm md:text-lg font-mono font-bold">
                        {calculateNewDuration(option.speed)}s
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions - Mobile Optimized */}
        <div className="p-3 md:p-6 border-t border-base-content/20 bg-base-300/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-xs md:text-sm text-base-content/60 text-center sm:text-left">
            💡 <span className="font-medium">Tip:</span> <span className="hidden sm:inline">Speed changes are applied during export (no extra cost!)</span><span className="sm:hidden">Free during export!</span>
          </div>
          <div className="flex gap-2 md:gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 sm:flex-initial"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSelect}
              className="bg-[#DC143C] hover:bg-indigo-700 text-white flex-1 sm:flex-initial"
            >
              Apply Speed
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

