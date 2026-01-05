/**
 * Reference Shot Selector Component
 * 
 * Allows users to select the image model for first frame generation.
 * Models: Nano Banana Pro, FLUX.2 [max]
 */

'use client';

import React from 'react';

interface ReferenceShotSelectorProps {
  shotSlot: number;
  selectedModel: 'nano-banana-pro' | 'flux2-max-4k-16:9' | undefined;
  onModelChange: (shotSlot: number, model: 'nano-banana-pro' | 'flux2-max-4k-16:9') => void;
}

export function ReferenceShotSelector({
  shotSlot,
  selectedModel,
  onModelChange
}: ReferenceShotSelectorProps) {
  const models = [
    {
      id: 'nano-banana-pro' as const,
      name: 'Nano Banana Pro',
      refs: 14,
      resolution: '4K'
    },
    {
      id: 'flux2-max-4k-16:9' as const,
      name: 'FLUX.2 [max]',
      refs: 8,
      resolution: '4K'
    }
  ];

  const currentModel = models.find(m => m.id === selectedModel) || models[0];
  // Ensure value is always a string (never undefined) to prevent React error #185
  const selectValue = selectedModel ?? 'nano-banana-pro';

  return (
    <div className="pb-3">
      <div className="text-xs font-medium text-[#FFFFFF] mb-2">Reference Shot</div>
      <div className="space-y-2">
        <select
          value={selectValue}
          onChange={(e) => {
            onModelChange(shotSlot, e.target.value as 'nano-banana-pro' | 'flux2-max-4k-16:9');
          }}
          className="select select-bordered w-full bg-[#0A0A0A] border-[#3F3F46] text-[#FFFFFF] text-xs h-9 focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
        >
          {models.map((model) => (
            <option key={model.id} value={model.id} className="bg-[#1A1A1A] text-[#FFFFFF]">
              {model.name} ({model.refs} refs • {model.resolution})
            </option>
          ))}
        </select>
        <div className="text-[10px] text-[#808080]">
          Selected: {currentModel.name} ({currentModel.refs} references, {currentModel.resolution})
        </div>
      </div>
    </div>
  );
}

