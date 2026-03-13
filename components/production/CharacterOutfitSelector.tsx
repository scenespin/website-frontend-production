'use client';

/**
 * CharacterOutfitSelector - Per-Character Outfit Selection
 * 
 * Displays outfit selector for a single character in Scene Builder
 * Shows available outfits from character's Production Hub references
 * Allows selection of default outfit or custom outfit entry
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';
import { canonicalOutfitName, canonicalToDisplay } from '@/utils/outfitUtils';

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
  const normalizedOutfitOptions = useMemo(() => {
    const map = new Map<string, string>();
    availableOutfits.forEach((outfit) => {
      const canonical = canonicalOutfitName(outfit || '');
      if (!canonical || canonical === 'default') return;
      if (!map.has(canonical)) {
        map.set(canonical, canonicalToDisplay(canonical, outfit));
      }
    });
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [availableOutfits]);

  const normalizedDefaultOutfit = useMemo(() => {
    const canonical = canonicalOutfitName(defaultOutfit || '');
    return canonical && canonical !== 'default' ? canonical : undefined;
  }, [defaultOutfit]);

  const [localSelectedOutfit, setLocalSelectedOutfit] = useState<string>(canonicalOutfitName(selectedOutfit || 'default') || 'default');

  // Initialize with selectedOutfit or default to first available outfit (not "All Outfits")
  useEffect(() => {
    const outfitsArray = normalizedOutfitOptions.map((o) => o.value);
    
    // If no outfits available, don't try to set one (will show "No outfits available" message)
    if (outfitsArray.length === 0 && !defaultOutfit) {
      setLocalSelectedOutfit('default');
      // Don't call onOutfitChange - let it remain undefined so backend uses default references
      return;
    }
    
    const normalizedSelected = canonicalOutfitName(selectedOutfit || 'default');
    if (normalizedSelected && normalizedSelected !== 'default') {
      // Check if it's a preset outfit
      const isPreset = outfitsArray.includes(normalizedSelected);
      if (isPreset) {
        setLocalSelectedOutfit(normalizedSelected);
      } else {
        // If not a preset, default to first available or default outfit
        const initialOutfit = normalizedDefaultOutfit && outfitsArray.includes(normalizedDefaultOutfit)
          ? normalizedDefaultOutfit
          : (outfitsArray.length > 0 ? outfitsArray[0] : 'default');
        setLocalSelectedOutfit(initialOutfit);
        // Auto-select if we had to change it
        if (initialOutfit !== 'default') {
          onOutfitChange(characterId, initialOutfit);
        }
      }
    } else {
      // If selectedOutfit is undefined, default to first available or default outfit
      const initialOutfit = normalizedDefaultOutfit && outfitsArray.includes(normalizedDefaultOutfit)
        ? normalizedDefaultOutfit
        : (outfitsArray.length > 0 ? outfitsArray[0] : 'default');
      setLocalSelectedOutfit(initialOutfit);
      // Auto-select if we had to change it
      if (initialOutfit !== 'default' && outfitsArray.length > 0) {
        onOutfitChange(characterId, initialOutfit);
      }
    }
  }, [selectedOutfit, normalizedOutfitOptions, normalizedDefaultOutfit, characterId, onOutfitChange]);

  const handleOutfitChange = (value: string) => {
    // Require a specific outfit - "All Outfits" is not allowed as final selection
    // This ensures only one outfit's images are sent, not all images
    // Only call onOutfitChange if we have outfits available
    const outfitsArray = normalizedOutfitOptions.map((o) => o.value);
    if (outfitsArray.length > 0 || defaultOutfit) {
      const normalizedValue = canonicalOutfitName(value || '');
      setLocalSelectedOutfit(normalizedValue || 'default');
      onOutfitChange(characterId, normalizedValue || undefined); // specific outfit name
    }
    // If no outfits available, do nothing (will show "No outfits available" message)
  };

  // Determine if we should show dropdown or just display
  // Use actual prop value, not default parameter, to detect if data has loaded
  const outfitsArray = normalizedOutfitOptions.map((o) => o.value);
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
              value={localSelectedOutfit === 'default' ? (normalizedDefaultOutfit || outfitsArray[0] || '') : localSelectedOutfit}
              onChange={(e) => handleOutfitChange(e.target.value)}
              className="flex-1 px-2 py-1 bg-[#141414] border border-[#3F3F46] rounded text-xs text-[#FFFFFF] focus:outline-none focus:ring-1 focus:ring-[#DC143C]"
              required
            >
              {normalizedOutfitOptions.map((outfit) => (
                <option key={outfit.value} value={outfit.value}>
                  {outfit.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-[#808080]">
              {canonicalToDisplay(normalizedDefaultOutfit || outfitsArray[0] || '', defaultOutfit || outfitsArray[0] || '') || 'No outfit set'}
            </span>
          )
        ) : (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-[#808080] italic">
              No outfits available
            </span>
            <span className="text-[10px] text-[#3F3F46]">
              Character setup incomplete. Default references will be used.
            </span>
          </div>
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
            <span className="text-[10px] text-[#3F3F46]">(Default: {canonicalToDisplay(normalizedDefaultOutfit || defaultOutfit, defaultOutfit)})</span>
          )}
        </Label>
      )}
      
      {hasAnyOutfits ? (
        shouldShowDropdown ? (
          // Multiple outfits - show dropdown
          <select
            value={localSelectedOutfit === 'default' ? (normalizedDefaultOutfit || outfitsArray[0] || '') : localSelectedOutfit}
            onChange={(e) => handleOutfitChange(e.target.value)}
            className="w-full px-3 py-2 bg-[#141414] border border-[#3F3F46] rounded-lg text-xs text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#DC143C]"
            required
          >
            {normalizedOutfitOptions.map((outfit) => (
              <option key={outfit.value} value={outfit.value}>
                {outfit.label}
              </option>
            ))}
          </select>
        ) : (
          // Single outfit - show as read-only
          <div className="px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg text-xs text-[#808080]">
            {canonicalToDisplay(normalizedDefaultOutfit || outfitsArray[0] || '', defaultOutfit || outfitsArray[0] || '') || 'No outfit set'}
          </div>
        )
      ) : (
        // No outfits available
        <div className="px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg">
          <div className="text-xs text-[#808080] mb-1">
            No outfits available
          </div>
          <div className="text-[10px] text-[#3F3F46]">
            Character setup incomplete. Default references will be used for this shot.
          </div>
        </div>
      )}
    </div>
  );
}

