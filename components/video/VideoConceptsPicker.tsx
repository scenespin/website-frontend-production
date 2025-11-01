/**
 * VideoConceptsPicker.tsx
 * Extracted from QuickVideoCard.tsx for better modularity
 * Handles selection of video enhancement concepts (dolly zoom, motion blur, etc.)
 */

'use client';

import React from 'react';

export interface VideoConcept {
  key: string;
  label: string;
  description: string;
}

interface VideoConceptsPickerProps {
  concepts: VideoConcept[];
  selectedConcepts: string[];
  onConceptsChange: (concepts: string[]) => void;
  maxConcepts?: number;
  disabled?: boolean;
}

const AVAILABLE_CONCEPTS: VideoConcept[] = [
  { key: 'dolly_zoom', label: '🎬 Dolly Zoom', description: 'Hitchcock effect' },
  { key: 'camera_orbit', label: '🔄 Camera Orbit', description: 'Rotate around subject' },
  { key: 'camera_zoom', label: '🔍 Camera Zoom', description: 'Zoom in/out' },
  { key: 'camera_pan', label: '↔️ Camera Pan', description: 'Horizontal movement' },
  { key: 'camera_tilt', label: '↕️ Camera Tilt', description: 'Vertical movement' },
  { key: 'motion_blur', label: '💨 Motion Blur', description: 'Speed effect' },
  { key: 'depth_of_field', label: '🎯 Depth of Field', description: 'Focus effect' },
  { key: 'lens_flare', label: '✨ Lens Flare', description: 'Light streaks' },
];

export function VideoConceptsPicker({
  concepts = AVAILABLE_CONCEPTS,
  selectedConcepts,
  onConceptsChange,
  maxConcepts = 3,
  disabled = false
}: VideoConceptsPickerProps) {
  
  const toggleConcept = (key: string) => {
    if (selectedConcepts.includes(key)) {
      // Remove concept
      onConceptsChange(selectedConcepts.filter(c => c !== key));
    } else if (selectedConcepts.length < maxConcepts) {
      // Add concept (if under max)
      onConceptsChange([...selectedConcepts, key]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Video Concepts
        </label>
        <span className="text-xs text-slate-500">
          {selectedConcepts.length} / {maxConcepts} selected
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {concepts.map(concept => {
          const isSelected = selectedConcepts.includes(concept.key);
          const isDisabled = disabled || (!isSelected && selectedConcepts.length >= maxConcepts);

          return (
            <button
              key={concept.key}
              type="button"
              onClick={() => toggleConcept(concept.key)}
              disabled={isDisabled}
              className={`
                px-3 py-2 rounded-lg border text-left transition-all
                ${isSelected 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="text-sm font-medium">{concept.label}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {concept.description}
              </div>
            </button>
          );
        })}
      </div>

      {selectedConcepts.length >= maxConcepts && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Maximum {maxConcepts} concepts reached. Deselect one to choose another.
        </p>
      )}
    </div>
  );
}

