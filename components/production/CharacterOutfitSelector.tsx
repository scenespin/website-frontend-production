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
    const outfitsArray = availableOutfits || [];
    
    if (selectedOutfit && selectedOutfit !== 'default') {
      // Check if it's a preset outfit
      const isPreset = outfitsArray.includes(selectedOutfit);
      if (isPreset) {
        setLocalSelectedOutfit(selectedOutfit);
      } else {
        // If not a preset, use default or first available
        if (defaultOutfit && outfitsArray.includes(defaultOutfit)) {
          setLocalSelectedOutfit('default');
        } else if (outfitsArray.length > 0) {
          setLocalSelectedOutfit(outfitsArray[0]);
        } else {
          setLocalSelectedOutfit('default');
        }
      }
    } else if (defaultOutfit && outfitsArray.includes(defaultOutfit)) {
      // Use default outfit if available
      setLocalSelectedOutfit('default');
    } else if (outfitsArray.length > 0) {
      // Auto-select first outfit if no default is set
      setLocalSelectedOutfit(outfitsArray[0]);
    } else {
      setLocalSelectedOutfit('default');
    }
  }, [selectedOutfit, availableOutfits, defaultOutfit]);

  const handleOutfitChange = (value: string) => {
    setLocalSelectedOutfit(value);
    if (value === 'default') {
      onOutfitChange(characterId, undefined); // undefined means use default
    } else {
      onOutfitChange(characterId, value);
    }
  };

  // Determine if we should show dropdown or just display
  // Use actual prop value, not default parameter, to detect if data has loaded
  const outfitsArray = Array.isArray(availableOutfits) ? availableOutfits : [];
  const hasMultipleOutfits = outfitsArray.length > 1;
  const hasAnyOutfits = outfitsArray.length > 0 || !!defaultOutfit;
  
  // Force dropdown if we have multiple outfits (even if defaultOutfit exists)
  const shouldShowDropdown = hasMultipleOutfits && hasAnyOutfits;
  
  // Debug logging
  useEffect(() => {
    console.log(`[CharacterOutfitSelector] ${characterName}:`, {
      availableOutfits,
      availableOutfitsProp: availableOutfits, // Show actual prop value
      outfitsArray,
      outfitsArrayLength: outfitsArray.length,
      defaultOutfit,
      hasMultipleOutfits,
      hasAnyOutfits,
      willShowDropdown: hasAnyOutfits && hasMultipleOutfits,
      willShowNoOutfits: !hasAnyOutfits
    });
  }, [characterName, availableOutfits, defaultOutfit, hasMultipleOutfits, hasAnyOutfits, outfitsArray]);

  // Log what will be rendered
  useEffect(() => {
    if (hasAnyOutfits && hasMultipleOutfits) {
      console.log(`[CharacterOutfitSelector] ${characterName} RENDERING: Dropdown with ${outfitsArray.length} outfits`);
    } else if (hasAnyOutfits && !hasMultipleOutfits) {
      console.log(`[CharacterOutfitSelector] ${characterName} RENDERING: Single outfit display`);
    } else {
      console.warn(`[CharacterOutfitSelector] ${characterName} RENDERING: "No outfits available" message (hasAnyOutfits=${hasAnyOutfits}, outfitsArray.length=${outfitsArray.length})`);
    }
  }, [characterName, hasAnyOutfits, hasMultipleOutfits, outfitsArray.length]);

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
        shouldShowDropdown ? (
          // Multiple outfits - show dropdown
          <select
            value={localSelectedOutfit}
            onChange={(e) => handleOutfitChange(e.target.value)}
            className="w-full px-3 py-2 bg-[#141414] border border-[#3F3F46] rounded-lg text-xs text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#DC143C]"
          >
            {defaultOutfit ? (
              <option value="default">
                Use Default ({defaultOutfit})
              </option>
            ) : null}
            {outfitsArray.map((outfit) => (
              <option key={outfit} value={outfit}>
                {outfit}
              </option>
            ))}
          </select>
        ) : (
          // Single outfit - show as read-only
          <div className="px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg text-xs text-[#808080]">
            {defaultOutfit || outfitsArray[0] || 'No outfit set'}
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

