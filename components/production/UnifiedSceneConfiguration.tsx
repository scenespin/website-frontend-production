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
import { ShotConfigurationPanel } from './ShotConfigurationPanel';
import { categorizeCharacters } from './utils/characterCategorization';

interface UnifiedSceneConfigurationProps {
  sceneAnalysisResult: SceneAnalysisResult | null;
  qualityTier: 'professional' | 'premium';
  onQualityTierChange: (tier: 'professional' | 'premium') => void;
  selectedCharacterReferences: Record<number, Record<string, { poseId?: string; s3Key?: string; imageUrl?: string }>>; // Per-shot, per-character selection: shotSlot -> characterId -> reference
  onCharacterReferenceChange: (shotSlot: number, characterId: string, reference: { poseId?: string; s3Key?: string; imageUrl?: string } | undefined) => void;
  // Pronoun detection: Multi-character selection per shot (for pronouns like "they", "she", etc.)
  selectedCharactersForShots?: Record<number, string[]>; // Per-shot: array of character IDs
  onCharactersForShotChange?: (shotSlot: number, characterIds: string[]) => void;
  // Pronoun-to-character mapping: shot slot -> pronoun -> characterId
  pronounMappingsForShots?: Record<number, Record<string, string | string[]>>; // e.g., { 18: { "she": "char-123", "they": ["char-123", "char-456"] } }
  onPronounMappingChange?: (shotSlot: number, pronoun: string, characterId: string | string[] | undefined) => void;
  allCharacters?: any[]; // All characters from character bank (for pronoun detection selector)
  characterHeadshots: Record<string, Array<{ poseId?: string; s3Key: string; imageUrl: string; label?: string; priority?: number; outfitName?: string }>>;
  loadingHeadshots: Record<string, boolean>;
  characterOutfits: Record<number, Record<string, string>>; // Per-shot, per-character: shotSlot -> characterId -> outfitName
  onCharacterOutfitChange: (shotSlot: number, characterId: string, outfitName: string | undefined) => void;
  // Phase 2: Location angle selection
  selectedLocationReferences?: Record<number, { angleId?: string; s3Key?: string; imageUrl?: string }>;
  onLocationAngleChange?: (shotSlot: number, locationId: string, angle: { angleId?: string; s3Key?: string; imageUrl?: string } | undefined) => void;
  // Dialogue workflow selection (per-shot)
  selectedDialogueWorkflows?: Record<number, string>; // Per-shot: shotSlot -> workflowType
  onDialogueWorkflowChange?: (shotSlot: number, workflowType: string) => void;
  // Dialogue workflow override prompts (per-shot)
  dialogueWorkflowPrompts?: Record<number, string>; // Per-shot: shotSlot -> prompt text
  onDialogueWorkflowPromptChange?: (shotSlot: number, prompt: string) => void;
  // Pronoun extras prompts (per-shot, per-pronoun)
  pronounExtrasPrompts?: Record<number, Record<string, string>>; // Per-shot, per-pronoun: shotSlot -> { pronoun: prompt }
  onPronounExtrasPromptChange?: (shotSlot: number, pronoun: string, prompt: string) => void;
  enabledShots: number[];
  onEnabledShotsChange: (enabledShots: number[]) => void;
  onGenerate: () => void;
  isGenerating?: boolean;
  screenplayId?: string;
  getToken: () => Promise<string | null>;
  // Resolution is global only, set in review step (not per-shot)
  globalResolution?: '1080p' | '4k'; // Global only, not per-shot
  // Camera Angle (per-shot) - moved to Video Generation section
  shotCameraAngles?: Record<number, 'close-up' | 'medium-shot' | 'wide-shot' | 'extreme-close-up' | 'extreme-wide-shot' | 'over-the-shoulder' | 'low-angle' | 'high-angle' | 'dutch-angle' | 'auto'>;
  onCameraAngleChange?: (shotSlot: number, angle: 'close-up' | 'medium-shot' | 'wide-shot' | 'extreme-close-up' | 'extreme-wide-shot' | 'over-the-shoulder' | 'low-angle' | 'high-angle' | 'dutch-angle' | 'auto' | undefined) => void;
  // Props Configuration (per-shot)
  sceneProps?: Array<{ id: string; name: string; imageUrl?: string; s3Key?: string }>;
  propsToShots?: Record<string, number[]>; // Which props are assigned to which shots
  shotProps?: Record<number, Record<string, { selectedImageId?: string; usageDescription?: string }>>;
  onPropDescriptionChange?: (shotSlot: number, propId: string, description: string) => void;
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
  selectedDialogueWorkflows = {},
  onDialogueWorkflowChange,
  dialogueWorkflowPrompts = {},
  onDialogueWorkflowPromptChange,
  pronounExtrasPrompts = {},
  onPronounExtrasPromptChange,
  enabledShots,
  onEnabledShotsChange,
  onGenerate,
  isGenerating = false,
  screenplayId,
  getToken,
  globalResolution = '1080p', // Global only, not used per-shot
  shotCameraAngles = {},
  onCameraAngleChange,
  sceneProps = [],
  propsToShots = {},
  shotProps = {},
  onPropDescriptionChange
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
    // Use word boundaries to avoid false matches (e.g., "Sarah" in "Sarah's" or "Sarah walks")
    for (const char of characters) {
      if (!char.name || foundCharIds.has(char.id)) continue;
      const charName = char.name.toLowerCase();
      // Use word boundary regex for more precise matching
      // Matches "Sarah" but not "Sarah" as part of another word
      const charNameRegex = new RegExp(`\\b${charName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      const possessiveRegex = new RegExp(`\\b${charName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'s\\b`, 'i');
      
      if (charNameRegex.test(fullText) || possessiveRegex.test(fullText)) {
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
  
  // Helper to extract outfits from headshots if not available in character data
  const getCharacterWithExtractedOutfits = (charId: string, char: any): any => {
    // If character has availableOutfits, use them
    if (char.availableOutfits && char.availableOutfits.length > 0) {
      return char;
    }
    
    // Otherwise, extract outfits from headshots
    const headshots = characterHeadshots[charId] || [];
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
    
    return char;
  };

  // Render character controls only (left column): name, outfit selector
  const renderCharacterControlsOnly = (
    charId: string,
    shotSlot: number,
    shotMappings: Record<string, string | string[]>,
    hasPronouns: boolean,
    category: 'explicit' | 'singular' | 'plural'
  ) => {
    // Prefer sceneAnalysisResult.characters (has outfit data) over allCharacters
    const baseChar = sceneAnalysisResult?.characters.find((c: any) => c.id === charId) ||
               allCharacters.find((c: any) => c.id === charId);
    if (!baseChar) return null;
    
    // Extract outfits from headshots if not in character data
    const char = getCharacterWithExtractedOutfits(charId, baseChar);
    const selectedOutfit = characterOutfits[shotSlot]?.[charId];
    const hasAnyOutfits = (char.availableOutfits?.length || 0) > 0 || !!char.defaultOutfit;
    
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
      <div key={charId} className="space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-xs font-medium text-[#FFFFFF]">
            {char.name}
          </div>
          {pronounsForThisChar.length > 0 && (
            <div className="text-[10px] text-[#808080]">
              ({pronounsForThisChar.join(', ')})
            </div>
          )}
          {/* Outfit Selector - inline with character name when outfits exist */}
          {hasAnyOutfits && (
            <CharacterOutfitSelector
              characterId={char.id}
              characterName={char.name}
              availableOutfits={char.availableOutfits || []}
              defaultOutfit={char.defaultOutfit}
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
  };
  
  // Render character images only (right column): headshots with click handlers
  const renderCharacterImagesOnly = (
    charId: string,
    shotSlot: number,
    pronounsForChar?: string[] // Optional: pronouns that map to this character
  ) => {
    const char = sceneAnalysisResult?.characters.find((c: any) => c.id === charId) ||
               allCharacters.find((c: any) => c.id === charId);
    if (!char) return null;
    
    const allHeadshots = characterHeadshots[charId] || [];
    const selectedHeadshot = selectedCharacterReferences[shotSlot]?.[charId];
    const selectedOutfit = characterOutfits[shotSlot]?.[charId];
    
    // Filter headshots by selected outfit (if outfit is selected)
    const headshots = selectedOutfit && selectedOutfit !== 'default' 
      ? allHeadshots.filter((h: any) => {
          const headshotOutfit = h.outfitName || h.metadata?.outfitName;
          return headshotOutfit === selectedOutfit;
        })
      : allHeadshots; // Show all headshots if no outfit selected or using default
    
    return (
      <div key={charId} className="space-y-2">
        {/* Show which pronouns map to this character if provided */}
        {pronounsForChar && pronounsForChar.length > 0 && (
          <div className="text-[10px] text-[#808080] mb-1">
            ({pronounsForChar.join(', ')})
          </div>
        )}
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
                      onCharacterReferenceChange(shotSlot, charId, newRef);
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
            const selectedOutfit = hasCharacter && characterId ? characterOutfits[shot.slot]?.[characterId] : undefined;
            
            // Filter headshots by selected outfit (if outfit is selected)
            const headshots = selectedOutfit && selectedOutfit !== 'default' 
              ? allHeadshots.filter((h: any) => {
                  const headshotOutfit = h.outfitName || h.metadata?.outfitName;
                  return headshotOutfit === selectedOutfit;
                })
              : allHeadshots; // Show all headshots if no outfit selected or using default
            
            const isLoadingHeadshots = hasCharacter && characterId ? loadingHeadshots[characterId] : false;
            // For dialogue shots, get the character's reference (backward compatibility)
            const selectedHeadshot = hasCharacter && characterId ? selectedCharacterReferences[shot.slot]?.[characterId] : undefined;

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
                    <p className="text-xs text-[#808080] mb-2 break-words whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {getFullShotText(shot) || shot.description}
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
                  
                  // Get pronoun mappings
                  const shotMappings = hasPronouns ? (pronounMappingsForShots[shot.slot] || {}) : {};
                  
                  // Categorize characters using utility function
                  const { explicitCharacters, singularPronounCharacters, pluralPronounCharacters } = categorizeCharacters(
                    shot,
                    shotMappings,
                    getCharactersFromActionShot,
                    getCharacterForShot
                            );
                            
                            return (
                    <ShotConfigurationPanel
                      shot={shot}
                      sceneAnalysisResult={sceneAnalysisResult}
                      shotMappings={shotMappings}
                      hasPronouns={hasPronouns}
                      explicitCharacters={explicitCharacters}
                      singularPronounCharacters={singularPronounCharacters}
                      pluralPronounCharacters={pluralPronounCharacters}
                      selectedLocationReferences={selectedLocationReferences}
                      onLocationAngleChange={onLocationAngleChange}
                      isLocationAngleRequired={isLocationAngleRequired}
                      needsLocationAngle={needsLocationAngle}
                      renderCharacterControlsOnly={renderCharacterControlsOnly}
                      renderCharacterImagesOnly={renderCharacterImagesOnly}
                      pronounInfo={pronounInfo}
                      allCharacters={allCharacters}
                      selectedCharactersForShots={selectedCharactersForShots}
                      onCharactersForShotChange={onCharactersForShotChange}
                      onPronounMappingChange={onPronounMappingChange}
                      characterHeadshots={characterHeadshots}
                      loadingHeadshots={loadingHeadshots}
                      selectedCharacterReferences={selectedCharacterReferences}
                      characterOutfits={characterOutfits}
                      onCharacterReferenceChange={onCharacterReferenceChange}
                      onCharacterOutfitChange={onCharacterOutfitChange}
                      selectedDialogueWorkflow={selectedDialogueWorkflows[shot.slot]}
                      onDialogueWorkflowChange={onDialogueWorkflowChange}
                      dialogueWorkflowPrompt={dialogueWorkflowPrompts[shot.slot]}
                      onDialogueWorkflowPromptChange={onDialogueWorkflowPromptChange}
                      pronounExtrasPrompts={pronounExtrasPrompts[shot.slot] || {}}
                      onPronounExtrasPromptChange={(pronoun, prompt) => {
                        onPronounExtrasPromptChange?.(shot.slot, pronoun, prompt);
                      }}
                      sceneProps={sceneProps}
                      propsToShots={propsToShots}
                      shotProps={shotProps}
                      onPropDescriptionChange={onPropDescriptionChange}
                    />
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

