'use client';

/**
 * CharacterOutfitSelector - Per-Character Outfit Selection
 * 
 * Displays outfit selector for a single character in Scene Builder
 * Shows available outfits from character's Production Hub references
 * Allows selection of default outfit or custom outfit entry
 */

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';

interface CharacterOutfitSelectorProps {
  characterId: string;
  characterName: string;
  availableOutfits?: string[];
  defaultOutfit?: string;
  selectedOutfit?: string;
  onOutfitChange: (characterId: string, outfitName: string | undefined) => void;
  className?: string;
}

export function CharacterOutfitSelector({
  characterId,
  characterName,
  availableOutfits = [],
  defaultOutfit,
  selectedOutfit,
  onOutfitChange,
  className = ''
}: CharacterOutfitSelectorProps) {
  const [localSelectedOutfit, setLocalSelectedOutfit] = useState<string>(selectedOutfit || 'default');

  // Initialize with selectedOutfit or default
  useEffect(() => {
    if (selectedOutfit && selectedOutfit !== 'default') {
      // Check if it's a preset outfit
      const isPreset = availableOutfits.includes(selectedOutfit);
      if (isPreset) {
        setLocalSelectedOutfit(selectedOutfit);
      } else {
        // If not a preset, use default
        setLocalSelectedOutfit('default');
      }
    } else {
      setLocalSelectedOutfit('default');
    }
  }, [selectedOutfit, availableOutfits]);

  const handleOutfitChange = (value: string) => {
    setLocalSelectedOutfit(value);
    if (value === 'default') {
      onOutfitChange(characterId, undefined); // undefined means use default
    } else {
      onOutfitChange(characterId, value);
    }
  };

  // Determine if we should show dropdown or just display
  const hasMultipleOutfits = availableOutfits.length > 1;
  const hasAnyOutfits = availableOutfits.length > 0 || defaultOutfit;

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-xs font-medium text-[#808080] flex items-center gap-1.5">
        <Users className="w-3 h-3" />
        <span>{characterName}</span>
        {defaultOutfit && (
          <span className="text-[10px] text-[#3F3F46]">(Default: {defaultOutfit})</span>
        )}
      </Label>
      
      {hasAnyOutfits ? (
        hasMultipleOutfits ? (
          // Multiple outfits - show dropdown
          <select
            value={localSelectedOutfit}
            onChange={(e) => handleOutfitChange(e.target.value)}
            className="w-full px-3 py-2 bg-[#141414] border border-[#3F3F46] rounded-lg text-xs text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#DC143C]"
          >
            <option value="default">
              Use Default {defaultOutfit ? `(${defaultOutfit})` : ''}
            </option>
            {availableOutfits.map((outfit) => (
              <option key={outfit} value={outfit}>
                {outfit}
              </option>
            ))}
          </select>
        ) : (
          // Single outfit - show as read-only
          <div className="px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg text-xs text-[#808080]">
            {defaultOutfit || availableOutfits[0] || 'No outfit set'}
          </div>
        )
      ) : (
        // No outfits available
        <div className="px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg text-xs text-[#808080]">
          No outfits available - using default references
        </div>
      )}
    </div>
  );
}

