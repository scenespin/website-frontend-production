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
  sceneProps?: Array<{ id: string; name: string; imageUrl?: string; s3Key?: string }>;
  propsToShots?: Record<string, number[]>;
  onPropsToShotsChange?: (propsToShots: Record<string, number[]>) => void;
  shotProps?: Record<number, Record<string, { selectedImageId?: string; usageDescription?: string }>>;
  onPropDescriptionChange?: (shotSlot: number, propId: string, description: string) => void;
  // Navigation
  onPrevious: () => void;
  onNext: () => void;
  // Shot navigation (for ShotNavigatorList)
  onShotSelect?: (shotSlot: number) => void;
  enabledShots?: number[];
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
  onPrevious,
  onNext,
  onShotSelect,
  enabledShots = [],
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

  // Validate location requirement before allowing next
  const handleNext = () => {
    // Check if location is required but not selected/opted out
    if (isLocationAngleRequired(shot) && needsLocationAngle(shot)) {
      const hasLocation = selectedLocationReferences[shot.slot] !== undefined;
      const hasOptOut = locationOptOuts[shot.slot] === true;
      
      if (!hasLocation && !hasOptOut) {
        toast.error('Location image required', {
          description: 'Please select a location image or check "Don\'t use location image" to continue.',
          duration: 5000
        });
        return;
      }
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
    <div className={isMobile ? "space-y-4" : "grid grid-cols-1 lg:grid-cols-2 gap-4 items-start"}>
      {/* Shot Navigator (Left side on desktop, top on mobile) */}
      {onShotSelect && (
        <div className={isMobile ? "w-full" : "flex flex-col"}>
          <label className="text-xs font-medium mb-2 block text-[#808080]">
            Select Shot
          </label>
          <ShotNavigatorList
            shots={enabledShotsList}
            currentShotSlot={shot.slot}
            onShotSelect={onShotSelect}
            isMobile={isMobile}
          />
        </div>
      )}
      
      {/* Shot Configuration (Right side on desktop, bottom on mobile) */}
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
          {/* Shot Description */}
          <div className="pb-3 border-b border-[#3F3F46]">
            <div className="text-xs font-medium text-[#FFFFFF] mb-2">Shot Description</div>
            <div className="text-xs text-[#808080]">
              {shot.description || shot.dialogueBlock?.dialogue || shot.narrationBlock?.text || 'No description'}
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
              disabled={isTransitioning || shotIndex === 0}
              variant="outline"
              className="flex-1 border-[#3F3F46] text-[#FFFFFF] hover:bg-[#1A1A1A]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
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
  );
}

