import React from 'react';
import { Sliders, User, Users } from 'lucide-react';

export interface PerformanceSettings {
  facialPerformance: number;      // 0-2 range
  animationStyle: 'full-body' | 'face-only';
}

interface PerformanceControlsProps {
  settings: PerformanceSettings;
  onChange: (settings: PerformanceSettings) => void;
  compact?: boolean;
}

const PRESETS = {
  subtle: {
    name: 'Subtle',
    description: 'Minimal expressions',
    icon: '😐',
    facialPerformance: 0.5,
    animationStyle: 'full-body' as const
  },
  natural: {
    name: 'Natural',
    description: 'Balanced performance',
    icon: '😊',
    facialPerformance: 1.0,
    animationStyle: 'full-body' as const
  },
  expressive: {
    name: 'Expressive',
    description: 'Emotional scenes',
    icon: '😃',
    facialPerformance: 1.5,
    animationStyle: 'full-body' as const
  },
  dramatic: {
    name: 'Dramatic',
    description: 'Intense emotion',
    icon: '😱',
    facialPerformance: 1.8,
    animationStyle: 'full-body' as const
  },
  comedy: {
    name: 'Comedy',
    description: 'Exaggerated style',
    icon: '🤪',
    facialPerformance: 2.0,
    animationStyle: 'full-body' as const
  },
  closeup: {
    name: 'Closeup',
    description: 'Face-focused',
    icon: '😌',
    facialPerformance: 1.0,
    animationStyle: 'face-only' as const
  }
};

export function PerformanceControls({ settings, onChange, compact = false }: PerformanceControlsProps) {
  
  const handlePresetClick = (preset: typeof PRESETS[keyof typeof PRESETS]) => {
    onChange({
      facialPerformance: preset.facialPerformance,
      animationStyle: preset.animationStyle
    });
  };

  const handleFacialChange = (value: number) => {
    onChange({
      ...settings,
      facialPerformance: value
    });
  };

  const handleStyleChange = (style: 'full-body' | 'face-only') => {
    onChange({
      ...settings,
      animationStyle: style
    });
  };

  const getPerformanceLabel = (value: number) => {
    if (value <= 0.6) return 'Subtle';
    if (value <= 1.2) return 'Natural';
    if (value <= 1.6) return 'Expressive';
    return 'Dramatic';
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Compact Presets */}
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(PRESETS).slice(0, 6).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => handlePresetClick(preset)}
              className="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors text-center"
              title={preset.description}
            >
              <span className="text-lg">{preset.icon}</span>
              <div className="text-xs mt-1">{preset.name}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sliders className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
          Performance Settings
        </h4>
      </div>

      {/* Presets */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
          Quick Presets
        </label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => handlePresetClick(preset)}
              className={`px-3 py-2 text-sm rounded-lg transition-all ${
                Math.abs(settings.facialPerformance - preset.facialPerformance) < 0.1 &&
                settings.animationStyle === preset.animationStyle
                  ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 text-blue-700 dark:text-blue-300'
                  : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
              }`}
              title={preset.description}
            >
              <span className="text-lg">{preset.icon}</span>
              <div className="text-xs font-medium mt-1">{preset.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Facial Performance Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
            Facial Performance
          </label>
          <span className="text-xs font-semibold text-slate-900 dark:text-white">
            {settings.facialPerformance.toFixed(1)} ({getPerformanceLabel(settings.facialPerformance)})
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={settings.facialPerformance}
          onChange={(e) => handleFacialChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
          <span>Subtle</span>
          <span>Natural</span>
          <span>Dramatic</span>
        </div>
      </div>

      {/* Animation Style */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
          Animation Style
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleStyleChange('full-body')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
              settings.animationStyle === 'full-body'
                ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 text-blue-700 dark:text-blue-300'
                : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <div className="text-left">
              <div className="text-sm font-medium">Full Body</div>
              <div className="text-xs opacity-75">Face + Gestures</div>
            </div>
          </button>
          <button
            onClick={() => handleStyleChange('face-only')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
              settings.animationStyle === 'face-only'
                ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 text-blue-700 dark:text-blue-300'
                : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
            }`}
          >
            <User className="w-4 h-4" />
            <div className="text-left">
              <div className="text-sm font-medium">Face Only</div>
              <div className="text-xs opacity-75">For closeups</div>
            </div>
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
        <span className="font-medium">💡 Tip:</span> Higher facial performance creates more expressive animations. 
        Use Full Body for action scenes, Face Only for dialogue closeups.
      </div>
    </div>
  );
}

