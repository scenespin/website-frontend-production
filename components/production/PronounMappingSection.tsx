'use client';

import React from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { CharacterOutfitSelector } from './CharacterOutfitSelector';
import { isValidCharacterId, filterValidCharacterIds } from './utils/characterIdValidation';

interface Character {
  id: string;
  name: string;
  availableOutfits?: string[];
  defaultOutfit?: string;
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
  selectedCharacterReferences?: Record<number, Record<string, { poseId?: string; s3Key?: string; imageUrl?: string }>>;
  characterOutfits?: Record<number, Record<string, string>>; // Per-shot, per-character: shotSlot -> characterId -> outfitName
  onCharacterReferenceChange?: (shotSlot: number, characterId: string, reference: { poseId?: string; s3Key?: string; imageUrl?: string } | undefined) => void;
  onCharacterOutfitChange?: (shotSlot: number, characterId: string, outfitName: string | undefined) => void;
  // Additional character sources with full data (including outfits)
  allCharactersWithOutfits?: any[]; // Characters from sceneAnalysisResult or allCharacters with outfit data
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
  onCharacterOutfitChange,
  allCharactersWithOutfits = []
}: PronounMappingSectionProps) {
  // Get outfit for a character in this shot
  const getOutfitForCharacter = (charId: string): string | undefined => {
    return characterOutfits[shotSlot]?.[charId];
  };
  
  // Helper to get character with outfit data (prefer characters with outfit data)
  const getCharacterWithOutfits = (characterId: string): Character | null => {
    // First, try to find character in allCharactersWithOutfits (should have outfit data from sceneAnalysisResult)
    let char: any = null;
    if (allCharactersWithOutfits && allCharactersWithOutfits.length > 0) {
      char = allCharactersWithOutfits.find((c: any) => c.id === characterId);
    }
    if (!char) {
      char = characters.find(c => c.id === characterId);
    }
    
    if (!char) return null;
    
    // If character doesn't have availableOutfits but has headshots, extract outfits from headshots
    if ((!char.availableOutfits || char.availableOutfits.length === 0) && characterHeadshots[characterId]) {
      const headshots = characterHeadshots[characterId] || [];
      const outfitSet = new Set<string>();
      headshots.forEach((headshot: any) => {
        const outfitName = headshot.outfitName || headshot.metadata?.outfitName;
        if (outfitName && outfitName !== 'default') {
          outfitSet.add(outfitName);
        }
      });
      const extractedOutfits = Array.from(outfitSet).sort();
      if (extractedOutfits.length > 0) {
        return {
          ...char,
          availableOutfits: extractedOutfits
        };
      }
    }
    
    return char;
  };
  // Plural pronouns that can map to multiple characters
  const pluralPronouns = ['they', 'them', 'their', 'theirs'];
  
  // Separate singular and plural pronouns
  const singularPronouns = pronouns.filter(p => !pluralPronouns.includes(p.toLowerCase()));
  const pluralPronounsList = pronouns.filter(p => pluralPronouns.includes(p.toLowerCase()));
  
  // Get all mapped character IDs (flattening arrays for plural pronouns)
  // Exclude invalid IDs like '__ignore__'
  const getAllMappedCharacterIds = (): string[] => {
    const allIds = new Set<string>();
    Object.values(pronounMappings).forEach(value => {
      if (Array.isArray(value)) {
        value.forEach(id => {
          if (isValidCharacterId(id)) allIds.add(id);
        });
      } else if (isValidCharacterId(value)) {
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
    // Consider a pronoun mapped if:
    // 1. It's mapped to a character (string or array with length > 0)
    // 2. It's explicitly skipped (__ignore__)
    if (mapping === '__ignore__') return true;
    return mapping && (Array.isArray(mapping) ? mapping.length > 0 : true);
  });
  
  // Get available characters for selection (excluding already selected ones, up to maxTotalCharacters)
  // For singular pronouns: allow same character for multiple pronouns (e.g., "she" and "her" can both map to SARAH)
  // For plural pronouns: respect the 5 unique character limit
  const getAvailableCharacters = (currentMapping: string | string[] | undefined, isSingular: boolean = false): Character[] => {
    const allMappedIds = getAllMappedCharacterIds(); // Unique character IDs across all pronouns
    const currentIds = Array.isArray(currentMapping) ? currentMapping : (currentMapping ? [currentMapping] : []);
    
    // Calculate how many unique characters are already mapped (excluding current pronoun's mapping)
    const otherMappedIds = allMappedIds.filter(id => !currentIds.includes(id));
    const remainingSlots = maxTotalCharacters - otherMappedIds.length;
    
    // Filter characters based on pronoun type
    return characters.filter(char => {
      // Always show characters that are in the current mapping
      if (currentIds.includes(char.id)) return true;
      
      // For singular pronouns: allow selecting characters already mapped to other singular pronouns
      // (multiple singular pronouns can refer to the same character)
      if (isSingular) {
        // Still respect the 5 unique character limit
        return remainingSlots > 0 || otherMappedIds.includes(char.id);
      }
      
      // For plural pronouns: allow selecting characters already in singular pronouns
      // (same character can be in both singular and plural pronouns, e.g., "her" → SARAH, "they" → [SARAH, RIVERA])
      // Still respect the 5 unique character limit
      return remainingSlots > 0 || otherMappedIds.includes(char.id);
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
              const availableChars = getAvailableCharacters(mapping, true); // true = isSingular
              
              // Check if pronoun is ignored
              const isIgnored = mappedCharacterId === '__ignore__';
              
              // Get character with outfit data from the enriched source
              const mappedChar = mappedCharacterId && !isIgnored ? getCharacterWithOutfits(mappedCharacterId) : null;
              const selectedOutfit = mappedCharacterId && !isIgnored ? getOutfitForCharacter(mappedCharacterId) : undefined;
              
              return (
                <div key={pronoun} className="space-y-2 pb-2 border-b border-[#3F3F46] last:border-b-0">
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-[#808080] min-w-[60px]">
                      "{pronoun}"
                    </label>
                    {/* Single-select dropdown for singular pronouns */}
                    <select
                      value={mappedCharacterId || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Special value "__ignore__" means user wants to ignore this pronoun
                        const characterId = value === '__ignore__' ? '__ignore__' : (value || undefined);
                        onPronounMappingChange(pronounLower, characterId);
                      }}
                      className="flex-1 px-3 py-1.5 bg-[#1A1A1A] border border-[#3F3F46] rounded text-xs text-[#FFFFFF] hover:border-[#808080] focus:border-[#DC143C] focus:outline-none transition-colors"
                    >
                      <option value="">-- Select character --</option>
                      <option value="__ignore__">-- Skip mapping --</option>
                      {availableChars.map((char) => (
                        <option key={char.id} value={char.id}>
                          {char.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Show "Skipped mapping" message if user chose to skip */}
                  {isIgnored && (
                    <div className="ml-[76px] pt-2">
                      <div className="text-[10px] text-[#808080] italic">
                        This pronoun will be handled automatically by the AI.
                      </div>
                    </div>
                  )}
                  
                  {/* Show character name and outfit selector when mapped */}
                  {mappedChar && (() => {
                    const hasAnyOutfits = (mappedChar.availableOutfits?.length || 0) > 0 || !!mappedChar.defaultOutfit;
                    return (
                      <div className="ml-[76px] pt-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-xs font-medium text-[#FFFFFF]">
                            {mappedChar.name}
                          </div>
                          {/* Outfit Selector - inline with character name when outfits exist */}
                          {onCharacterOutfitChange && hasAnyOutfits && (
                            <CharacterOutfitSelector
                              characterId={mappedChar.id}
                              characterName={mappedChar.name}
                              availableOutfits={mappedChar.availableOutfits || []}
                              defaultOutfit={mappedChar.defaultOutfit}
                              selectedOutfit={selectedOutfit}
                              onOutfitChange={(charId, outfitName) => {
                                onCharacterOutfitChange(shotSlot, charId, outfitName || undefined);
                              }}
                              compact={true}
                              hideLabel={true}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })()}
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
              const isIgnored = mapping === '__ignore__';
              const mappedCharacterIds = isIgnored ? [] : (Array.isArray(mapping) ? mapping : (mapping ? [mapping] : []));
              const availableChars = getAvailableCharacters(mapping);
              const allMappedIds = getAllMappedCharacterIds();
              // Calculate remaining slots: total allowed minus all other mapped characters (excluding this pronoun's current mappings)
              const otherMappedIds = allMappedIds.filter(id => !mappedCharacterIds.includes(id));
              const remainingSlots = maxTotalCharacters - otherMappedIds.length;
              
              return (
                <div key={pronoun} className="space-y-2 pb-2 border-b border-[#3F3F46] last:border-b-0">
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-[#808080] min-w-[60px]">
                      "{pronoun}"
                      <span className="text-[10px] text-[#DC143C] ml-1">(plural)</span>
                    </label>
                    {/* Checkbox-based multi-select for plural pronouns */}
                    <div className="flex-1 space-y-2">
                      {/* Ignore button for plural pronouns */}
                      <button
                        type="button"
                        onClick={() => {
                          // Set to "__ignore__" to mark as skipped mapping
                          onPronounMappingChange(pronounLower, '__ignore__');
                        }}
                        className={`w-full px-3 py-1.5 text-xs rounded border transition-colors ${
                          mapping === '__ignore__'
                            ? 'bg-[#3F3F46] border-[#DC143C] text-[#DC143C]'
                            : 'bg-[#1A1A1A] border-[#3F3F46] text-[#808080] hover:border-[#808080] hover:text-[#FFFFFF]'
                        }`}
                      >
                        {mapping === '__ignore__' ? '✓ Skip mapping' : 'Skip mapping'}
                      </button>
                      
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
                          {isIgnored ? (
                            <>This pronoun will be handled automatically by the AI.</>
                          ) : mappedCharacterIds.length > 0 ? (
                            <>✓ Selected: {mappedCharacterIds.map(id => characters.find(c => c.id === id)?.name).filter(Boolean).join(', ')}</>
                          ) : (
                            <>Select one or more characters, or skip mapping</>
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
                  
                  {/* Show character names and outfit selectors when mapped (not ignored) */}
                  {!isIgnored && mappedCharacterIds.length > 0 && (
                    <div className="ml-[76px] space-y-2 pt-2">
                      {mappedCharacterIds.map((charId) => {
                        // Get character with outfit data from the enriched source
                        const char = getCharacterWithOutfits(charId);
                        if (!char) return null;
                        const charOutfit = getOutfitForCharacter(charId);
                        
                        const hasAnyOutfits = (char.availableOutfits?.length || 0) > 0 || !!char.defaultOutfit;
                        return (
                          <div key={charId} className="pb-2 border-b border-[#3F3F46] last:border-b-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="text-xs font-medium text-[#FFFFFF]">
                                {char.name}
                              </div>
                              {/* Outfit Selector - inline with character name when outfits exist */}
                              {onCharacterOutfitChange && hasAnyOutfits && (
                                <CharacterOutfitSelector
                                  characterId={char.id}
                                  characterName={char.name}
                                  availableOutfits={char.availableOutfits || []}
                                  defaultOutfit={char.defaultOutfit}
                                  selectedOutfit={charOutfit}
                                  onOutfitChange={(charId, outfitName) => {
                                    if (onCharacterOutfitChange && shotSlot !== undefined) {
                                      onCharacterOutfitChange(shotSlot, charId, outfitName || undefined);
                                    }
                                  }}
                                  compact={true}
                                  hideLabel={true}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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

