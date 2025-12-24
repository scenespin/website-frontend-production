'use client';

import React from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { CharacterOutfitSelector } from './CharacterOutfitSelector';

interface Character {
  id: string;
  name: string;
}

interface PronounMappingSectionProps {
  pronouns: string[];
  characters: Character[];
  selectedCharacters?: string[]; // Pre-selected characters (e.g., from auto-detection)
  pronounMappings: Record<string, string | string[]>; // { "she": "char-123", "they": ["char-123", "char-456"] }
  onPronounMappingChange: (pronoun: string, characterId: string | string[] | undefined) => void;
  onCharacterSelectionChange?: (characterIds: string[]) => void; // Optional: to auto-select characters when mapped
  maxTotalCharacters?: number; // Maximum total characters allowed (default: 5)
  // Props for showing character images for singular pronouns
  shotSlot?: number;
  characterHeadshots?: Record<string, Array<{ poseId?: string; s3Key: string; imageUrl: string; label?: string; priority?: number; outfitName?: string }>>;
  loadingHeadshots?: Record<string, boolean>;
  selectedCharacterReferences?: Record<number, { poseId?: string; s3Key?: string; imageUrl?: string }>;
  characterOutfits?: Record<string, string>;
  onCharacterReferenceChange?: (shotSlot: number, reference: { poseId?: string; s3Key?: string; imageUrl?: string } | undefined) => void;
  onCharacterOutfitChange?: (characterId: string, outfitName: string | undefined) => void;
}

export function PronounMappingSection({
  pronouns,
  characters,
  selectedCharacters = [],
  pronounMappings,
  onPronounMappingChange,
  onCharacterSelectionChange,
  maxTotalCharacters = 5,
  shotSlot,
  characterHeadshots = {},
  loadingHeadshots = {},
  selectedCharacterReferences = {},
  characterOutfits = {},
  onCharacterReferenceChange,
  onCharacterOutfitChange
}: PronounMappingSectionProps) {
  // Plural pronouns that can map to multiple characters
  const pluralPronouns = ['they', 'them', 'their', 'theirs'];
  
  // Separate singular and plural pronouns
  const singularPronouns = pronouns.filter(p => !pluralPronouns.includes(p.toLowerCase()));
  const pluralPronounsList = pronouns.filter(p => pluralPronouns.includes(p.toLowerCase()));
  
  // Get all mapped character IDs (flattening arrays for plural pronouns)
  const getAllMappedCharacterIds = (): string[] => {
    const allIds = new Set<string>();
    Object.values(pronounMappings).forEach(value => {
      if (Array.isArray(value)) {
        value.forEach(id => allIds.add(id));
      } else if (value) {
        allIds.add(value);
      }
    });
    return Array.from(allIds);
  };
  
  // Auto-select characters when they're mapped via dropdowns (if callback provided)
  React.useEffect(() => {
    if (onCharacterSelectionChange) {
      const mappedCharacterIds = getAllMappedCharacterIds();
      if (mappedCharacterIds.length > 0) {
        // Merge with pre-selected characters (e.g., from auto-detection of mentioned characters)
        const merged = [...new Set([...selectedCharacters, ...mappedCharacterIds])];
        // Only update if selection changed
        const currentSelection = selectedCharacters || [];
        if (merged.length !== currentSelection.length || 
            !merged.every(id => currentSelection.includes(id))) {
          onCharacterSelectionChange(merged);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Object.keys(pronounMappings).join(','), Object.values(pronounMappings).map(v => Array.isArray(v) ? v.join(',') : v).join(',')]); // Trigger when mappings change

  const allMapped = pronouns.every(p => {
    const mapping = pronounMappings[p.toLowerCase()];
    return mapping && (Array.isArray(mapping) ? mapping.length > 0 : true);
  });
  
  // Get available characters for selection (excluding already selected ones, up to maxTotalCharacters)
  const getAvailableCharacters = (currentMapping: string | string[] | undefined): Character[] => {
    const allMappedIds = getAllMappedCharacterIds();
    const currentIds = Array.isArray(currentMapping) ? currentMapping : (currentMapping ? [currentMapping] : []);
    
    // Calculate how many characters are already mapped (excluding current pronoun's mapping)
    const otherMappedIds = allMappedIds.filter(id => !currentIds.includes(id));
    const remainingSlots = maxTotalCharacters - otherMappedIds.length;
    
    // Filter out characters that are already mapped (unless they're in the current mapping)
    return characters.filter(char => {
      // Always show characters that are in the current mapping
      if (currentIds.includes(char.id)) return true;
      // Show available characters if we have remaining slots
      return !otherMappedIds.includes(char.id) && remainingSlots > 0;
    });
  };

  return (
    <div className="space-y-3">
      {/* Warning Message */}
      <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-medium text-yellow-200">
            Pronouns detected: "{pronouns.join('", "')}"
          </p>
          <p className="text-[10px] text-yellow-300/80 mt-1">
            Please map each pronoun to a character below.
          </p>
        </div>
      </div>

      {/* Pronoun Mapping Dropdowns */}
      <div className="space-y-3">
        <div className="text-xs font-medium text-[#FFFFFF] mb-2">
          Map Pronouns to Characters (up to {maxTotalCharacters} total)
        </div>
        
        {/* Singular Pronouns Section */}
        {singularPronouns.length > 0 && (
          <div className="space-y-3 pb-3 border-b border-[#3F3F46]">
            <div className="text-[10px] font-medium text-[#808080] uppercase tracking-wide mb-2">
              Singular Pronouns
            </div>
            {singularPronouns.map((pronoun) => {
              const pronounLower = pronoun.toLowerCase();
              const mapping = pronounMappings[pronounLower];
              const mappedCharacterId = Array.isArray(mapping) ? mapping[0] : mapping;
              const availableChars = getAvailableCharacters(mapping);
              
              return (
                <div key={pronoun} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-[#808080] min-w-[60px]">
                      "{pronoun}"
                    </label>
                    {/* Single-select dropdown for singular pronouns */}
                    <select
                      value={mappedCharacterId || ''}
                      onChange={(e) => {
                        const characterId = e.target.value || undefined;
                        onPronounMappingChange(pronounLower, characterId);
                      }}
                      className="flex-1 px-3 py-1.5 bg-[#1A1A1A] border border-[#3F3F46] rounded text-xs text-[#FFFFFF] hover:border-[#808080] focus:border-[#DC143C] focus:outline-none transition-colors"
                    >
                      <option value="">-- Select character --</option>
                      {availableChars.map((char) => (
                        <option key={char.id} value={char.id}>
                          {char.name}
                        </option>
                      ))}
                    </select>
                    {mappedCharacterId && (
                      <span className="text-[10px] text-[#808080]">
                        ✓ {characters.find(c => c.id === mappedCharacterId)?.name}
                      </span>
                    )}
                  </div>
                  
                  {/* Show character images for singular pronouns when mapped */}
                  {mappedCharacterId && shotSlot !== undefined && onCharacterReferenceChange && (
                    <div className="ml-[76px] space-y-2 pt-2 border-t border-[#3F3F46]">
                      {(() => {
                        const char = characters.find(c => c.id === mappedCharacterId);
                        if (!char) return null;
                        
                        const headshots = characterHeadshots[mappedCharacterId] || [];
                        const selectedHeadshot = selectedCharacterReferences[shotSlot];
                        const selectedOutfit = characterOutfits[mappedCharacterId];
                        
                        return (
                          <>
                            {/* Outfit Selector */}
                            {onCharacterOutfitChange && (
                              <CharacterOutfitSelector
                                characterId={char.id}
                                characterName={char.name}
                                availableOutfits={char.availableOutfits || []}
                                defaultOutfit={char.defaultOutfit}
                                selectedOutfit={selectedOutfit}
                                onOutfitChange={(charId, outfitName) => {
                                  onCharacterOutfitChange(charId, outfitName || undefined);
                                }}
                              />
                            )}
                            
                            {/* Headshots */}
                            {loadingHeadshots[mappedCharacterId] ? (
                              <div className="text-[10px] text-[#808080]">Loading headshots...</div>
                            ) : headshots.length > 0 ? (
                              <div>
                                {selectedOutfit && selectedOutfit !== 'default' && (
                                  <div className="text-[10px] text-[#808080] mb-1.5">
                                    Outfit: <span className="text-[#DC143C] font-medium">{selectedOutfit}</span>
                                  </div>
                                )}
                                <div className="grid grid-cols-6 gap-1.5">
                                  {headshots.map((headshot, idx) => {
                                    const uniqueKey = headshot.s3Key || headshot.imageUrl || `${headshot.poseId || 'unknown'}-${idx}`;
                                    const isSelected = selectedHeadshot && (
                                      (headshot.s3Key && selectedHeadshot.s3Key === headshot.s3Key) ||
                                      (headshot.imageUrl && selectedHeadshot.imageUrl === headshot.imageUrl) ||
                                      (!headshot.s3Key && !headshot.imageUrl && headshot.poseId && selectedHeadshot.poseId === headshot.poseId)
                                    );
                                    
                                    return (
                                      <button
                                        key={uniqueKey}
                                        onClick={() => {
                                          const newRef = isSelected ? undefined : {
                                            poseId: headshot.poseId,
                                            s3Key: headshot.s3Key,
                                            imageUrl: headshot.imageUrl
                                          };
                                          onCharacterReferenceChange(shotSlot, newRef);
                                        }}
                                        className={`relative aspect-square rounded border-2 transition-all ${
                                          isSelected
                                            ? 'border-[#DC143C] ring-2 ring-[#DC143C]/50'
                                            : 'border-[#3F3F46] hover:border-[#808080]'
                                        }`}
                                      >
                                        {headshot.imageUrl && (
                                          <img
                                            src={headshot.imageUrl}
                                            alt={headshot.label || `Headshot ${idx + 1}`}
                                            className="w-full h-full object-cover rounded"
                                          />
                                        )}
                                        {isSelected && (
                                          <div className="absolute inset-0 flex items-center justify-center bg-[#DC143C]/20">
                                            <Check className="w-3 h-3 text-[#DC143C]" />
                                          </div>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="text-[10px] text-[#808080]">
                                No headshots available
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Plural Pronouns Section */}
        {pluralPronounsList.length > 0 && (
          <div className="space-y-3">
            <div className="text-[10px] font-medium text-[#808080] uppercase tracking-wide mb-2">
              Plural Pronouns
            </div>
            {pluralPronounsList.map((pronoun) => {
              const pronounLower = pronoun.toLowerCase();
              const mapping = pronounMappings[pronounLower];
              const mappedCharacterIds = Array.isArray(mapping) ? mapping : (mapping ? [mapping] : []);
              const availableChars = getAvailableCharacters(mapping);
              const allMappedIds = getAllMappedCharacterIds();
              // Calculate remaining slots: total allowed minus all other mapped characters (excluding this pronoun's current mappings)
              const otherMappedIds = allMappedIds.filter(id => !mappedCharacterIds.includes(id));
              const remainingSlots = maxTotalCharacters - otherMappedIds.length;
              
              return (
                <div key={pronoun} className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-[#808080] min-w-[60px]">
                      "{pronoun}"
                      <span className="text-[10px] text-[#DC143C] ml-1">(plural)</span>
                    </label>
                    {/* Checkbox-based multi-select for plural pronouns */}
                    <div className="flex-1 space-y-2">
                      <div className="bg-[#1A1A1A] border border-[#3F3F46] rounded p-2 space-y-1.5 max-h-32 overflow-y-auto">
                        {availableChars.length > 0 ? (
                          availableChars.map((char) => {
                            const isSelected = mappedCharacterIds.includes(char.id);
                            const canSelect = isSelected || remainingSlots > 0;
                            
                            return (
                              <label
                                key={char.id}
                                className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors ${
                                  canSelect
                                    ? 'hover:bg-[#3F3F46]'
                                    : 'opacity-50 cursor-not-allowed'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={!canSelect}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      // Add character - only if we have remaining slots
                                      if (remainingSlots > 0) {
                                        const newIds = [...mappedCharacterIds, char.id];
                                        // Double-check we're not exceeding the limit
                                        const otherMappedIds = allMappedIds.filter(id => !mappedCharacterIds.includes(id));
                                        const totalAfterAdd = otherMappedIds.length + newIds.length;
                                        if (totalAfterAdd <= maxTotalCharacters) {
                                          onPronounMappingChange(pronounLower, newIds);
                                        }
                                      }
                                    } else {
                                      // Remove character - always allowed
                                      const newIds = mappedCharacterIds.filter(id => id !== char.id);
                                      onPronounMappingChange(pronounLower, newIds.length > 0 ? newIds : undefined);
                                    }
                                  }}
                                  className="w-3.5 h-3.5 text-[#DC143C] rounded border-[#3F3F46] focus:ring-[#DC143C] focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed"
                                />
                                <span className="text-xs text-[#FFFFFF] flex-1">{char.name}</span>
                                {isSelected && (
                                  <span className="text-[10px] text-[#DC143C]">✓</span>
                                )}
                              </label>
                            );
                          })
                        ) : (
                          <div className="text-xs text-[#808080] px-2 py-1">
                            No available characters (max {maxTotalCharacters} reached)
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] text-[#808080] flex items-center justify-between">
                        <span>
                          {mappedCharacterIds.length > 0 ? (
                            <>✓ Selected: {mappedCharacterIds.map(id => characters.find(c => c.id === id)?.name).filter(Boolean).join(', ')}</>
                          ) : (
                            <>Select one or more characters</>
                          )}
                        </span>
                        {remainingSlots > 0 && (
                          <span className="text-[#DC143C]">
                            {remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining
                          </span>
                        )}
                        {remainingSlots <= 0 && allMappedIds.length >= maxTotalCharacters && (
                          <span className="text-yellow-500">Max {maxTotalCharacters} characters reached</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completion Status */}
      {allMapped && (
        <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-2 flex items-center gap-2">
          <span className="text-[10px] text-green-300">
            ✓ All pronouns mapped
          </span>
        </div>
      )}
    </div>
  );
}

