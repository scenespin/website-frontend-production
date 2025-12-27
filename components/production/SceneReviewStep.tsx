'use client';

/**
 * SceneReviewStep - Final step of Scene Builder Wizard
 * 
 * Features:
 * - Condensed view of all user selections
 * - Character mappings with thumbnails
 * - Pronoun mappings with thumbnails
 * - Location selections
 * - Props selections
 * - Style selections
 * - Camera angles
 * - Prompt text summaries
 * - Generate button
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Film, Sparkles, ArrowLeft, Play } from 'lucide-react';
import { SceneAnalysisResult } from '@/types/screenplay';
import type { ModelStyle, Resolution, CameraAngle } from './ShotConfigurationPanel';
import { SceneBuilderService } from '@/services/SceneBuilderService';
import { useAuth } from '@/contexts/AuthContext';

interface SceneReviewStepProps {
  sceneAnalysisResult: SceneAnalysisResult | null;
  enabledShots: number[];
  // Global settings
  globalStyle: ModelStyle;
  globalResolution: Resolution;
  onGlobalResolutionChange: (resolution: Resolution) => void;
  // Per-shot overrides (no resolution - global only, set in review step)
  shotStyles?: Record<number, ModelStyle>;
  shotCameraAngles?: Record<number, CameraAngle>;
  shotDurations?: Record<number, 'quick-cut' | 'extended-take'>;
  // Character mappings
  selectedCharacterReferences: Record<number, Record<string, { poseId?: string; s3Key?: string; imageUrl?: string }>>;
  characterOutfits: Record<number, Record<string, string>>;
  // Location
  selectedLocationReferences: Record<number, { angleId?: string; s3Key?: string; imageUrl?: string }>;
  // Dialogue workflows
  selectedDialogueWorkflows: Record<number, string>;
  dialogueWorkflowPrompts: Record<number, string>;
  // Pronoun mappings
  pronounMappingsForShots: Record<number, Record<string, string | string[]>>;
  pronounExtrasPrompts: Record<number, Record<string, string>>;
  selectedCharactersForShots: Record<number, string[]>;
  // Props
  sceneProps?: Array<{ id: string; name: string; imageUrl?: string; s3Key?: string }>;
  propsToShots: Record<string, number[]>;
  shotProps: Record<number, Record<string, { selectedImageId?: string; usageDescription?: string }>>;
  // Actions
  onBack: () => void;
  onGenerate: () => void;
  isGenerating?: boolean;
  allCharacters?: any[];
}

export function SceneReviewStep({
  sceneAnalysisResult,
  enabledShots,
  globalStyle,
  globalResolution,
  onGlobalResolutionChange,
  shotStyles = {},
  shotCameraAngles = {},
  shotDurations = {},
  selectedCharacterReferences,
  characterOutfits,
  selectedLocationReferences,
  selectedDialogueWorkflows,
  dialogueWorkflowPrompts,
  pronounMappingsForShots,
  pronounExtrasPrompts,
  selectedCharactersForShots,
  sceneProps = [],
  propsToShots,
  shotProps,
  onBack,
  onGenerate,
  isGenerating = false,
  allCharacters = []
}: SceneReviewStepProps) {
  const { getToken } = useAuth();
  const [pricing, setPricing] = useState<{ totalHdPrice: number; totalK4Price: number } | null>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  
  // Fetch pricing from backend (server-side margin calculation)
  useEffect(() => {
    const fetchPricing = async () => {
      if (!sceneAnalysisResult?.shotBreakdown?.shots) return;
      
      const selectedShots = sceneAnalysisResult.shotBreakdown.shots.filter((shot: any) => 
        enabledShots.includes(shot.slot)
      );
      
      if (selectedShots.length === 0) return;
      
      setIsLoadingPricing(true);
      try {
        const pricingResult = await SceneBuilderService.calculatePricing(
          selectedShots.map((shot: any) => ({ slot: shot.slot, credits: shot.credits || 0 })),
          shotDurations,
          getToken
        );
        
        setPricing({
          totalHdPrice: pricingResult.totalHdPrice,
          totalK4Price: pricingResult.totalK4Price
        });
      } catch (error) {
        console.error('Failed to fetch pricing:', error);
        setPricing(null);
      } finally {
        setIsLoadingPricing(false);
      }
    };
    
    fetchPricing();
  }, [sceneAnalysisResult?.shotBreakdown?.shots, enabledShots, shotDurations, getToken]);
  
  if (!sceneAnalysisResult) {
    return (
      <Card className="bg-[#141414] border-[#3F3F46]">
        <CardContent className="p-6 text-center">
          <div className="text-sm text-[#FFFFFF] mb-1">No Analysis Available</div>
          <div className="text-xs text-[#808080]">Please go back and analyze a scene</div>
        </CardContent>
      </Card>
    );
  }

  const shots = sceneAnalysisResult.shotBreakdown?.shots || [];
  const selectedShots = shots.filter((s: any) => enabledShots.includes(s.slot));

  const getCharacterName = (charId: string) => {
    const char = (allCharacters.length > 0 ? allCharacters : sceneAnalysisResult.characters || []).find((c: any) => c.id === charId);
    return char?.name || charId;
  };

  const getWorkflowLabel = (workflow: string) => {
    const labels: Record<string, string> = {
      'first-frame-lipsync': 'Dialogue (Lip Sync)',
      'off-frame-voiceover': 'Hidden Mouth Dialogue',
      'scene-voiceover': 'Narrate Shot'
    };
    return labels[workflow] || workflow;
  };

  return (
    <div className="space-y-4">
      <Card className="bg-[#141414] border-[#3F3F46]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-[#FFFFFF] flex items-center gap-2">
            <Check className="w-4 h-4" />
            Review & Generate
          </CardTitle>
          <CardDescription className="text-[10px] text-[#808080]">
            Review all your selections before generating the scene
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Shots Summary */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-[#FFFFFF]">
              Selected Shots ({selectedShots.length})
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {selectedShots.map((shot: any) => {
                const shotStyle = shotStyles[shot.slot];
                const shotCameraAngle = shotCameraAngles[shot.slot];
                const shotDuration = shotDurations[shot.slot] || 'quick-cut';
                const shotDialogueWorkflow = selectedDialogueWorkflows[shot.slot];
                const shotDialoguePrompt = dialogueWorkflowPrompts[shot.slot];
                const shotPronounMappings = pronounMappingsForShots[shot.slot] || {};
                const shotPronounExtras = pronounExtrasPrompts[shot.slot] || {};
                const shotCharacters = selectedCharactersForShots[shot.slot] || [];
                const shotCharacterRefs = selectedCharacterReferences[shot.slot] || {};
                const shotLocation = selectedLocationReferences[shot.slot];
                const shotPropsForShot = sceneProps.filter(prop => 
                  propsToShots[prop.id]?.includes(shot.slot)
                );
                const shotPropsConfig = shotProps[shot.slot] || {};

                return (
                  <div
                    key={shot.slot}
                    className="p-3 bg-[#0A0A0A] rounded border border-[#3F3F46] space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          shot.type === 'dialogue'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-green-500 text-green-400'
                        }`}
                      >
                        Shot {shot.slot}: {shot.type === 'dialogue' ? 'Dialogue' : 'Action'}
                      </Badge>
                    </div>

                    {/* Shot Overrides */}
                    {(shotStyle || shotCameraAngle) && (
                      <div className="text-[10px] text-[#808080] space-y-1">
                        {shotStyle && (
                          <div>Style: <span className="text-[#FFFFFF]">{shotStyle}</span> (override)</div>
                        )}
                        {shotCameraAngle && shotCameraAngle !== 'auto' && (
                          <div>Camera: <span className="text-[#FFFFFF]">{shotCameraAngle.replace('-', ' ')}</span></div>
                        )}
                      </div>
                    )}

                    {/* Dialogue Workflow */}
                    {shotDialogueWorkflow && (
                      <div className="text-[10px] text-[#808080]">
                        Workflow: <span className="text-[#FFFFFF]">{getWorkflowLabel(shotDialogueWorkflow)}</span>
                        {shotDialoguePrompt && (
                          <div className="mt-1 text-[#808080] italic">"{shotDialoguePrompt.substring(0, 50)}..."</div>
                        )}
                      </div>
                    )}

                    {/* Characters */}
                    {Object.keys(shotCharacterRefs).length > 0 && (
                      <div className="text-[10px] text-[#808080]">
                        Characters: {Object.keys(shotCharacterRefs).map(charId => getCharacterName(charId)).join(', ')}
                      </div>
                    )}

                    {/* Pronoun Mappings */}
                    {Object.keys(shotPronounMappings).length > 0 && (
                      <div className="text-[10px] text-[#808080]">
                        Pronouns: {Object.entries(shotPronounMappings).map(([pronoun, charIdOrIds]) => {
                          // Handle skipped pronouns (__ignore__)
                          if (charIdOrIds === '__ignore__') {
                            const extrasPrompt = shotPronounExtras[pronoun];
                            if (extrasPrompt && extrasPrompt.trim()) {
                              return `"${pronoun}" → ${extrasPrompt.trim()}`;
                            } else {
                              return `"${pronoun}" → (UNDEFINED) Model will predict!`;
                            }
                          }
                          const charIds = Array.isArray(charIdOrIds) ? charIdOrIds : [charIdOrIds];
                          const names = charIds.map(id => getCharacterName(id as string)).join(', ');
                          return `"${pronoun}" → ${names}`;
                        }).join(', ')}
                      </div>
                    )}

                    {/* Props */}
                    {shotPropsForShot.length > 0 && (
                      <div className="text-[10px] text-[#808080]">
                        Props: {shotPropsForShot.map(prop => {
                          const config = shotPropsConfig[prop.id];
                          return config?.usageDescription 
                            ? `${prop.name} (${config.usageDescription.substring(0, 30)}...)`
                            : prop.name;
                        }).join(', ')}
                      </div>
                    )}

                    {/* Location */}
                    {shotLocation && (
                      <div className="text-[10px] text-[#808080]">
                        Location: <span className="text-[#FFFFFF]">Selected</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resolution Selection and Cost Calculator (above buttons) */}
          <div className="pt-3 border-t border-[#3F3F46] space-y-3 pb-3">
            <div className="flex items-center justify-end gap-2">
              <label className="text-xs text-[#808080] whitespace-nowrap">
                Resolution:
              </label>
              <select
                value={globalResolution}
                onChange={(e) => onGlobalResolutionChange(e.target.value as Resolution)}
                className="px-3 py-1.5 bg-[#1A1A1A] border border-[#3F3F46] rounded text-xs text-[#FFFFFF] hover:border-[#808080] focus:border-[#DC143C] focus:outline-none transition-colors"
              >
                <option value="1080p">HD</option>
                <option value="4k">4K</option>
              </select>
            </div>
            
            {/* Cost Calculator - Prices from backend (margins hidden) */}
            {pricing && (
              <div className="bg-[#1A1A1A] border border-[#3F3F46] rounded p-3 space-y-2">
                <div className="text-sm font-medium text-[#FFFFFF] mb-2">Estimated Cost</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#808080]">HD:</span>
                  <span className={`text-sm font-medium ${globalResolution === '1080p' ? 'text-[#DC143C]' : 'text-[#FFFFFF]'}`}>
                    {pricing.totalHdPrice} credits
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#808080]">4K:</span>
                  <span className={`text-sm font-medium ${globalResolution === '4k' ? 'text-[#DC143C]' : 'text-[#FFFFFF]'}`}>
                    {pricing.totalK4Price} credits
                  </span>
                </div>
                <div className="text-[10px] text-[#808080] italic mt-2 pt-2 border-t border-[#3F3F46]">
                  Selected: {globalResolution === '4k' ? '4K' : 'HD'} ({globalResolution === '4k' ? pricing.totalK4Price : pricing.totalHdPrice} credits)
                </div>
              </div>
            )}
            {isLoadingPricing && (
              <div className="bg-[#1A1A1A] border border-[#3F3F46] rounded p-3">
                <div className="text-xs text-[#808080]">Loading pricing...</div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3 border-t border-[#3F3F46]">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex-1 border-[#3F3F46] text-[#FFFFFF] hover:bg-[#1A1A1A]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={onGenerate}
              disabled={isGenerating || selectedShots.length === 0}
              className="flex-1 bg-[#DC143C] hover:bg-[#B91238] text-white"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Generate Scene ({selectedShots.length} {selectedShots.length === 1 ? 'shot' : 'shots'})
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

