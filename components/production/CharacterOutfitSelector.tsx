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
  hideLabel?: boolean; // If true, don't show the character name label
  compact?: boolean; // If true, use compact inline layout
}

export function CharacterOutfitSelector({
  characterId,
  characterName,
  availableOutfits = [],
  defaultOutfit,
  selectedOutfit,
  onOutfitChange,
  className = '',
  hideLabel = false,
  compact = false
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
    // "default" or "All Outfits" means show all outfits (undefined)
    if (value === 'default') {
      onOutfitChange(characterId, undefined); // undefined means show all outfits
    } else {
      onOutfitChange(characterId, value); // specific outfit name
    }
  };

  // Determine if we should show dropdown or just display
  // Use actual prop value, not default parameter, to detect if data has loaded
  const outfitsArray = Array.isArray(availableOutfits) ? availableOutfits : [];
  const hasMultipleOutfits = outfitsArray.length > 1;
  const hasAnyOutfits = outfitsArray.length > 0 || !!defaultOutfit;
  
  // Show dropdown if we have any outfits (allows switching between outfits, including "All")
  // Always show dropdown when outfits exist, even if just one (allows "All" option)
  const shouldShowDropdown = hasAnyOutfits;
  
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

  // Compact inline layout (name + selector on same line)
  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {!hideLabel && (
          <span className="text-xs font-medium text-[#FFFFFF] whitespace-nowrap">
            {characterName}
          </span>
        )}
        {hasAnyOutfits ? (
          shouldShowDropdown ? (
            <select
              value={localSelectedOutfit}
              onChange={(e) => handleOutfitChange(e.target.value)}
              className="flex-1 px-2 py-1 bg-[#141414] border border-[#3F3F46] rounded text-xs text-[#FFFFFF] focus:outline-none focus:ring-1 focus:ring-[#DC143C]"
            >
              <option value="default">
                All Outfits
              </option>
              {outfitsArray.map((outfit) => (
                <option key={outfit} value={outfit}>
                  {outfit}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-[#808080]">
              {defaultOutfit || outfitsArray[0] || 'No outfit set'}
            </span>
          )
        ) : (
          <span className="text-xs text-[#808080] italic">
            No outfits available
          </span>
        )}
      </div>
    );
  }

  // Default layout (label above selector)
  return (
    <div className={`space-y-2 ${className}`}>
      {!hideLabel && (
        <Label className="text-xs font-medium text-[#808080] flex items-center gap-1.5">
          <Users className="w-3 h-3" />
          <span>{characterName}</span>
          {defaultOutfit && (
            <span className="text-[10px] text-[#3F3F46]">(Default: {defaultOutfit})</span>
          )}
        </Label>
      )}
      
      {hasAnyOutfits ? (
        shouldShowDropdown ? (
          // Multiple outfits - show dropdown
          <select
            value={localSelectedOutfit}
            onChange={(e) => handleOutfitChange(e.target.value)}
            className="w-full px-3 py-2 bg-[#141414] border border-[#3F3F46] rounded-lg text-xs text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#DC143C]"
          >
            <option value="default">
              All Outfits
            </option>
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

