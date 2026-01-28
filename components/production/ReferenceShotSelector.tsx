/**
 * Reference Shot Selector Component
 * 
 * Allows users to select the image model for first frame generation.
 * Models: All 6 available models (2K models prioritized)
 */

'use client';

import React from 'react';

type ReferenceShotModel = 'nano-banana-pro' | 'nano-banana-pro-2k' | 'flux2-max-4k-16:9' | 'flux2-max-2k' | 'flux2-pro-4k' | 'flux2-pro-2k';

interface ReferenceShotSelectorProps {
  shotSlot: number;
  selectedModel: ReferenceShotModel | undefined;
  onModelChange: (shotSlot: number, model: ReferenceShotModel) => void;
}

export function ReferenceShotSelector({
  shotSlot,
  selectedModel,
  onModelChange
}: ReferenceShotSelectorProps) {
  // 2K Models (prioritized)
  // 4K Models
  const models: Array<{ id: ReferenceShotModel; name: string; refs: number; resolution: string }> = [
    // 2K Models (prioritized)
    {
      id: 'nano-banana-pro-2k' as const,
      name: 'Nano Banana Pro (2K)',
      refs: 14,
      resolution: '2K'
    },
    {
      id: 'flux2-max-2k' as const,
      name: 'FLUX.2 [max] (2K)',
      refs: 8,
      resolution: '2K'
    },
    {
      id: 'flux2-pro-2k' as const,
      name: 'FLUX.2 [pro] (2K)',
      refs: 10,
      resolution: '2K'
    },
    // 4K Models
    {
      id: 'nano-banana-pro' as const,
      name: 'Nano Banana Pro (4K)',
      refs: 14,
      resolution: '4K'
    },
    {
      id: 'flux2-max-4k-16:9' as const,
      name: 'FLUX.2 [max] (4K)',
      refs: 8,
      resolution: '4K'
    },
    {
      id: 'flux2-pro-4k' as const,
      name: 'FLUX.2 [pro] (4K)',
      refs: 10,
      resolution: '4K'
    }
  ];

  const currentModel = models.find(m => m.id === selectedModel) || models[0];
  // Ensure value is always a string (never undefined) to prevent React error #185
  const selectValue = selectedModel ?? 'nano-banana-pro-2k';

  return (
    <div className="pb-3">
      <div className="text-xs font-medium text-[#FFFFFF] mb-2">Reference Shot</div>
      <div className="space-y-2">
        <select
          value={selectValue}
          onChange={(e) => {
            onModelChange(shotSlot, e.target.value as ReferenceShotModel);
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

