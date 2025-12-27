'use client';

/**
 * ShotConfigurationStep - Individual shot configuration step in wizard
 * 
 * Shows one shot at a time with all configuration options
 * Navigation: Previous/Next buttons, progress indicator
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Film, Check } from 'lucide-react';
import { SceneAnalysisResult } from '@/types/screenplay';
import { ShotConfigurationPanel } from './ShotConfigurationPanel';
import { categorizeCharacters } from './utils/characterCategorization';
import { toast } from 'sonner';

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
  // Props
  sceneProps?: Array<{ id: string; name: string; imageUrl?: string; s3Key?: string }>;
  propsToShots?: Record<string, number[]>;
  shotProps?: Record<number, Record<string, { selectedImageId?: string; usageDescription?: string }>>;
  onPropDescriptionChange?: (shotSlot: number, propId: string, description: string) => void;
  // Navigation
  onPrevious: () => void;
  onNext: () => void;
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
  sceneProps = [],
  propsToShots = {},
  shotProps = {},
  onPropDescriptionChange,
  onPrevious,
  onNext
}: ShotConfigurationStepProps) {
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
    
    onNext();
  };

  return (
    <div className="space-y-4">
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
            sceneProps={sceneProps}
            propsToShots={propsToShots}
            shotProps={shotProps}
            onPropDescriptionChange={onPropDescriptionChange}
          />

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-3 border-t border-[#3F3F46]">
            <Button
              onClick={onPrevious}
              variant="outline"
              className="flex-1 border-[#3F3F46] text-[#FFFFFF] hover:bg-[#1A1A1A]"
              disabled={shotIndex === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
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

