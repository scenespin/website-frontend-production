'use client';

/**
 * UnifiedSceneConfiguration - Phase 1
 * 
 * Single unified component for scene configuration that replaces:
 * - SceneAnalysisPreview
 * - WorkflowRecommendationsPanel
 * - CombinationPreviewCard
 * - Step 2: Configure
 * - Step 3: Review
 * 
 * Phase 1 Features:
 * - Character headshot selection for dialogue shots
 * - Global quality setting
 * - Shot-level checkboxes (auto-select all by default)
 * - Chronological shot order
 * - Hide workflows, show shot types only
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Coins, Clock, ChevronDown, ChevronUp, Film, Sparkles } from 'lucide-react';
import { SceneAnalysisResult } from '@/types/screenplay';
import { CharacterOutfitSelector } from './CharacterOutfitSelector';
import { LocationAngleSelector } from './LocationAngleSelector';
import { CharacterSelector } from './CharacterSelector';
import { PronounMappingSection } from './PronounMappingSection';

interface UnifiedSceneConfigurationProps {
  sceneAnalysisResult: SceneAnalysisResult | null;
  qualityTier: 'professional' | 'premium';
  onQualityTierChange: (tier: 'professional' | 'premium') => void;
  selectedCharacterReferences: Record<number, { poseId?: string; s3Key?: string; imageUrl?: string }>; // Per-shot selection (single character)
  onCharacterReferenceChange: (shotSlot: number, reference: { poseId?: string; s3Key?: string; imageUrl?: string } | undefined) => void;
  // Pronoun detection: Multi-character selection per shot (for pronouns like "they", "she", etc.)
  selectedCharactersForShots?: Record<number, string[]>; // Per-shot: array of character IDs
  onCharactersForShotChange?: (shotSlot: number, characterIds: string[]) => void;
  // Pronoun-to-character mapping: shot slot -> pronoun -> characterId
  pronounMappingsForShots?: Record<number, Record<string, string | string[]>>; // e.g., { 18: { "she": "char-123", "they": ["char-123", "char-456"] } }
  onPronounMappingChange?: (shotSlot: number, pronoun: string, characterId: string | string[] | undefined) => void;
  allCharacters?: any[]; // All characters from character bank (for pronoun detection selector)
  characterHeadshots: Record<string, Array<{ poseId?: string; s3Key: string; imageUrl: string; label?: string; priority?: number; outfitName?: string }>>;
  loadingHeadshots: Record<string, boolean>;
  characterOutfits: Record<string, string>;
  onCharacterOutfitChange: (characterId: string, outfitName: string | undefined) => void;
  // Phase 2: Location angle selection
  selectedLocationReferences?: Record<number, { angleId?: string; s3Key?: string; imageUrl?: string }>;
  onLocationAngleChange?: (shotSlot: number, locationId: string, angle: { angleId?: string; s3Key?: string; imageUrl?: string } | undefined) => void;
  enabledShots: number[];
  onEnabledShotsChange: (enabledShots: number[]) => void;
  onGenerate: () => void;
  isGenerating?: boolean;
  screenplayId?: string;
  getToken: () => Promise<string | null>;
}

export function UnifiedSceneConfiguration({
  sceneAnalysisResult,
  qualityTier,
  onQualityTierChange,
  selectedCharacterReferences,
  onCharacterReferenceChange,
  characterHeadshots,
  loadingHeadshots,
  characterOutfits,
  onCharacterOutfitChange,
  selectedLocationReferences = {},
  onLocationAngleChange,
  selectedCharactersForShots = {},
  onCharactersForShotChange,
  pronounMappingsForShots = {},
  onPronounMappingChange,
  allCharacters = [],
  enabledShots,
  onEnabledShotsChange,
  onGenerate,
  isGenerating = false,
  screenplayId,
  getToken
}: UnifiedSceneConfigurationProps) {
  const [expandedShots, setExpandedShots] = useState<Record<number, boolean>>({});

  // Auto-select characters mentioned in action shots when shot breakdown loads
  useEffect(() => {
    if (!sceneAnalysisResult?.shotBreakdown?.shots || !onCharactersForShotChange) return;
    
    const shots = sceneAnalysisResult.shotBreakdown.shots;
    
    for (const shot of shots) {
      if (shot.type !== 'action') continue;
      
      // Skip if already has selected characters (user may have manually selected)
      const currentSelection = selectedCharactersForShots[shot.slot] || [];
      if (currentSelection.length > 0) continue;
      
      // Get characters mentioned in the text
      const mentionedCharacters = getCharactersFromActionShot(shot);
      const mentionedCharacterIds = mentionedCharacters.length > 0 
        ? mentionedCharacters.map((c: any) => c.id)
        : [];
      
      // Auto-select mentioned characters
      if (mentionedCharacterIds.length > 0) {
        onCharactersForShotChange(shot.slot, mentionedCharacterIds);
      }
    }
  }, [sceneAnalysisResult?.shotBreakdown?.shots?.length, onCharactersForShotChange, selectedCharactersForShots]); // Only run when shot breakdown first loads

  // Auto-select all shots on mount if sceneAnalysisResult changes
  useEffect(() => {
    if (sceneAnalysisResult?.shotBreakdown?.shots) {
      const allShotSlots = sceneAnalysisResult.shotBreakdown.shots.map(shot => shot.slot);
      if (enabledShots.length === 0 || !allShotSlots.every(slot => enabledShots.includes(slot))) {
        onEnabledShotsChange(allShotSlots);
      }
      
      // Auto-expand shots that need configuration:
      // 1. Dialogue shots (to show character headshots)
      // 2. Action shots with character mentions (to show character headshots)
      // 3. Establishing shots (to show location angle selection - REQUIRED)
      const expanded: Record<number, boolean> = {};
      sceneAnalysisResult.shotBreakdown.shots.forEach((shot: any) => {
        if (shot.type === 'dialogue' && shot.characterId) {
          // Dialogue shots need character headshot selection
          expanded[shot.slot] = true;
        } else if (shot.type === 'action' && actionShotHasExplicitCharacter(shot)) {
          // Action shots with explicit character mentions need character headshot selection
          expanded[shot.slot] = true;
        } else if (shot.type === 'action' && actionShotHasPronouns(shot).hasPronouns) {
          // Action shots with pronouns need character selector
          expanded[shot.slot] = true;
        } else if (shot.type === 'establishing') {
          // Establishing shots require location angle selection
        expanded[shot.slot] = true;
        }
      });
      setExpandedShots(expanded);
    }
  }, [sceneAnalysisResult?.shotBreakdown?.shots]);

  if (!sceneAnalysisResult?.shotBreakdown) {
    return (
      <Card className="bg-[#141414] border-[#3F3F46]">
        <CardContent className="p-3">
          <div className="text-xs text-[#808080]">No shot breakdown available. Please analyze the scene first.</div>
        </CardContent>
      </Card>
    );
  }

  const { shots, totalCredits, totalShots, estimatedTime } = sceneAnalysisResult.shotBreakdown;

  // Calculate total credits for enabled shots
  const enabledShotsCredits = shots
    .filter(shot => enabledShots.includes(shot.slot))
    .reduce((sum, shot) => sum + shot.credits, 0);
  
  // Add quality tier adjustment (Premium = +100 credits)
  const finalCredits = qualityTier === 'premium' 
    ? enabledShotsCredits + 100 
    : enabledShotsCredits;

  // Toggle shot expansion
  const toggleShotExpansion = (slot: number) => {
    setExpandedShots(prev => ({ ...prev, [slot]: !prev[slot] }));
  };

  // Toggle shot enabled/disabled
  const toggleShotEnabled = (slot: number) => {
    if (enabledShots.includes(slot)) {
      onEnabledShotsChange(enabledShots.filter(s => s !== slot));
    } else {
      onEnabledShotsChange([...enabledShots, slot]);
    }
  };

  // Get shot type label (user-friendly, no workflow names)
  const getShotTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'establishing': 'Establishing',
      'dialogue': 'Dialogue',
      'action': 'Action',
      'vfx': 'VFX',
      'character': 'Character',
      'broll': 'B-Roll'
    };
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Helper to get full text from a shot (uses narrationBlock/dialogueBlock if available, falls back to description)
  const getFullShotText = (shot: any): string => {
    // For action shots, use narrationBlock.text if available (full text, not truncated)
    if (shot.type === 'action' && shot.narrationBlock?.text) {
      return shot.narrationBlock.text;
    }
    // For dialogue shots, use dialogueBlock.dialogue if available
    if (shot.type === 'dialogue' && shot.dialogueBlock?.dialogue) {
      return shot.dialogueBlock.dialogue;
    }
    // Fall back to description (may be truncated)
    return shot.description || '';
  };

  // Helper to find the last mentioned character in previous shots
  // This helps resolve pronouns (she/her) that refer to previously mentioned characters
  const findLastMentionedCharacter = (currentShotSlot: number): any => {
    if (!sceneAnalysisResult?.shotBreakdown?.shots || !sceneAnalysisResult?.characters) {
      return null;
    }
    
    const shots = sceneAnalysisResult.shotBreakdown.shots;
    const currentIndex = shots.findIndex((s: any) => s.slot === currentShotSlot);
    
    if (currentIndex === -1) return null;
    
    // Look backwards through previous shots to find the last character mention
    for (let i = currentIndex - 1; i >= 0; i--) {
      const prevShot = shots[i];
      
      // Check dialogue shots (they always have a character)
      if (prevShot.type === 'dialogue' && prevShot.characterId) {
        return sceneAnalysisResult.characters.find((c: any) => c.id === prevShot.characterId) || null;
      }
      
      // Check action shots for character name mentions (ALL CAPS or regular case)
      // Use full text from narrationBlock if available
      const prevText = getFullShotText(prevShot);
      if (prevShot.type === 'action' && prevText) {
        for (const char of sceneAnalysisResult.characters) {
          if (!char.name) continue;
          const charName = char.name;
          // Check for ALL CAPS mention (e.g., "SARAH enters")
          if (prevText.includes(charName.toUpperCase())) {
            return char;
          }
          // Check for regular case mention (e.g., "Sarah walks" or "Sarah's desk")
          if (prevText.includes(charName) || prevText.includes(charName + "'s")) {
            return char;
          }
        }
      }
    }
    
    return null;
  };

  // Simplified: Detect explicit character names only (no auto-resolution of pronouns)
  const actionShotHasExplicitCharacter = (shot: any): boolean => {
    if (shot.type !== 'action' || !sceneAnalysisResult?.characters) {
      return false;
    }
    
    // Get full text (uses narrationBlock.text if available, falls back to description)
    const fullText = getFullShotText(shot);
    if (!fullText) return false;
    
    const textLower = fullText.toLowerCase();
    const originalText = fullText;
    const characters = sceneAnalysisResult.characters;
    
    // Check for explicit character name mentions (ALL CAPS or regular case)
    return characters.some((char: any) => {
      if (!char.name) return false;
      const charName = char.name.toLowerCase();
      // Check for regular case name (e.g., "Sarah walks" or "Sarah's desk")
      if (textLower.includes(charName) || textLower.includes(charName + "'s")) {
        return true;
      }
      // Check for ALL CAPS mention (e.g., "SARAH enters")
      if (originalText.includes(char.name.toUpperCase())) {
        return true;
      }
      return false;
    });
  };

  // Detect pronouns in action shot (does NOT auto-resolve, just flags them)
  const actionShotHasPronouns = (shot: any): { hasPronouns: boolean; pronouns: string[] } => {
    if (shot.type !== 'action') {
      return { hasPronouns: false, pronouns: [] };
    }
    
    const fullText = getFullShotText(shot);
    
    // Debug logging to diagnose truncation issues
    console.log(`[UnifiedSceneConfig] Shot ${shot.slot} pronoun detection:`, {
      shotType: shot.type,
      hasNarrationBlock: !!shot.narrationBlock,
      narrationBlockText: shot.narrationBlock?.text?.substring(0, 100),
      description: shot.description?.substring(0, 100),
      fullText: fullText?.substring(0, 100),
      fullTextLength: fullText?.length
    });
    
    if (!fullText) return { hasPronouns: false, pronouns: [] };
    
    const textLower = fullText.toLowerCase();
    const detectedPronouns: string[] = [];
    
    // Detect pronouns
    const pronounPatterns = {
      singular: /\b(she|her|hers|he|him|his)\b/g,
      plural: /\b(they|them|their|theirs)\b/g
    };
    
    let match;
    while ((match = pronounPatterns.singular.exec(textLower)) !== null) {
      if (!detectedPronouns.includes(match[0])) {
        detectedPronouns.push(match[0]);
      }
    }
    
    // Reset regex lastIndex for next pattern
    pronounPatterns.singular.lastIndex = 0;
    
    while ((match = pronounPatterns.plural.exec(textLower)) !== null) {
      if (!detectedPronouns.includes(match[0])) {
        detectedPronouns.push(match[0]);
      }
    }
    
    console.log(`[UnifiedSceneConfig] Shot ${shot.slot} detected pronouns:`, detectedPronouns);
    
    return {
      hasPronouns: detectedPronouns.length > 0,
      pronouns: detectedPronouns
    };
  };

  // Get all characters mentioned in action shot (explicit names only, no pronoun resolution)
  const getCharactersFromActionShot = (shot: any): any[] => {
    if (shot.type !== 'action' || !sceneAnalysisResult?.characters) {
      return [];
    }
    
    // Get full text (uses narrationBlock.text if available, falls back to description)
    const fullText = getFullShotText(shot);
    if (!fullText) return [];
    
    const textLower = fullText.toLowerCase();
    const originalText = fullText;
    const characters = sceneAnalysisResult.characters;
    const foundCharacters: any[] = [];
    const foundCharIds = new Set<string>();
    
    // Check for explicit character name mentions (ALL CAPS or regular case)
    // Prefer regular case matches first (more specific), then ALL CAPS
    for (const char of characters) {
      if (!char.name || foundCharIds.has(char.id)) continue;
      const charName = char.name.toLowerCase();
      // Check for regular case name (e.g., "Sarah walks" or "Sarah's desk")
      if (textLower.includes(charName) || textLower.includes(charName + "'s")) {
        foundCharacters.push(char);
        foundCharIds.add(char.id);
      }
    }
    
    // Check for ALL CAPS mentions (if not already found)
    for (const char of characters) {
      if (!char.name || foundCharIds.has(char.id)) continue;
      if (originalText.includes(char.name.toUpperCase())) {
        foundCharacters.push(char);
        foundCharIds.add(char.id);
      }
    }
    
    return foundCharacters;
  };

  // Legacy function for backward compatibility (returns first character)
  const getCharacterFromActionShot = (shot: any) => {
    const chars = getCharactersFromActionShot(shot);
    return chars.length > 0 ? chars[0] : null;
  };

  // Check if shot type needs reference selection
  // Phase 1: dialogue shots (character headshots)
  // Phase 2: action shots with explicit character mentions (character headshots)
  // Phase 3: establishing/action/dialogue shots (location angles)
  const needsReferenceSelection = (shot: any): boolean => {
    const needsCharacter = (shot.type === 'dialogue' && !!shot.characterId) || 
                          (shot.type === 'action' && actionShotHasExplicitCharacter(shot));
    const needsLocation = shot.type === 'establishing' || 
                         !!(shot.type === 'action' && sceneAnalysisResult?.location?.id) ||
                         !!(shot.type === 'dialogue' && sceneAnalysisResult?.location?.id);
    return needsCharacter || needsLocation;
  };
  
  // Check if shot needs location angle selection
  const needsLocationAngle = (shot: any): boolean => {
    return shot.type === 'establishing' || 
           !!(shot.type === 'action' && sceneAnalysisResult?.location?.id) ||
           !!(shot.type === 'dialogue' && sceneAnalysisResult?.location?.id);
  };
  
  // Check if location angle is required for this shot
  const isLocationAngleRequired = (shot: any): boolean => {
    return shot.type === 'establishing';
  };

  // REMOVED: autoResolvePronouns function - no longer needed with dropdown mapping UI

  // Get character for shot (dialogue or action with character mention)
  const getCharacterForShot = (shot: any) => {
    // Dialogue shot: use characterId
    if (shot.type === 'dialogue' && shot.characterId && sceneAnalysisResult?.characters) {
    return sceneAnalysisResult.characters.find((c: any) => c.id === shot.characterId);
    }
    
    // Action shot: detect character from description (returns first character for backward compatibility)
    if (shot.type === 'action') {
      return getCharacterFromActionShot(shot);
    }
    
    return null;
  };

  // Get all characters for shot (for action shots with multiple characters)
  const getCharactersForShot = (shot: any): any[] => {
    if (shot.type === 'action') {
      return getCharactersFromActionShot(shot);
    }
    // For dialogue shots, return single character
    const char = getCharacterForShot(shot);
    return char ? [char] : [];
  };
  
  // Render character controls only (left column): name, outfit selector
  const renderCharacterControlsOnly = (
    charId: string,
    shotSlot: number,
    shotMappings: Record<string, string | string[]>,
    hasPronouns: boolean,
    category: 'explicit' | 'singular' | 'plural'
  ) => {
    const char = sceneAnalysisResult?.characters.find((c: any) => c.id === charId) ||
               allCharacters.find((c: any) => c.id === charId);
    if (!char) return null;
    
    const selectedOutfit = characterOutfits[charId];
    
    // Get which pronouns map to this character
    const pronounsForThisChar = hasPronouns ? Object.entries(shotMappings)
      .filter(([_, mappedIdOrIds]) => {
        if (Array.isArray(mappedIdOrIds)) {
          return mappedIdOrIds.includes(charId);
        }
        return mappedIdOrIds === charId;
      })
      .map(([pronoun]) => pronoun) : [];
    
    return (
      <div key={charId} className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-[#FFFFFF]">
            {char.name}
          </div>
          {pronounsForThisChar.length > 0 && (
            <div className="text-[10px] text-[#808080]">
              ({pronounsForThisChar.join(', ')})
            </div>
          )}
        </div>
        
        {/* Outfit Selector */}
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
      </div>
    );
  };
  
  // Render character images only (right column): headshots with click handlers
  const renderCharacterImagesOnly = (
    charId: string,
    shotSlot: number
  ) => {
    const char = sceneAnalysisResult?.characters.find((c: any) => c.id === charId) ||
               allCharacters.find((c: any) => c.id === charId);
    if (!char) return null;
    
    const headshots = characterHeadshots[charId] || [];
    const selectedHeadshot = selectedCharacterReferences[shotSlot];
    const selectedOutfit = characterOutfits[charId];
    
    return (
      <div key={charId} className="space-y-2">
        {/* Headshots - CLICKABLE/SELECTABLE */}
        {loadingHeadshots[charId] ? (
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
      </div>
    );
  };
  
  // Render character section with headshots and outfit selector (legacy - not used in new layout)
  const renderCharacterSection = (
    charId: string,
    shotSlot: number,
    shotMappings: Record<string, string | string[]>,
    hasPronouns: boolean,
    category: 'explicit' | 'singular' | 'plural'
  ) => {
    const char = sceneAnalysisResult?.characters.find((c: any) => c.id === charId) ||
               allCharacters.find((c: any) => c.id === charId);
    if (!char) return null;
    
    const headshots = characterHeadshots[charId] || [];
    const selectedHeadshot = selectedCharacterReferences[shotSlot];
    const selectedOutfit = characterOutfits[charId];
    
    // Get which pronouns map to this character
    const pronounsForThisChar = hasPronouns ? Object.entries(shotMappings)
      .filter(([_, mappedIdOrIds]) => {
        if (Array.isArray(mappedIdOrIds)) {
          return mappedIdOrIds.includes(charId);
        }
        return mappedIdOrIds === charId;
      })
      .map(([pronoun]) => pronoun) : [];
    
    return (
      <div key={charId} className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-[#FFFFFF]">
            {char.name}
          </div>
          {pronounsForThisChar.length > 0 && (
            <div className="text-[10px] text-[#808080]">
              ({pronounsForThisChar.join(', ')})
            </div>
          )}
        </div>
        
        {/* Outfit Selector */}
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
        
        {/* Headshots */}
        {loadingHeadshots[charId] ? (
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
      </div>
    );
  };

  return (
    <Card className="bg-[#141414] border-[#3F3F46]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-[#FFFFFF] flex items-center gap-2">
          <Film className="w-4 h-4 text-[#DC143C]" />
          Scene Configuration
        </CardTitle>
        <div className="text-xs text-[#808080] mt-1">
          Generation Plan ({totalShots} videos)
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        {/* Shot List - Chronological Order */}
        <div className="space-y-2">
          {shots.map((shot: any) => {
            const isEnabled = enabledShots.includes(shot.slot);
            const isExpanded = expandedShots[shot.slot] || false;
            const character = getCharacterForShot(shot);
            const isDialogue = shot.type === 'dialogue';
            const isActionWithCharacter = shot.type === 'action' && !!character;
            const hasCharacter = (isDialogue && shot.characterId) || isActionWithCharacter;
            const characterId = character?.id;
            
            const allHeadshots = hasCharacter && characterId ? characterHeadshots[characterId] || [] : [];
            const selectedOutfit = hasCharacter && characterId ? characterOutfits[characterId] : undefined;
            
            // Filter headshots by selected outfit (if outfit is selected)
            const headshots = selectedOutfit && selectedOutfit !== 'default' 
              ? allHeadshots.filter((h: any) => {
                  const headshotOutfit = h.outfitName || h.metadata?.outfitName;
                  return headshotOutfit === selectedOutfit;
                })
              : allHeadshots; // Show all headshots if no outfit selected or using default
            
            const isLoadingHeadshots = hasCharacter && characterId ? loadingHeadshots[characterId] : false;
            const selectedHeadshot = hasCharacter ? selectedCharacterReferences[shot.slot] : undefined;

            return (
              <div
                key={shot.slot}
                className={`border rounded-lg p-3 transition-all ${
                  isEnabled
                    ? 'border-[#DC143C] bg-[#DC143C]/10'
                    : 'border-[#3F3F46] bg-[#0A0A0A] opacity-60'
                }`}
              >
                {/* Shot Header */}
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => toggleShotEnabled(shot.slot)}
                    className="mt-1 w-4 h-4 text-[#DC143C] rounded border-[#3F3F46] focus:ring-[#DC143C] focus:ring-offset-0 cursor-pointer"
                  />

                  {/* Shot Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-[#FFFFFF]">
                        Shot {shot.slot}: {getShotTypeLabel(shot.type)}
                      </span>
                      <Badge variant="outline" className="border-[#DC143C] text-[#DC143C] text-xs">
                        {shot.credits} credits
                      </Badge>
                    </div>
                    <p className="text-xs text-[#808080] mb-2">
                      {shot.description}
                    </p>

                    {/* Expandable Reference Selection */}
                    {/* Show expander for dialogue shots (character headshots) OR shots that need location angles */}
                    {(needsReferenceSelection(shot) && character) || (needsLocationAngle(shot) && sceneAnalysisResult?.location?.id) ? (
                      <button
                        onClick={() => toggleShotExpansion(shot.slot)}
                        className="flex items-center gap-1 text-xs text-[#808080] hover:text-[#FFFFFF] transition-colors"
                      >
                        <span>Reference Selection</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Unified Reference Selection: All shot types (pronouns, characters, locations) */}
                {isExpanded && (() => {
                  // Check if this is an action shot with pronouns
                  const pronounInfo = shot.type === 'action' ? actionShotHasPronouns(shot) : { hasPronouns: false, pronouns: [] };
                  const hasPronouns = !!(pronounInfo.hasPronouns && onCharactersForShotChange && sceneAnalysisResult?.characters);
                  
                  // Check if this is a dialogue shot or action shot with character
                  const hasCharacter = (shot.type === 'dialogue' && shot.characterId) || 
                                      (shot.type === 'action' && actionShotHasExplicitCharacter(shot));
                  
                  // Check if location angle selector should be shown
                  const shouldShowLocation = needsLocationAngle(shot) && sceneAnalysisResult?.location?.id && onLocationAngleChange;
                  
                  // Only show unified layout if we have pronouns, characters, or location
                  if (!hasPronouns && !hasCharacter && !shouldShowLocation) {
                    return null;
                  }
                  
                  // Organize characters by category for proper ordering
                  let explicitCharacters: string[] = []; // Characters from action lines (e.g., "Sarah")
                  let singularPronounCharacters: string[] = []; // Characters mapped via singular pronouns
                  let pluralPronounCharacters: string[] = []; // Characters mapped via plural pronouns
                  let shotMappings: Record<string, string | string[]> = {};
                  
                  // Always get explicit characters from action lines (if any)
                  if (shot.type === 'action') {
                    const explicitChars = getCharactersFromActionShot(shot);
                    explicitCharacters = explicitChars.map((c: any) => c.id);
                  } else if (hasCharacter && shot.type === 'dialogue') {
                    // Dialogue shots have explicit character
                    const char = getCharacterForShot(shot);
                    if (char?.id) {
                      explicitCharacters = [char.id];
                    }
                  }
                  
                  // Get pronoun mappings if pronouns are present
                  if (hasPronouns) {
                    shotMappings = pronounMappingsForShots[shot.slot] || {};
                    const singularPronouns = ['she', 'her', 'hers', 'he', 'him', 'his'];
                    const pluralPronouns = ['they', 'them', 'their', 'theirs'];
                    
                    // Separate singular and plural pronoun characters
                    Object.entries(shotMappings).forEach(([pronoun, mappedIdOrIds]) => {
                      const pronounLower = pronoun.toLowerCase();
                      if (singularPronouns.includes(pronounLower) && !Array.isArray(mappedIdOrIds) && mappedIdOrIds) {
                        if (!singularPronounCharacters.includes(mappedIdOrIds)) {
                          singularPronounCharacters.push(mappedIdOrIds);
                        }
                      } else if (pluralPronouns.includes(pronounLower) && Array.isArray(mappedIdOrIds)) {
                        mappedIdOrIds.forEach(id => {
                          if (!pluralPronounCharacters.includes(id)) {
                            pluralPronounCharacters.push(id);
                          }
                        });
                      }
                    });
                  }
                  
                  // Remove duplicates (explicit characters take precedence)
                  const allCharIds = new Set([...explicitCharacters, ...singularPronounCharacters, ...pluralPronounCharacters]);
                  const charactersToShow = Array.from(allCharIds);
                  
                  // Get all unique character IDs for images (explicit + all pronoun-mapped characters)
                  const allCharacterIdsForImages = new Set<string>();
                  explicitCharacters.forEach(id => allCharacterIdsForImages.add(id));
                  singularPronounCharacters.forEach(id => allCharacterIdsForImages.add(id));
                  pluralPronounCharacters.forEach(id => allCharacterIdsForImages.add(id));
                  const allImageCharacterIds = Array.from(allCharacterIdsForImages);
                  
                  return (
                    <div className="mt-3">
                      {/* Two-column layout: Controls on left, Images on right */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Left Column: Location, Props, Character(s), Pronoun Mapping */}
                        <div className="space-y-4">
                          {/* Location Label */}
                          {shouldShowLocation && (
                            <div className="pb-3 border-b border-[#3F3F46]">
                              <div className="text-xs font-medium text-[#FFFFFF]">
                                Location
                              </div>
                            </div>
                          )}
                          
                          {/* Props Label */}
                          <div className="pb-3 border-b border-[#3F3F46]">
                            <div className="text-xs font-medium text-[#808080]">
                              Props
                            </div>
                          </div>
                          
                          {/* Character(s) Section: Explicit characters from action lines */}
                          {explicitCharacters.length > 0 && (
                            <div className="pb-3 border-b border-[#3F3F46]">
                              <div className="text-xs font-medium text-[#FFFFFF] mb-2">
                                Character(s)
                              </div>
                              {explicitCharacters.map((charId) => {
                                return renderCharacterControlsOnly(charId, shot.slot, shotMappings, hasPronouns, 'explicit');
                              })}
                            </div>
                          )}
                          
                          {/* Pronoun Mapping Section: Integrated with character selection */}
                          {hasPronouns && (
                            <div className="pt-3 border-t border-[#3F3F46]">
                              <PronounMappingSection
                                pronouns={pronounInfo.pronouns}
                                characters={allCharacters.length > 0 ? allCharacters : sceneAnalysisResult.characters}
                                selectedCharacters={selectedCharactersForShots[shot.slot] || []}
                                pronounMappings={shotMappings}
                                onPronounMappingChange={(pronoun, characterIdOrIds) => {
                                  if (onPronounMappingChange) {
                                    onPronounMappingChange(shot.slot, pronoun, characterIdOrIds);
                                  }
                                }}
                                onCharacterSelectionChange={(characterIds) => {
                                  if (onCharactersForShotChange) {
                                    onCharactersForShotChange(shot.slot, characterIds);
                                  }
                                }}
                                shotSlot={shot.slot}
                                characterHeadshots={characterHeadshots}
                                loadingHeadshots={loadingHeadshots}
                                selectedCharacterReferences={selectedCharacterReferences}
                                characterOutfits={characterOutfits}
                                onCharacterReferenceChange={onCharacterReferenceChange}
                                onCharacterOutfitChange={onCharacterOutfitChange}
                              />
                            </div>
                          )}
                        </div>
                        
                        {/* Right Column: Images only */}
                        {(allImageCharacterIds.length > 0 || shouldShowLocation) && (
                          <div className="space-y-4 border-l border-[#3F3F46] pl-4">
                            <div className="text-xs font-medium text-[#FFFFFF] mb-2">
                              References
                            </div>
                            
                            {/* Location Angle Images */}
                            {shouldShowLocation && (
                              <div className="pb-3 border-b border-[#3F3F46]">
                                <LocationAngleSelector
                                  locationId={sceneAnalysisResult.location.id}
                                  locationName={sceneAnalysisResult.location.name || 'Location'}
                                  angleVariations={sceneAnalysisResult.location.angleVariations || []}
                                  baseReference={sceneAnalysisResult.location.baseReference}
                                  selectedAngle={selectedLocationReferences[shot.slot]}
                                  onAngleChange={(locationId, angle) => {
                                    onLocationAngleChange(shot.slot, locationId, angle);
                                  }}
                                  isRequired={isLocationAngleRequired(shot)}
                                  recommended={sceneAnalysisResult.location.recommended}
                                />
                              </div>
                            )}
                            
                            {/* Props Placeholder */}
                            <div className="pb-3 border-b border-[#3F3F46]">
                              <div className="text-[10px] text-[#808080] italic">
                                Coming in next phase
                              </div>
                            </div>
                            
                            {/* Character Images - Organized by category */}
                            {allImageCharacterIds.length > 0 && (
                              <div className="space-y-3">
                                {/* Explicit Characters from Action Lines */}
                                {explicitCharacters.length > 0 && (
                                  <div className="space-y-2 pb-3 border-b border-[#3F3F46]">
                                    {explicitCharacters.map((charId) => {
                                      return renderCharacterImagesOnly(charId, shot.slot);
                                    })}
                                  </div>
                                )}
                                
                                {/* Singular Pronoun Characters */}
                                {singularPronounCharacters.length > 0 && (
                                  <div className="space-y-2 pb-3 border-b border-[#3F3F46]">
                                    {singularPronounCharacters.map((charId) => {
                                      return renderCharacterImagesOnly(charId, shot.slot);
                                    })}
                                  </div>
                                )}
                                
                                {/* Plural Pronoun Characters */}
                                {pluralPronounCharacters.length > 0 && (
                                  <div className="space-y-2">
                                    {pluralPronounCharacters.map((charId) => {
                                      return renderCharacterImagesOnly(charId, shot.slot);
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* REMOVED: Old pronoun detection section - now handled in unified layout above */}
              </div>
            );
          })}
        </div>

        {/* Global Quality Setting */}
        <div className="pt-3 border-t border-[#3F3F46]">
          <div className="text-xs font-medium mb-3 text-[#808080]">Quality Tier</div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onQualityTierChange('professional')}
              className={`h-12 px-4 py-2 rounded border text-left transition-all ${
                qualityTier === 'professional'
                  ? 'border-[#DC143C] bg-[#DC143C]/10 text-[#FFFFFF]'
                  : 'border-[#3F3F46] bg-[#0A0A0A] text-[#FFFFFF] hover:border-[#DC143C] hover:bg-[#DC143C]/10'
              }`}
            >
              <div className="font-medium text-sm">Professional</div>
              <div className="text-xs text-[#808080] mt-0.5">
                {enabledShotsCredits} credits
              </div>
            </button>
            <button
              onClick={() => onQualityTierChange('premium')}
              className={`h-12 px-4 py-2 rounded border text-left transition-all ${
                qualityTier === 'premium'
                  ? 'border-[#DC143C] bg-[#DC143C]/10 text-[#FFFFFF]'
                  : 'border-[#3F3F46] bg-[#0A0A0A] text-[#FFFFFF] hover:border-[#DC143C] hover:bg-[#DC143C]/10'
              }`}
            >
              <div className="font-medium text-sm flex items-center gap-1.5">
                Premium
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs text-[#808080] mt-0.5">
                {enabledShotsCredits + 100} credits
              </div>
            </button>
          </div>
        </div>

        {/* Total Summary */}
        <div className="pt-3 border-t border-[#3F3F46]">
          <div className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded-lg border border-[#3F3F46]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs">
                <Coins className="w-3.5 h-3.5 text-[#DC143C]" />
                <span className="text-[#808080]">Total Credits:</span>
                <span className="text-[#FFFFFF] font-semibold">{finalCredits}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <Clock className="w-3.5 h-3.5 text-[#DC143C]" />
                <span className="text-[#808080]">Estimated Time:</span>
                <span className="text-[#FFFFFF] font-semibold">{estimatedTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={onGenerate}
          disabled={isGenerating || enabledShots.length === 0}
          className="w-full h-11 bg-[#DC143C] hover:bg-[#B91238] text-white font-semibold"
        >
          {isGenerating ? (
            <>
              <Sparkles className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            `Generate ${enabledShots.length} ${enabledShots.length === 1 ? 'Video' : 'Videos'}`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

