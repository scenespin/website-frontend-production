'use client';

/**
 * AIGenerationTab - AI Generation tab for Character Studio
 * 
 * Features:
 * - Generate character variations using AI
 * - Outfit selection
 * - Pose package selection
 */

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AIGenerationTabProps {
  characterId: string;
  characterName: string;
  screenplayId: string;
  onComplete: (result: { outfitName: string; images: string[] }) => void;
}

export function AIGenerationTab({
  characterId,
  characterName,
  screenplayId,
  onComplete
}: AIGenerationTabProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-[#1F1F1F] border border-[#3F3F46] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-2">AI Generation</h3>
        <p className="text-sm text-[#808080] mb-4">
          Generate character variations using AI. This feature will be implemented in a future update.
        </p>
        <p className="text-xs text-[#6B7280]">
          For now, use the "Upload Images" tab to add your own character images.
        </p>
      </div>
    </div>
  );
}

