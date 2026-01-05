/**
 * Reference Shot Selector Component
 * 
 * Allows users to select the image model for first frame generation.
 * Models: Nano Banana Pro, FLUX.2 [max]
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
        <Select
          value={selectValue}
          onValueChange={(value) => {
            onModelChange(shotSlot, value as 'nano-banana-pro' | 'flux2-max-4k-16:9');
          }}
        >
          <SelectTrigger className="w-full bg-[#0A0A0A] border-[#3F3F46] text-[#FFFFFF] text-xs h-9">
            <SelectValue>
              <span className="text-xs">{currentModel.name}</span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-[#1A1A1A] border-[#3F3F46]">
            {models.map((model) => (
              <SelectItem
                key={model.id}
                value={model.id}
                className="text-xs text-[#FFFFFF] hover:bg-[#3F3F46] focus:bg-[#3F3F46]"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{model.name}</span>
                  <span className="text-[10px] text-[#808080]">
                    {model.refs} refs • {model.resolution}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-[10px] text-[#808080]">
          Selected: {currentModel.name} ({currentModel.refs} references, {currentModel.resolution})
        </div>
      </div>
    </div>
  );
}

