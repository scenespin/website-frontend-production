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
import { Check, Sparkles, Coins, Clock, ChevronDown, ChevronUp, Film } from 'lucide-react';
import { SceneAnalysisResult } from '@/types/screenplay';
import { CharacterOutfitSelector } from './CharacterOutfitSelector';
import { LocationAngleSelector } from './LocationAngleSelector';

interface UnifiedSceneConfigurationProps {
  sceneAnalysisResult: SceneAnalysisResult | null;
  qualityTier: 'professional' | 'premium';
  onQualityTierChange: (tier: 'professional' | 'premium') => void;
  selectedCharacterReferences: Record<string, { poseId?: string; s3Key?: string; imageUrl?: string }>;
  onCharacterReferenceChange: (characterId: string, reference: { poseId?: string; s3Key?: string; imageUrl?: string } | undefined) => void;
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
      
      // Auto-expand dialogue shots to show headshots by default
      const dialogueShots = sceneAnalysisResult.shotBreakdown.shots.filter((shot: any) => shot.type === 'dialogue' && shot.characterId);
      const expanded: Record<number, boolean> = {};
      dialogueShots.forEach((shot: any) => {
        expanded[shot.slot] = true;
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

  // Check if shot type needs reference selection
  // Phase 1: dialogue shots (character headshots)
  // Phase 2: establishing/action/dialogue shots (location angles)
  const needsReferenceSelection = (shot: any): boolean => {
    const needsCharacter = shot.type === 'dialogue' && !!shot.characterId;
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

  // Get character for dialogue shot
  const getCharacterForShot = (shot: any) => {
    if (!shot.characterId || !sceneAnalysisResult?.characters) return null;
    return sceneAnalysisResult.characters.find((c: any) => c.id === shot.characterId);
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
            const allHeadshots = isDialogue && shot.characterId ? characterHeadshots[shot.characterId] || [] : [];
            const selectedOutfit = isDialogue && shot.characterId ? characterOutfits[shot.characterId] : undefined;
            
            // Filter headshots by selected outfit (if outfit is selected)
            const headshots = selectedOutfit && selectedOutfit !== 'default' 
              ? allHeadshots.filter((h: any) => {
                  const headshotOutfit = h.outfitName || h.metadata?.outfitName;
                  return headshotOutfit === selectedOutfit;
                })
              : allHeadshots; // Show all headshots if no outfit selected or using default
            
            const isLoadingHeadshots = isDialogue && shot.characterId ? loadingHeadshots[shot.characterId] : false;
            const selectedHeadshot = isDialogue && shot.characterId ? selectedCharacterReferences[shot.characterId] : undefined;

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

                    {/* Expandable Reference Selection (Phase 1: Dialogue shots only) */}
                    {needsReferenceSelection(shot) && character && (
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
                    )}
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
                          <div className="grid grid-cols-4 gap-2">
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
                                  onCharacterReferenceChange(shot.characterId, {
                                    poseId: headshot.poseId,
                                    s3Key: headshot.s3Key,
                                    imageUrl: headshot.imageUrl
                                  });
                                }}
                                className={`relative aspect-square rounded border-2 overflow-hidden transition-all ${
                                  isSelected
                                    ? 'border-[#DC143C] ring-2 ring-[#DC143C]/50'
                                    : 'border-[#3F3F46] hover:border-[#DC143C]'
                                }`}
                              >
                                {headshot.imageUrl ? (
                                  <img
                                    src={headshot.imageUrl}
                                    alt={headshot.label || 'Headshot'}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center text-[10px] text-[#808080]">
                                    {headshot.label || 'Headshot'}
                                  </div>
                                )}
                                {isSelected && (
                                  <div className="absolute top-1 right-1 w-4 h-4 bg-[#DC143C] rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
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
                    
                    {/* Phase 2: Location Angle Selection */}
                    {needsLocationAngle(shot) && sceneAnalysisResult?.location?.id && sceneAnalysisResult?.location?.angleVariations && onLocationAngleChange && (
                      <div className="mt-3 pt-3 border-t border-[#3F3F46]">
                        <LocationAngleSelector
                          locationId={sceneAnalysisResult.location.id}
                          locationName={sceneAnalysisResult.location.name || 'Location'}
                          angleVariations={sceneAnalysisResult.location.angleVariations}
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
                  </div>
                )}
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

