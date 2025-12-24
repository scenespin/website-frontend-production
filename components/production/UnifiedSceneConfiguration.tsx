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
import { Check, Sparkles, Coins, Clock, ChevronDown, ChevronUp, Film, AlertCircle } from 'lucide-react';
import { SceneAnalysisResult } from '@/types/screenplay';
import { CharacterOutfitSelector } from './CharacterOutfitSelector';
import { LocationAngleSelector } from './LocationAngleSelector';
import { CharacterSelector } from './CharacterSelector';

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
  pronounMappingsForShots?: Record<number, Record<string, string>>; // e.g., { 18: { "she": "char-123", "he": "char-456" } }
  onPronounMappingChange?: (shotSlot: number, pronoun: string, characterId: string | undefined) => void;
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
  allCharacters = [],
  enabledShots,
  onEnabledShotsChange,
  onGenerate,
  isGenerating = false,
  screenplayId,
  getToken
}: UnifiedSceneConfigurationProps) {
  const [expandedShots, setExpandedShots] = useState<Record<number, boolean>>({});

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

  // Get character mentioned in action shot (explicit names only, no pronoun resolution)
  const getCharacterFromActionShot = (shot: any) => {
    if (shot.type !== 'action' || !sceneAnalysisResult?.characters) {
      return null;
    }
    
    // Get full text (uses narrationBlock.text if available, falls back to description)
    const fullText = getFullShotText(shot);
    if (!fullText) return null;
    
    const textLower = fullText.toLowerCase();
    const originalText = fullText;
    const characters = sceneAnalysisResult.characters;
    
    // Check for explicit character name mentions (ALL CAPS or regular case)
    // Prefer regular case matches first (more specific), then ALL CAPS
    for (const char of characters) {
      if (!char.name) continue;
      const charName = char.name.toLowerCase();
      // Check for regular case name (e.g., "Sarah walks" or "Sarah's desk")
      if (textLower.includes(charName) || textLower.includes(charName + "'s")) {
        return char;
      }
    }
    
    // Check for ALL CAPS mentions
    for (const char of characters) {
      if (!char.name) continue;
      if (originalText.includes(char.name.toUpperCase())) {
        return char;
      }
    }
    
    return null;
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

  // Auto-resolve pronouns based on context (for confirmation prompts)
  // Returns suggested mappings: { pronoun: characterId, reason: string }
  const autoResolvePronouns = (shot: any, pronouns: string[]): Record<string, { characterId: string; reason: string }> => {
    const suggestions: Record<string, { characterId: string; reason: string }> = {};
    if (!sceneAnalysisResult?.characters || pronouns.length === 0) return suggestions;
    
    const fullText = getFullShotText(shot);
    if (!fullText) return suggestions;
    
    const textLower = fullText.toLowerCase();
    const characters = sceneAnalysisResult.characters;
    
    // Strategy 1: Character name appears before pronoun in same shot
    for (const pronoun of pronouns) {
      const pronounIndex = textLower.indexOf(pronoun);
      if (pronounIndex === -1) continue;
      
      // Check for character names before this pronoun
      const textBeforePronoun = fullText.substring(0, pronounIndex);
      const textBeforePronounLower = textBeforePronoun.toLowerCase();
      
      for (const char of characters) {
        if (!char.name) continue;
        const charName = char.name.toLowerCase();
        
        // Check if character name appears before pronoun
        if (textBeforePronounLower.includes(charName) || textBeforePronounLower.includes(charName + "'s")) {
          // Find the closest mention before the pronoun
          const lastMentionIndex = Math.max(
            textBeforePronounLower.lastIndexOf(charName),
            textBeforePronounLower.lastIndexOf(charName + "'s")
          );
          
          if (lastMentionIndex !== -1) {
            // Check if it's close enough (within 50 words or same sentence)
            const wordsBetween = textBeforePronoun.substring(lastMentionIndex).split(/\s+/).length;
            if (wordsBetween < 50) {
              suggestions[pronoun] = {
                characterId: char.id,
                reason: `"${char.name}" mentioned before "${pronoun}" in the same shot`
              };
              break;
            }
          }
        }
      }
    }
    
    // Strategy 2: Check previous shots for last mentioned character
    if (Object.keys(suggestions).length < pronouns.length) {
      const lastMentionedChar = findLastMentionedCharacter(shot.slot);
      if (lastMentionedChar) {
        for (const pronoun of pronouns) {
          if (!suggestions[pronoun]) {
            // Only suggest if pronoun is singular and matches gender (he/him/his for male, she/her/hers for female)
            const isMalePronoun = ['he', 'him', 'his'].includes(pronoun.toLowerCase());
            const isFemalePronoun = ['she', 'her', 'hers'].includes(pronoun.toLowerCase());
            
            // For now, suggest for all singular pronouns (we can add gender detection later)
            if (isMalePronoun || isFemalePronoun) {
              suggestions[pronoun] = {
                characterId: lastMentionedChar.id,
                reason: `"${lastMentionedChar.name}" was mentioned in previous shots`
              };
            }
          }
        }
      }
    }
    
    // Strategy 3: Single character in scene
    if (characters.length === 1 && Object.keys(suggestions).length < pronouns.length) {
      const singleChar = characters[0];
      for (const pronoun of pronouns) {
        if (!suggestions[pronoun]) {
          suggestions[pronoun] = {
            characterId: singleChar.id,
            reason: `Only one character in scene: "${singleChar.name}"`
          };
        }
      }
    }
    
    return suggestions;
  };

  // Get character for shot (dialogue or action with character mention)
  const getCharacterForShot = (shot: any) => {
    // Dialogue shot: use characterId
    if (shot.type === 'dialogue' && shot.characterId && sceneAnalysisResult?.characters) {
    return sceneAnalysisResult.characters.find((c: any) => c.id === shot.characterId);
    }
    
    // Action shot: detect character from description
    if (shot.type === 'action') {
      return getCharacterFromActionShot(shot);
    }
    
    return null;
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

                {/* Expanded Reference Selection (Dialogue Shots Only - Phase 1) */}
                {isExpanded && needsReferenceSelection(shot) && character && (
                  <div className="mt-3 pt-3 border-t border-[#3F3F46] space-y-3">
                    {/* Character Headshots */}
                    <div>
                      <div className="text-xs font-medium mb-2 text-[#808080]">
                        Character Headshot {character.name ? `(${character.name})` : ''}
                      </div>
                      {isLoadingHeadshots ? (
                        <div className="text-xs text-[#808080]">Loading headshots...</div>
                      ) : headshots.length > 0 ? (
                        <div>
                          {selectedOutfit && selectedOutfit !== 'default' && (
                            <div className="text-xs text-[#808080] mb-2">
                              Showing headshots for outfit: <span className="text-[#DC143C] font-medium">{selectedOutfit}</span>
                            </div>
                          )}
                          <div className="grid grid-cols-8 gap-1.5">
                          {headshots.map((headshot, idx) => {
                            // Use unique key: s3Key (most reliable) or imageUrl or poseId + idx fallback
                            const uniqueKey = headshot.s3Key || headshot.imageUrl || `${headshot.poseId || 'unknown'}-${idx}` || `headshot-${idx}`;
                            
                            // Check if this specific headshot is selected
                            // Priority: s3Key (unique per image) > imageUrl (unique per image) > poseId (may be shared)
                            // Only match by poseId if BOTH headshots lack s3Key AND imageUrl
                            const isSelected = selectedHeadshot && (
                              // Match by s3Key (most reliable, unique per image)
                              (headshot.s3Key && selectedHeadshot.s3Key && headshot.s3Key === selectedHeadshot.s3Key) ||
                              // Match by imageUrl (also unique per image, but less reliable than s3Key)
                              (headshot.imageUrl && selectedHeadshot.imageUrl && headshot.imageUrl === selectedHeadshot.imageUrl) ||
                              // Only match by poseId if neither has s3Key or imageUrl (rare case)
                              (!headshot.s3Key && !headshot.imageUrl && !selectedHeadshot.s3Key && !selectedHeadshot.imageUrl && 
                               headshot.poseId && selectedHeadshot.poseId && headshot.poseId === selectedHeadshot.poseId)
                            );
                            
                            return (
                              <button
                                key={uniqueKey}
                                onClick={() => {
                                  // Always store s3Key and imageUrl when available for precise matching
                                  // Store per-shot (not per-character) so each dialogue shot can have its own selection
                                  onCharacterReferenceChange(shot.slot, {
                                    poseId: headshot.poseId,
                                    s3Key: headshot.s3Key,
                                    imageUrl: headshot.imageUrl
                                  });
                                }}
                                className={`relative aspect-square rounded border-2 transition-all ${
                                  isSelected
                                    ? 'border-[#DC143C] ring-2 ring-[#DC143C]/50'
                                    : 'border-[#3F3F46] hover:border-[#808080]'
                                }`}
                              >
                                {headshot.imageUrl ? (
                                  <img
                                    src={headshot.imageUrl}
                                    alt={headshot.label || 'Headshot'}
                                    className="w-full h-full object-cover rounded"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center text-[10px] text-[#808080] rounded">
                                    {headshot.label || 'Headshot'}
                                  </div>
                                )}
                                {isSelected && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-[#DC143C]/20">
                                    <Check className="w-4 h-4 text-[#DC143C]" />
                                  </div>
                                )}
                                {idx === 0 && !isSelected && (
                                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[#DC143C]/80 text-[8px] text-white rounded">
                                    Recommended
                                  </div>
                                )}
                              </button>
                            );
                          })}
                          </div>
                        </div>
                      ) : selectedOutfit && selectedOutfit !== 'default' ? (
                        <div className="text-xs text-[#808080]">
                          No headshots available for outfit "{selectedOutfit}". 
                          <button 
                            onClick={() => onCharacterOutfitChange(shot.characterId, undefined)}
                            className="ml-1 text-[#DC143C] hover:underline"
                          >
                            Show all headshots
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-[#808080]">
                          No headshots available - using automatic selection
                        </div>
                      )}
                    </div>

                    {/* Character Outfit */}
                    {character && (() => {
                      // Debug logging
                      console.log(`[UnifiedSceneConfiguration] Rendering outfit selector for ${character.name}:`, {
                        characterId: character.id,
                        availableOutfits: character.availableOutfits,
                        availableOutfitsLength: character.availableOutfits?.length || 0,
                        defaultOutfit: character.defaultOutfit,
                        selectedOutfit: selectedOutfit,
                        fullCharacter: character
                      });
                      
                      return (
                        <div>
                          <CharacterOutfitSelector
                            characterId={character.id}
                            characterName={character.name}
                            availableOutfits={character.availableOutfits || []}
                            defaultOutfit={character.defaultOutfit}
                            selectedOutfit={selectedOutfit}
                            onOutfitChange={(charId, outfitName) => {
                              console.log(`[UnifiedSceneConfiguration] Outfit change callback for ${character.name}:`, {
                                characterId: charId,
                                outfitName: outfitName || 'undefined (use default)',
                                previousOutfit: selectedOutfit
                              });
                              onCharacterOutfitChange(charId, outfitName || undefined);
                            }}
                          />
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Phase 2: Location Angle Selection (All Shot Types) */}
                {isExpanded && (() => {
                  const shouldShow = needsLocationAngle(shot) && sceneAnalysisResult?.location?.id && onLocationAngleChange;
                  if (shouldShow) {
                    console.log(`[UnifiedSceneConfig] Showing location angle selector for shot ${shot.slot} (${shot.type}):`, {
                      locationId: sceneAnalysisResult.location.id,
                      hasAngleVariations: !!sceneAnalysisResult.location.angleVariations,
                      angleVariationsCount: sceneAnalysisResult.location.angleVariations?.length || 0
                    });
                  } else {
                    console.log(`[UnifiedSceneConfig] NOT showing location angle selector for shot ${shot.slot} (${shot.type}):`, {
                      needsLocationAngle: needsLocationAngle(shot),
                      hasLocationId: !!sceneAnalysisResult?.location?.id,
                      hasOnLocationAngleChange: !!onLocationAngleChange,
                      isExpanded: isExpanded
                    });
                  }
                  return shouldShow;
                })() && (
                  <div className="mt-3 pt-3 border-t border-[#3F3F46]">
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

                {/* Pronoun Detection: Action Shots with Pronouns */}
                {isExpanded && shot.type === 'action' && (() => {
                  const pronounInfo = actionShotHasPronouns(shot);
                  if (!pronounInfo.hasPronouns || !onCharactersForShotChange || !sceneAnalysisResult?.characters) {
                    return null;
                  }
                  
                  const selectedCharIds = selectedCharactersForShots[shot.slot] || [];
                  const shotMappings = pronounMappingsForShots[shot.slot] || {};
                  const unmappedPronouns = pronounInfo.pronouns.filter(p => !shotMappings[p.toLowerCase()]);
                  
                  // Auto-resolve pronouns when characters are selected but pronouns aren't mapped yet
                  // This will be handled by a separate component/effect in the parent
                  
                  // Show CharacterSelector when pronouns are detected
                  // Even if there's an explicit character, pronouns may refer to other characters
                  // Example: "She glances at it, then back at her editor, he is not really listening"
                  // - "She" and "her" refer to Sarah
                  // - "he" refers to the editor
                  // User needs to map pronouns to characters
                  
                  // Determine max selection based on pronoun types detected
                  // Goal: Each unique pronoun should align with a character reference
                  // - Each unique singular pronoun = 1 character (e.g., "she", "him", "her" = 3 characters)
                  // - Plural pronouns = can be multiple, but may refer to same people as singular pronouns
                  // - If both singular and plural: base = singular count, add 1-2 for potential additional people in "they"
                  const singularPronouns = ['she', 'her', 'hers', 'he', 'him', 'his'];
                  const pluralPronouns = ['they', 'them', 'their', 'theirs'];
                  
                  const uniquePronouns = pronounInfo.pronouns.map(p => p.toLowerCase());
                  const hasPlural = uniquePronouns.some(p => pluralPronouns.includes(p));
                  const uniqueSingularCount = uniquePronouns.filter(p => singularPronouns.includes(p)).length;
                  
                  // Logic:
                  // - If only singular pronouns: exactly 1 per unique pronoun (e.g., "She argues with him" = 2)
                  // - If only plural pronouns: up to 5 (e.g., "They exchange a look" = up to 5)
                  // - If both: singular count + 1-2 additional for potential extra people in "they" (max 5)
                  //   Example: "She argues with him and her while they watch" = 3 singular + 1-2 for "they" = 4-5 max
                  let maxSelection: number;
                  if (hasPlural && uniqueSingularCount > 0) {
                    // Mixed: singular pronouns + plural
                    // Base = singular count (each needs 1 character)
                    // Add 1-2 for potential additional people in "they" (in case "they" includes extras)
                    // User maps: each singular pronoun = 1 character, plural pronoun = remaining characters (up to 5 total)
                    maxSelection = Math.min(uniqueSingularCount + 2, 5);
                  } else if (hasPlural) {
                    // Only plural pronouns
                    maxSelection = 5;
                  } else {
                    // Only singular pronouns: exactly 1 per unique pronoun
                    maxSelection = Math.min(uniqueSingularCount, 5);
                  }
                  
                  // Check for unmapped pronouns and show validation warning
                  const allPronounsMapped = pronounInfo.pronouns.every(p => shotMappings[p.toLowerCase()]);
                  const unmappedCount = unmappedPronouns.length;
                  
                  return (
                    <div className="mt-3 pt-3 border-t border-[#3F3F46] space-y-3">
                      {/* Validation Warning for Unmapped Pronouns */}
                      {!allPronounsMapped && selectedCharIds.length > 0 && (
                        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-yellow-200">
                                {unmappedCount === 1 
                                  ? `1 pronoun not mapped: "${unmappedPronouns[0]}"`
                                  : `${unmappedCount} pronouns not mapped: "${unmappedPronouns.join('", "')}"`
                                }
                              </p>
                              <p className="text-[10px] text-yellow-300/80 mt-1">
                                Please map all pronouns to characters using the badges below, or generation may use fallback logic.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Auto-resolution Confirmations */}
                      {(() => {
                        const suggestions = autoResolvePronouns(shot, unmappedPronouns);
                        const confirmations: React.ReactNode[] = [];
                        
                        for (const [pronoun, suggestion] of Object.entries(suggestions)) {
                          const char = sceneAnalysisResult?.characters.find((c: any) => c.id === suggestion.characterId);
                          if (char && !shotMappings[pronoun.toLowerCase()] && selectedCharIds.includes(suggestion.characterId)) {
                            confirmations.push(
                              <div key={pronoun} className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-2.5 flex items-start gap-2">
                                <Sparkles className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-blue-200">
                                    Auto-mapped <strong className="text-blue-100">"{pronoun}"</strong> to <strong className="text-blue-100">{char.name}</strong>
                                  </p>
                                  <p className="text-[10px] text-blue-300/80 mt-0.5">
                                    {suggestion.reason}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      if (onPronounMappingChange) {
                                        onPronounMappingChange(shot.slot, pronoun.toLowerCase(), suggestion.characterId);
                                      }
                                    }}
                                    className="px-2 py-1 text-[10px] bg-blue-700 hover:bg-blue-600 text-white rounded transition-colors"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => {
                                      // User can manually map later via badges
                                    }}
                                    className="px-2 py-1 text-[10px] bg-[#3F3F46] hover:bg-[#4F4F56] text-[#808080] rounded transition-colors"
                                  >
                                    Dismiss
                                  </button>
                                </div>
                              </div>
                            );
                          }
                        }
                        
                        return confirmations.length > 0 ? (
                          <div className="space-y-2">
                            {confirmations}
                          </div>
                        ) : null;
                      })()}
                      
                      <CharacterSelector
                        characters={allCharacters.length > 0 ? allCharacters : sceneAnalysisResult.characters}
                        selectedCharacterIds={selectedCharIds}
                        onSelectionChange={(characterIds) => {
                          if (onCharactersForShotChange) {
                            onCharactersForShotChange(shot.slot, characterIds);
                          }
                        }}
                        maxSelection={maxSelection}
                        isRequired={false}
                        warningMessage={`Pronouns detected: "${pronounInfo.pronouns.join('", "')}". Please select which character(s) these pronouns refer to.`}
                      />
                      
                      {/* Show headshots and outfit selectors for selected characters */}
                      {selectedCharIds.length > 0 && (
                        <div className="space-y-3">
                          {selectedCharIds.map((charId) => {
                            const char = sceneAnalysisResult.characters.find((c: any) => c.id === charId);
                            if (!char) return null;
                            
                            const headshots = characterHeadshots[charId] || [];
                            const selectedHeadshot = selectedCharacterReferences[shot.slot];
                            const selectedOutfit = characterOutfits[charId];
                            
                            // Get pronoun mappings for this shot and character
                            const shotMappings = pronounMappingsForShots[shot.slot] || {};
                            const pronounsForThisChar = Object.entries(shotMappings)
                              .filter(([_, mappedCharId]) => mappedCharId === charId)
                              .map(([pronoun]) => pronoun);
                            
                            return (
                              <div key={charId} className="space-y-2 pt-2 border-t border-[#3F3F46]">
                                <div className="flex items-center justify-between">
                                  <div className="text-xs font-medium text-[#808080]">
                                    Character Headshot ({char.name})
                                  </div>
                                  
                                  {/* Pronoun Badges */}
                                  {pronounInfo.pronouns.length > 0 && (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[10px] text-[#808080]">Map pronouns:</span>
                                      {pronounInfo.pronouns.map((pronoun) => {
                                        const isMapped = shotMappings[pronoun.toLowerCase()] === charId;
                                        return (
                                          <button
                                            key={pronoun}
                                            onClick={() => {
                                              if (onPronounMappingChange) {
                                                // Toggle: if already mapped to this char, unmap; otherwise map to this char
                                                onPronounMappingChange(
                                                  shot.slot,
                                                  pronoun.toLowerCase(),
                                                  isMapped ? undefined : charId
                                                );
                                              }
                                            }}
                                            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                                              isMapped
                                                ? 'bg-[#DC143C] text-white border border-[#DC143C]'
                                                : 'bg-[#3F3F46] text-[#808080] border border-[#3F3F46] hover:border-[#DC143C] hover:text-[#DC143C]'
                                            }`}
                                            title={isMapped ? `"${pronoun}" mapped to ${char.name} - Click to remove` : `Click to map "${pronoun}" to ${char.name}`}
                                          >
                                            {pronoun}
                                            {isMapped && <Check className="w-2.5 h-2.5 inline-block ml-1" />}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                                
                                {loadingHeadshots[charId] ? (
                                  <div className="text-xs text-[#808080]">Loading headshots...</div>
                                ) : headshots.length > 0 ? (
                                  <div>
                                    {selectedOutfit && selectedOutfit !== 'default' && (
                                      <div className="text-xs text-[#808080] mb-2">
                                        Showing headshots for outfit: <span className="text-[#DC143C] font-medium">{selectedOutfit}</span>
                                      </div>
                                    )}
                                    <div className="grid grid-cols-8 gap-1.5">
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
                                              onCharacterReferenceChange(shot.slot, newRef);
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
                                                <Check className="w-4 h-4 text-[#DC143C]" />
                                              </div>
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-xs text-[#808080]">
                                    No headshots available - using automatic selection
                                  </div>
                                )}
                                
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
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
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

