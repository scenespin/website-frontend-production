'use client';

/**
 * ShotConfigurationStep - Individual shot configuration step in wizard
 * 
 * Shows one shot at a time with all configuration options
 * Navigation: Previous/Next buttons, progress indicator
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Film, Check } from 'lucide-react';
import { SceneAnalysisResult } from '@/types/screenplay';
import { ShotConfigurationPanel } from './ShotConfigurationPanel';
import { ShotNavigatorList } from './ShotNavigatorList';
import { categorizeCharacters } from './utils/characterCategorization';
import { getCharactersFromActionShot } from './utils/sceneBuilderUtils';
import { toast } from 'sonner';
import { SceneBuilderService } from '@/services/SceneBuilderService';
import { useAuth } from '@clerk/nextjs';

interface ShotConfigurationStepProps {
  shot: any;
  sceneAnalysisResult: SceneAnalysisResult;
  shotIndex: number;
  totalShots: number;
  // Character categorization
  explicitCharacters: string[];
  singularPronounCharacters: string[];
  pluralPronounCharacters: string[];
  shotMappings: Record<string, string | string[]>;
  hasPronouns: boolean;
  pronounInfo: { hasPronouns: boolean; pronouns: string[] };
  // Character rendering helpers
  renderCharacterControlsOnly: (charId: string, shotSlot: number, shotMappings: Record<string, string | string[]>, hasPronouns: boolean, category: 'explicit' | 'singular' | 'plural') => React.ReactNode;
  renderCharacterImagesOnly: (charId: string, shotSlot: number, pronounsForChar?: string[]) => React.ReactNode;
  // Location
  selectedLocationReferences: Record<number, { angleId?: string; s3Key?: string; imageUrl?: string }>;
  onLocationAngleChange?: (shotSlot: number, locationId: string, angle: { angleId?: string; s3Key?: string; imageUrl?: string } | undefined) => void;
  isLocationAngleRequired: (shot: any) => boolean;
  needsLocationAngle: (shot: any) => boolean;
  locationOptOuts?: Record<number, boolean>;
  onLocationOptOutChange?: (shotSlot: number, optOut: boolean) => void;
  locationDescriptions?: Record<number, string>;
  onLocationDescriptionChange?: (shotSlot: number, description: string) => void;
  // Character data
  allCharacters: any[];
  selectedCharactersForShots: Record<number, string[]>;
  onCharactersForShotChange?: (shotSlot: number, characterIds: string[]) => void;
  onPronounMappingChange?: (shotSlot: number, pronoun: string, characterId: string | string[] | undefined) => void;
  characterHeadshots: Record<string, Array<{ poseId?: string; s3Key: string; imageUrl: string; label?: string; priority?: number; outfitName?: string }>>;
  loadingHeadshots: Record<string, boolean>;
  selectedCharacterReferences: Record<number, Record<string, { poseId?: string; s3Key?: string; imageUrl?: string }>>;
  characterOutfits: Record<number, Record<string, string>>;
  onCharacterReferenceChange: (shotSlot: number, characterId: string, reference: { poseId?: string; s3Key?: string; imageUrl?: string } | undefined) => void;
  onCharacterOutfitChange: (shotSlot: number, characterId: string, outfitName: string | undefined) => void;
  // Dialogue workflows
  selectedDialogueWorkflow?: string;
  onDialogueWorkflowChange?: (shotSlot: number, workflowType: string) => void;
  dialogueWorkflowPrompt?: string;
  onDialogueWorkflowPromptChange?: (shotSlot: number, prompt: string) => void;
  // Pronoun extras
  pronounExtrasPrompts?: Record<string, string>;
  onPronounExtrasPromptChange?: (pronoun: string, prompt: string) => void;
  // Model Style (global only, no per-shot resolution)
  globalStyle?: 'cinematic' | 'photorealistic' | 'auto';
  shotStyle?: 'cinematic' | 'photorealistic' | 'auto';
  onStyleChange?: (shotSlot: number, style: 'cinematic' | 'photorealistic' | 'auto' | undefined) => void;
  // Camera Angle
  shotCameraAngle?: 'close-up' | 'medium-shot' | 'wide-shot' | 'extreme-close-up' | 'extreme-wide-shot' | 'over-the-shoulder' | 'low-angle' | 'high-angle' | 'dutch-angle' | 'auto';
  onCameraAngleChange?: (shotSlot: number, angle: 'close-up' | 'medium-shot' | 'wide-shot' | 'extreme-close-up' | 'extreme-wide-shot' | 'over-the-shoulder' | 'low-angle' | 'high-angle' | 'dutch-angle' | 'auto' | undefined) => void;
  // Shot Duration
  shotDuration?: 'quick-cut' | 'extended-take';
  onDurationChange?: (shotSlot: number, duration: 'quick-cut' | 'extended-take' | undefined) => void;
  // Props
  sceneProps?: Array<{ 
    id: string; 
    name: string; 
    imageUrl?: string; 
    s3Key?: string;
    angleReferences?: Array<{ id: string; s3Key: string; imageUrl: string; label?: string }>;
    images?: Array<{ url: string; s3Key?: string }>;
  }>;
  propsToShots?: Record<string, number[]>;
  onPropsToShotsChange?: (propsToShots: Record<string, number[]>) => void;
  shotProps?: Record<number, Record<string, { selectedImageId?: string; usageDescription?: string }>>;
  onPropDescriptionChange?: (shotSlot: number, propId: string, description: string) => void;
  onPropImageChange?: (shotSlot: number, propId: string, imageId: string | undefined) => void;
  // Navigation
  onPrevious: () => void;
  onNext: () => void;
  // Shot navigation (for ShotNavigatorList)
  onShotSelect?: (shotSlot: number) => void;
  enabledShots?: number[];
  completedShots?: Set<number>; // Shots that are completely filled out
  isMobile?: boolean;
}

export function ShotConfigurationStep({
  shot,
  sceneAnalysisResult,
  shotIndex,
  totalShots,
  explicitCharacters,
  singularPronounCharacters,
  pluralPronounCharacters,
  shotMappings,
  hasPronouns,
  pronounInfo,
  renderCharacterControlsOnly,
  renderCharacterImagesOnly,
  selectedLocationReferences,
  onLocationAngleChange,
  isLocationAngleRequired,
  needsLocationAngle,
  locationOptOuts = {},
  onLocationOptOutChange,
  locationDescriptions = {},
  onLocationDescriptionChange,
  allCharacters,
  selectedCharactersForShots,
  onCharactersForShotChange,
  onPronounMappingChange,
  characterHeadshots,
  loadingHeadshots,
  selectedCharacterReferences,
  characterOutfits,
  onCharacterReferenceChange,
  onCharacterOutfitChange,
  selectedDialogueWorkflow,
  onDialogueWorkflowChange,
  dialogueWorkflowPrompt,
  onDialogueWorkflowPromptChange,
  pronounExtrasPrompts = {},
  onPronounExtrasPromptChange,
  globalStyle = 'auto',
  shotStyle,
  onStyleChange,
  shotCameraAngle,
  onCameraAngleChange,
  shotDuration,
  onDurationChange,
  sceneProps = [],
  propsToShots = {},
  onPropsToShotsChange,
  shotProps = {},
  onPropDescriptionChange,
  onPropImageChange,
  onPrevious,
  onNext,
  onShotSelect,
  enabledShots = [],
  completedShots = new Set(),
  isMobile = false
}: ShotConfigurationStepProps) {
  const { getToken } = useAuth();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pricing, setPricing] = useState<{ hdPrice: number; k4Price: number } | null>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  
  // Fetch pricing from backend (server-side margin calculation)
  useEffect(() => {
    const fetchPricing = async () => {
      if (!shot?.credits) return;
      
      setIsLoadingPricing(true);
      try {
        const pricingResult = await SceneBuilderService.calculatePricing(
          [{ slot: shot.slot, credits: shot.credits }],
          shotDuration ? { [shot.slot]: shotDuration } : undefined,
          getToken
        );
        
        const shotPricing = pricingResult.shots.find(s => s.shotSlot === shot.slot);
        if (shotPricing) {
          setPricing({ hdPrice: shotPricing.hdPrice, k4Price: shotPricing.k4Price });
        }
      } catch (error) {
        console.error('Failed to fetch pricing:', error);
        // Fallback: don't show pricing if fetch fails
        setPricing(null);
      } finally {
        setIsLoadingPricing(false);
      }
    };
    
    fetchPricing();
  }, [shot?.slot, shot?.credits, shotDuration, getToken]);

  // Validate shot completion before allowing next
  const handleNext = () => {
    const validationErrors: string[] = [];
    
    // 1. Validate location requirement
    if (isLocationAngleRequired(shot) && needsLocationAngle(shot)) {
      const hasLocation = selectedLocationReferences[shot.slot] !== undefined;
      const hasOptOut = locationOptOuts[shot.slot] === true;
      
      if (!hasLocation && !hasOptOut) {
        validationErrors.push('Location image required. Please select a location image or check "Don\'t use location image" to continue.');
      }
      
      // If opted out, location description is required
      if (hasOptOut && (!locationDescriptions || !locationDescriptions[shot.slot] || locationDescriptions[shot.slot].trim() === '')) {
        validationErrors.push('Location description is required when "Don\'t use location image" is checked.');
      }
    }
    
    // 2. Validate character headshots (required - no checkbox override)
    // Collect all character IDs for this shot
    const shotCharacterIds = new Set<string>();
    
    // Add explicit characters from dialogue
    if (shot.type === 'dialogue' && shot.dialogueBlock?.character) {
      const dialogueChar = sceneAnalysisResult?.characters?.find((c: any) => 
        c.name?.toUpperCase().trim() === shot.dialogueBlock.character?.toUpperCase().trim()
      );
      if (dialogueChar) shotCharacterIds.add(dialogueChar.id);
    }
    
    // Add explicit characters from action shots
    if (shot.type === 'action' && shot.characterId) {
      shotCharacterIds.add(shot.characterId);
    }
    
    // Add explicit characters from action shots (detected from text)
    if (shot.type === 'action') {
      const actionChars = getCharactersFromActionShot(shot, sceneAnalysisResult);
      actionChars.forEach((char: any) => shotCharacterIds.add(char.id));
    }
    
    // Add characters from pronoun mappings (but not skipped ones)
    // shotMappings is already a prop that contains mappings for this shot
    for (const [pronoun, mapping] of Object.entries(shotMappings || {})) {
      if (mapping && mapping !== '__ignore__') {
        if (Array.isArray(mapping)) {
          mapping.forEach(charId => shotCharacterIds.add(charId));
        } else {
          shotCharacterIds.add(mapping);
        }
      }
    }
    
    // Add additional characters for dialogue workflows
    const additionalChars = selectedCharactersForShots[shot.slot] || [];
    additionalChars.forEach(charId => shotCharacterIds.add(charId));
    
    // Check each character has headshots
    for (const charId of shotCharacterIds) {
      if (!charId || charId === '__ignore__') continue;
      
      const headshots = characterHeadshots[charId] || [];
      const hasSelectedReference = selectedCharacterReferences[shot.slot]?.[charId] !== undefined;
      
      // Character must have headshots available OR a selected reference
      if (headshots.length === 0 && !hasSelectedReference) {
        const char = sceneAnalysisResult?.characters?.find((c: any) => c.id === charId);
        const charName = char?.name || 'Character';
        validationErrors.push(
          `${charName} requires a character image. Please add headshots in the Character Bank (Production Hub) or Creation Hub, or upload images.`
        );
      }
    }
    
    // 3. Validate ALL pronouns are mapped (singular and plural)
    // Each pronoun must either be:
    //   a) Mapped to a character (valid character ID or array of IDs)
    //   b) Skipped with a description (__ignore__ + description in pronounExtrasPrompts)
    if (pronounInfo.hasPronouns && pronounInfo.pronouns.length > 0) {
      const unmappedPronouns: string[] = [];
      
      for (const pronoun of pronounInfo.pronouns) {
        const pronounLower = pronoun.toLowerCase();
        const mapping = shotMappings[pronounLower];
        
        // Check if pronoun is mapped to a character
        const isMappedToCharacter = mapping && 
          mapping !== '__ignore__' && 
          (Array.isArray(mapping) ? mapping.length > 0 : true);
        
        // Check if pronoun is skipped with description
        const isSkippedWithDescription = mapping === '__ignore__' && 
          pronounExtrasPrompts[pronounLower] && 
          pronounExtrasPrompts[pronounLower].trim() !== '';
        
        // Pronoun must be either mapped OR skipped with description
        if (!isMappedToCharacter && !isSkippedWithDescription) {
          unmappedPronouns.push(pronoun);
        }
      }
      
      if (unmappedPronouns.length > 0) {
        if (unmappedPronouns.length === 1) {
          validationErrors.push(
            `Pronoun "${unmappedPronouns[0]}" must be mapped to a character, or if skipped, a description is required.`
          );
        } else {
          validationErrors.push(
            `Pronouns "${unmappedPronouns.join('", "')}" must be mapped to characters, or if skipped, descriptions are required.`
          );
        }
      }
    }
    
    // Show validation errors if any
    if (validationErrors.length > 0) {
      toast.error('Please complete all required fields', {
        description: validationErrors.join(' '),
        duration: 8000
      });
      return;
    }
    
    // Scroll to top immediately
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Add transition animation
    setIsTransitioning(true);
    setTimeout(() => {
      onNext();
      setIsTransitioning(false);
    }, 800); // 0.8 second transition
  };

  const handlePrevious = () => {
    // Scroll to top immediately
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    setIsTransitioning(true);
    setTimeout(() => {
      onPrevious();
      setIsTransitioning(false);
    }, 800);
  };

  const shots = sceneAnalysisResult.shotBreakdown?.shots || [];
  const enabledShotsList = shots.filter(s => enabledShots.includes(s.slot));

  return (
    <div className={isMobile ? "space-y-4" : "grid grid-cols-3 gap-4 items-start"}>
      {/* Shot Navigator (Left side: 1/3 width on desktop, top on mobile) */}
      {onShotSelect && (
        <div className={isMobile ? "w-full" : "sticky top-4 flex flex-col"}>
          <label className="text-xs font-medium mb-2 block text-[#808080]">
            Select Shot
          </label>
          <ShotNavigatorList
            shots={enabledShotsList}
            currentShotSlot={shot.slot}
            onShotSelect={(shotSlot) => {
              // Only allow navigation if shot is navigable (will be checked in navigator)
              // Trigger fade transition when clicking shot
              setIsTransitioning(true);
              setTimeout(() => {
                onShotSelect(shotSlot);
                setIsTransitioning(false);
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'instant' });
              }, 800);
            }}
            isMobile={isMobile}
            completedShots={completedShots}
            enabledShots={enabledShots}
          />
        </div>
      )}
      
      {/* Shot Configuration (Right side: 2/3 width on desktop, bottom on mobile) */}
      <div className={isMobile ? "w-full" : "col-span-2"}>
        <div className={`space-y-4 transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <Card className="bg-[#141414] border-[#3F3F46]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm text-[#FFFFFF] flex items-center gap-2">
                <Film className="w-4 h-4" />
                Shot {shot.slot} Configuration
              </CardTitle>
              <CardDescription className="text-[10px] text-[#808080] mt-1">
                {shot.type === 'dialogue' ? 'Dialogue' : 'Action'} Shot • Step {shotIndex + 1} of {totalShots}
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] ${
                shot.type === 'dialogue'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-green-500 text-green-400'
              }`}
            >
              {shot.type === 'dialogue' ? 'Dialogue' : 'Action'}
            </Badge>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center gap-1 mt-3">
            {Array.from({ length: totalShots }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded ${
                  idx < shotIndex
                    ? 'bg-green-500'
                    : idx === shotIndex
                    ? 'bg-[#DC143C]'
                    : 'bg-[#3F3F46]'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Shot Description - Full text, no truncation */}
          <div className="pb-3 border-b border-[#3F3F46]">
            <div className="text-xs font-medium text-[#FFFFFF] mb-2">Shot Description</div>
            <div className="text-xs text-[#808080] break-words whitespace-pre-wrap">
              {shot.narrationBlock?.text || shot.dialogueBlock?.dialogue || shot.description || 'No description'}
            </div>
          </div>

          {/* Shot Configuration Panel */}
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
            locationOptOuts={locationOptOuts}
            onLocationOptOutChange={onLocationOptOutChange}
            locationDescriptions={locationDescriptions}
            onLocationDescriptionChange={onLocationDescriptionChange}
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
            selectedDialogueWorkflow={selectedDialogueWorkflow}
            onDialogueWorkflowChange={onDialogueWorkflowChange}
            dialogueWorkflowPrompt={dialogueWorkflowPrompt}
            onDialogueWorkflowPromptChange={onDialogueWorkflowPromptChange}
            pronounExtrasPrompts={pronounExtrasPrompts}
            onPronounExtrasPromptChange={onPronounExtrasPromptChange}
            globalStyle={globalStyle}
            shotStyle={shotStyle}
            onStyleChange={onStyleChange}
            shotCameraAngle={shotCameraAngle}
            onCameraAngleChange={onCameraAngleChange}
            shotDuration={shotDuration}
            onDurationChange={onDurationChange}
            sceneProps={sceneProps}
            propsToShots={propsToShots}
            onPropsToShotsChange={onPropsToShotsChange}
            shotProps={shotProps}
            onPropDescriptionChange={onPropDescriptionChange}
            onPropImageChange={onPropImageChange}
          />

          {/* Cost Calculator - Prices from backend (margins hidden) */}
          {pricing && (
            <div className="pt-3 border-t border-[#3F3F46]">
              <div className="text-xs font-medium text-[#FFFFFF] mb-2">Estimated Cost</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#808080]">HD:</span>
                  <span className="text-[#FFFFFF] font-medium">{pricing.hdPrice} credits</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#808080]">4K:</span>
                  <span className="text-[#FFFFFF] font-medium">{pricing.k4Price} credits</span>
                </div>
                <div className="text-[10px] text-[#808080] italic mt-1">
                  Final resolution selected on review page
                </div>
              </div>
            </div>
          )}
          {isLoadingPricing && (
            <div className="pt-3 border-t border-[#3F3F46]">
              <div className="text-xs text-[#808080]">Loading pricing...</div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-3 border-t border-[#3F3F46]">
            <Button
              onClick={handlePrevious}
              disabled={isTransitioning}
              variant="outline"
              className="flex-1 border-[#3F3F46] text-[#FFFFFF] hover:bg-[#1A1A1A]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {shotIndex === 0 ? 'Back to Analysis' : 'Previous'}
            </Button>
            <Button
              onClick={handleNext}
              disabled={isTransitioning}
              className="flex-1 bg-[#DC143C] hover:bg-[#B91238] text-white"
            >
              {shotIndex === totalShots - 1 ? 'Review' : 'Next Shot'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
}

