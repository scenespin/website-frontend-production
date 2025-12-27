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

  // Initialize with selectedOutfit or default to first available outfit (not "All Outfits")
  useEffect(() => {
    const outfitsArray = availableOutfits || [];
    
    if (selectedOutfit && selectedOutfit !== 'default') {
      // Check if it's a preset outfit
      const isPreset = outfitsArray.includes(selectedOutfit);
      if (isPreset) {
        setLocalSelectedOutfit(selectedOutfit);
      } else {
        // If not a preset, default to first available or default outfit
        const initialOutfit = defaultOutfit && outfitsArray.includes(defaultOutfit)
          ? defaultOutfit
          : (outfitsArray.length > 0 ? outfitsArray[0] : 'default');
        setLocalSelectedOutfit(initialOutfit);
        // Auto-select if we had to change it
        if (initialOutfit !== 'default') {
          onOutfitChange(characterId, initialOutfit);
        }
      }
    } else {
      // If selectedOutfit is undefined, default to first available or default outfit
      const initialOutfit = defaultOutfit && outfitsArray.includes(defaultOutfit)
        ? defaultOutfit
        : (outfitsArray.length > 0 ? outfitsArray[0] : 'default');
      setLocalSelectedOutfit(initialOutfit);
      // Auto-select if we had to change it
      if (initialOutfit !== 'default' && outfitsArray.length > 0) {
        onOutfitChange(characterId, initialOutfit);
      }
    }
  }, [selectedOutfit, availableOutfits, defaultOutfit, characterId, onOutfitChange]);

  const handleOutfitChange = (value: string) => {
    // Require a specific outfit - "All Outfits" is not allowed as final selection
    // This ensures only one outfit's images are sent, not all images
    setLocalSelectedOutfit(value);
    onOutfitChange(characterId, value); // specific outfit name
  };

  // Determine if we should show dropdown or just display
  // Use actual prop value, not default parameter, to detect if data has loaded
  const outfitsArray = Array.isArray(availableOutfits) ? availableOutfits : [];
  const hasMultipleOutfits = outfitsArray.length > 1;
  const hasAnyOutfits = outfitsArray.length > 0 || !!defaultOutfit;
  
  // Show dropdown if we have any outfits (allows switching between outfits, including "All")
  // Always show dropdown when outfits exist, even if just one (allows "All" option)
  const shouldShowDropdown = hasAnyOutfits;

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
              value={localSelectedOutfit === 'default' ? (defaultOutfit || outfitsArray[0] || '') : localSelectedOutfit}
              onChange={(e) => handleOutfitChange(e.target.value)}
              className="flex-1 px-2 py-1 bg-[#141414] border border-[#3F3F46] rounded text-xs text-[#FFFFFF] focus:outline-none focus:ring-1 focus:ring-[#DC143C]"
              required
            >
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
            value={localSelectedOutfit === 'default' ? (defaultOutfit || outfitsArray[0] || '') : localSelectedOutfit}
            onChange={(e) => handleOutfitChange(e.target.value)}
            className="w-full px-3 py-2 bg-[#141414] border border-[#3F3F46] rounded-lg text-xs text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#DC143C]"
            required
          >
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

