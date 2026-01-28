/**
 * Reference Shot Selector Component
 *
 * Allows users to select the image model for first frame generation.
 * Model list is loaded from the unified model-selection API (single source of truth).
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

export type ReferenceShotModel =
  | 'nano-banana-pro'
  | 'nano-banana-pro-2k'
  | 'flux2-max-4k-16:9'
  | 'flux2-max-2k'
  | 'flux2-pro-4k'
  | 'flux2-pro-2k';

interface ApiModel {
  id: string;
  name: string;
  referenceLimit: number;
  quality: string;
  enabled?: boolean;
}

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
  const { getToken } = useAuth();
  const [models, setModels] = useState<Array<{ id: ReferenceShotModel; name: string; refs: number; resolution: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadModels() {
      setIsLoading(true);
      try {
        const token = await getToken({ template: 'wryda-backend' });
        if (!token || cancelled) return;
        const response = await fetch('/api/model-selection/characters', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok || cancelled) return;
        const data = await response.json();
        const raw = (data.data?.models ?? data.models ?? []) as ApiModel[];
        const enabled = raw.filter((m: ApiModel) => m.enabled !== false);
        const mapped = enabled.map((m: ApiModel) => ({
          id: m.id as ReferenceShotModel,
          name: m.name,
          refs: m.referenceLimit,
          resolution: m.quality === '4K' ? '4K' : '2K'
        }));
        if (!cancelled) setModels(mapped);
      } catch (_) {
        if (!cancelled) setModels([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadModels();
    return () => { cancelled = true; };
  }, [getToken]);

  const currentModel = models.find((m) => m.id === selectedModel) ?? models[0];
  const selectValue = selectedModel ?? 'nano-banana-pro-2k';

  if (isLoading) {
    return (
      <div className="pb-3">
        <div className="text-xs font-medium text-[#FFFFFF] mb-2">Reference Shot</div>
        <div className="text-[10px] text-[#808080]">Loading models…</div>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="pb-3">
        <div className="text-xs font-medium text-[#FFFFFF] mb-2">Reference Shot</div>
        <div className="text-[10px] text-[#808080]">No models available</div>
      </div>
    );
  }

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
