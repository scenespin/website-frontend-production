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

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Film, ArrowLeft, Play, ChevronDown } from 'lucide-react';
import { SceneAnalysisResult } from '@/types/screenplay';
import { useSceneBuilderState, useSceneBuilderActions } from '@/contexts/SceneBuilderContext';
import type { Resolution, CameraAngle } from './ShotConfigurationPanel';
import { SceneBuilderService } from '@/services/SceneBuilderService';
import { useAuth } from '@clerk/nextjs';
import { getCharacterName, getCharacterSource } from './utils/sceneBuilderUtils';
import { cn } from '@/lib/utils';

// Resolution Selector Component (Custom DaisyUI Dropdown)
function ResolutionSelector({ value, onChange }: { value: Resolution; onChange: (value: Resolution) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const resolutions = [
    { value: '1080p' as const, label: 'HD' },
    { value: '4k' as const, label: '4K' }
  ];

  const currentLabel = resolutions.find(r => r.value === value)?.label || 'HD';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        className="w-[100px] h-8 text-xs px-3 py-1.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-md text-[#FFFFFF] flex items-center justify-between hover:bg-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent"
      >
        <span>{currentLabel}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <ul
          className="absolute top-full left-0 mt-1 w-[100px] menu p-2 shadow-lg bg-[#1F1F1F] rounded-box border border-[#3F3F46] z-[9999] max-h-96 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {resolutions.map((res) => (
            <li key={res.value}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(res.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 w-full text-left px-2 py-1.5 rounded text-xs",
                  value === res.value
                    ? "bg-[#DC143C]/20 text-[#FFFFFF]"
                    : "text-[#808080] hover:bg-[#2A2A2A] hover:text-[#FFFFFF]"
                )}
              >
                {res.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface SceneReviewStepProps {
  sceneAnalysisResult: SceneAnalysisResult | null;
  enabledShots: number[];
  // Global settings
  globalResolution: Resolution;
  onGlobalResolutionChange: (resolution: Resolution) => void;
  // Per-shot overrides (no resolution - global only, set in review step)
  shotCameraAngles?: Record<number, CameraAngle>;
  shotDurations?: Record<number, 'quick-cut' | 'extended-take'>;
  // Character mappings
  selectedCharacterReferences: Record<number, Record<string, { poseId?: string; s3Key?: string; imageUrl?: string }>>;
  characterOutfits: Record<number, Record<string, string>>;
  // Location
  selectedLocationReferences: Record<number, { angleId?: string; s3Key?: string; imageUrl?: string }>;
  // Dialogue workflows
  selectedDialogueWorkflows: Record<number, string>;
  selectedDialogueQualities?: Record<number, 'premium' | 'reliable'>;
  voiceoverBaseWorkflows?: Record<number, string>;
  dialogueWorkflowPrompts: Record<number, string>;
  // Per-shot workflow overrides (for action shots and dialogue shots)
  shotWorkflowOverrides?: Record<number, string>;
  onShotWorkflowOverrideChange?: (shotSlot: number, workflow: string) => void;
  // Pronoun mappings
  pronounMappingsForShots: Record<number, Record<string, string | string[]>>;
  pronounExtrasPrompts: Record<number, Record<string, string>>;
  selectedCharactersForShots: Record<number, string[]>;
  // Props
  sceneProps?: Array<{ id: string; name: string; imageUrl?: string; s3Key?: string }>;
  propsToShots: Record<string, number[]>;
  shotProps: Record<number, Record<string, { selectedImageId?: string; usageDescription?: string }>>;
  // Reference Shot Models (First Frame)
  selectedReferenceShotModels?: Record<number, 'nano-banana-pro' | 'flux2-max-4k-16:9'>;
  // Actions
  onBack: () => void;
  onGenerate: () => void;
  isGenerating?: boolean;
  allCharacters?: any[];
}

export function SceneReviewStep({
  sceneAnalysisResult,
  enabledShots,
  globalResolution,
  onGlobalResolutionChange,
  shotCameraAngles = {},
  shotDurations = {},
  selectedCharacterReferences,
  characterOutfits,
  selectedLocationReferences,
  selectedDialogueWorkflows,
  selectedDialogueQualities,
  voiceoverBaseWorkflows,
  dialogueWorkflowPrompts,
  shotWorkflowOverrides = {},
  onShotWorkflowOverrideChange,
  pronounMappingsForShots,
  pronounExtrasPrompts,
  selectedCharactersForShots,
  sceneProps = [],
  propsToShots,
  shotProps,
  selectedReferenceShotModels = {},
  onBack,
  onGenerate,
  isGenerating = false,
  allCharacters = []
}: SceneReviewStepProps) {
  const { getToken } = useAuth();
  const [pricing, setPricing] = useState<{ totalHdPrice: number; totalK4Price: number; totalFirstFramePrice: number } | null>(null);
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
          selectedShots.map((shot: any) => ({ slot: shot.slot, credits: shot.credits || 0, type: shot.type })),
          shotDurations,
          getToken,
          selectedReferenceShotModels,
          undefined, // videoTypes
          selectedDialogueQualities,
          selectedDialogueWorkflows,
          voiceoverBaseWorkflows
        );
        
        setPricing({
          totalHdPrice: pricingResult.totalHdPrice,
          totalK4Price: pricingResult.totalK4Price,
          totalFirstFramePrice: pricingResult.totalFirstFramePrice
        });
      } catch (error) {
        console.error('Failed to fetch pricing:', error);
        setPricing(null);
      } finally {
        setIsLoadingPricing(false);
      }
    };
    
    fetchPricing();
  }, [sceneAnalysisResult?.shotBreakdown?.shots, enabledShots, shotDurations, selectedReferenceShotModels, selectedDialogueQualities, selectedDialogueWorkflows, voiceoverBaseWorkflows, getToken]);
  
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

  // Use utility functions for character operations
  const characterSource = getCharacterSource(allCharacters, sceneAnalysisResult);
  const getCharName = (charId: string) => getCharacterName(charId, allCharacters, sceneAnalysisResult, charId);

  const getWorkflowLabel = (workflow: string) => {
    const labels: Record<string, string> = {
      'first-frame-lipsync': 'Dialogue (Lip Sync)',
      'extreme-closeup': 'Extreme Close-Up (Face)',
      'extreme-closeup-mouth': 'Extreme Close-Up (Mouth)',
      'off-frame-voiceover': 'Hidden Mouth Dialogue',
      'scene-voiceover': 'Narrate Shot',
      'action-line': 'Action Line',
      'action-director': 'Action Director',
      'reality-to-toon': 'Reality to Toon',
      'anime-master': 'Anime Master',
      'cartoon-classic': 'Cartoon Classic',
      '3d-character': '3D Character',
      'vfx-elements': 'VFX Elements',
      'fantasy-epic': 'Fantasy Epic',
      'superhero-transform': 'Superhero Transform',
      'animal-kingdom': 'Animal Kingdom',
      'style-chameleon': 'Style Chameleon',
      'broll-master': 'B-Roll Master',
      'complete-scene': 'Complete Scene'
    };
    return labels[workflow] || workflow;
  };
  
  // All available workflows for override dropdown
  const ALL_WORKFLOWS = [
    // Dialogue workflows
    { value: 'first-frame-lipsync', label: 'Dialogue (Lip Sync)', category: 'dialogue' },
    { value: 'extreme-closeup', label: 'Extreme Close-Up (Face)', category: 'dialogue' },
    { value: 'extreme-closeup-mouth', label: 'Extreme Close-Up (Mouth)', category: 'dialogue' },
    { value: 'off-frame-voiceover', label: 'Hidden Mouth Dialogue', category: 'dialogue' },
    { value: 'scene-voiceover', label: 'Narrate Shot', category: 'dialogue' },
    // Action workflows
    { value: 'action-line', label: 'Action Line', category: 'action' },
    { value: 'action-director', label: 'Action Director', category: 'action' },
    { value: 'reality-to-toon', label: 'Reality to Toon', category: 'action' },
    { value: 'anime-master', label: 'Anime Master', category: 'action' },
    { value: 'cartoon-classic', label: 'Cartoon Classic', category: 'action' },
    { value: '3d-character', label: '3D Character', category: 'action' },
    { value: 'vfx-elements', label: 'VFX Elements', category: 'action' },
    { value: 'fantasy-epic', label: 'Fantasy Epic', category: 'action' },
    { value: 'superhero-transform', label: 'Superhero Transform', category: 'action' },
    { value: 'animal-kingdom', label: 'Animal Kingdom', category: 'action' },
    { value: 'style-chameleon', label: 'Style Chameleon', category: 'action' },
    { value: 'broll-master', label: 'B-Roll Master', category: 'action' },
    { value: 'complete-scene', label: 'Complete Scene', category: 'action' }
  ];

  // Calculate total duration
  const totalDuration = selectedShots.reduce((total: number, shot: any) => {
    const duration = shotDurations[shot.slot] || 'quick-cut';
    const seconds = duration === 'extended-take' ? 10 : 5;
    return total + seconds;
  }, 0);
  const minutes = Math.floor(totalDuration / 60);
  const seconds = totalDuration % 60;
  const durationText = minutes > 0 
    ? `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}${seconds > 0 ? ` ${seconds} ${seconds === 1 ? 'second' : 'seconds'}` : ''}`
    : `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;

  return (
    <div className="space-y-4">
      {/* Two-column layout: Summary (left 1/3) and Review (right 2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Summary Section (1/3) */}
        <div className="lg:col-span-1">
          <Card className="bg-[#141414] border-[#3F3F46] h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-[#FFFFFF] flex items-center gap-2">
                <Film className="w-4 h-4" />
                Scene Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#808080]">Total Shots:</span>
                  <span className="text-sm font-medium text-[#FFFFFF]">{selectedShots.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#808080]">Total Duration:</span>
                  <span className="text-sm font-medium text-[#FFFFFF]">{durationText}</span>
                </div>
                {pricing && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#808080]">Estimated Cost:</span>
                    <span className={`text-sm font-medium ${globalResolution === '4k' ? 'text-[#DC143C]' : 'text-[#FFFFFF]'}`}>
                      {globalResolution === '4k' 
                        ? pricing.totalFirstFramePrice + pricing.totalK4Price 
                        : pricing.totalFirstFramePrice + pricing.totalHdPrice} credits
                    </span>
                  </div>
                )}
              </div>
              
              <div className="pt-3 border-t border-[#3F3F46]">
                <p className="text-xs text-[#FFFFFF] leading-relaxed mb-2">
                  You're about to generate <span className="text-[#DC143C] font-medium">{selectedShots.length} {selectedShots.length === 1 ? 'shot' : 'shots'}</span> totaling <span className="text-[#DC143C] font-medium">{durationText}</span> of professional video content.
                </p>
                <p className="text-xs text-[#808080] leading-relaxed">
                  Each shot has been carefully configured with your selected characters, locations, props, and creative direction. Our AI will bring your vision to life with cinematic quality and precision.
                </p>
                <p className="text-xs text-[#FFFFFF] leading-relaxed mt-2">
                  Ready to bring your scene to the screen? Click generate to start production.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Review & Generate Section (2/3) */}
        <div className="lg:col-span-2">
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
                    {shotCameraAngle && shotCameraAngle !== 'auto' && (
                      <div className="text-[10px] text-[#808080] space-y-1">
                        <div>Camera: <span className="text-[#FFFFFF]">{shotCameraAngle.replace('-', ' ')}</span></div>
                      </div>
                    )}

                    {/* Workflow - Display only (no override in review step) */}
                    <div className="text-[10px] text-[#808080]">
                      Suggested Workflow: <span className="text-[#FFFFFF]">{getWorkflowLabel(shot.workflow || 'action-line')}</span>
                      {shotWorkflowOverrides[shot.slot] && shotWorkflowOverrides[shot.slot] !== shot.workflow && (
                        <span className="text-[#DC143C] ml-2">
                          (Override: {getWorkflowLabel(shotWorkflowOverrides[shot.slot])})
                        </span>
                      )}
                    </div>

                    {/* Dialogue Workflow (for display only - override is above) */}
                    {shotDialogueWorkflow && (
                      <div className="text-[10px] text-[#808080]">
                        Dialogue Workflow: <span className="text-[#FFFFFF]">{getWorkflowLabel(shotDialogueWorkflow)}</span>
                        {shotDialoguePrompt && (
                          <div className="mt-1 text-[#808080] italic">"{shotDialoguePrompt.substring(0, 50)}..."</div>
                        )}
                      </div>
                    )}

                    {/* Characters */}
                    {Object.keys(shotCharacterRefs).length > 0 && (
                      <div className="text-[10px] text-[#808080]">
                        Characters: {Object.keys(shotCharacterRefs).map(charId => getCharName(charId)).join(', ')}
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
                          const names = charIds.map(id => getCharName(id as string)).join(', ');
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
              <ResolutionSelector
                value={globalResolution}
                onChange={(value) => onGlobalResolutionChange(value as Resolution)}
              />
            </div>
            
            {/* Cost Calculator - Prices from backend (margins hidden) */}
            {pricing && (
              <div className="bg-[#1A1A1A] border border-[#3F3F46] rounded p-3 space-y-2">
                <div className="text-sm font-medium text-[#FFFFFF] mb-2">Estimated Cost</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#808080]">
                    {selectedShots.length} Reference Shot{selectedShots.length !== 1 ? 's' : ''}:
                  </span>
                  <span className="text-sm font-medium text-[#FFFFFF]">
                    {pricing.totalFirstFramePrice} credits
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#808080]">HD Video:</span>
                  <span className={`text-sm font-medium ${globalResolution === '1080p' ? 'text-[#DC143C]' : 'text-[#FFFFFF]'}`}>
                    {pricing.totalHdPrice} credits
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#808080]">4K Video:</span>
                  <span className={`text-sm font-medium ${globalResolution === '4k' ? 'text-[#DC143C]' : 'text-[#FFFFFF]'}`}>
                    {pricing.totalK4Price} credits
                  </span>
                </div>
                <div className="pt-2 border-t border-[#3F3F46]">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="text-[#FFFFFF]">HD Total:</span>
                    <span className={`${globalResolution === '1080p' ? 'text-[#DC143C]' : 'text-[#FFFFFF]'}`}>
                      {pricing.totalFirstFramePrice + pricing.totalHdPrice} credits
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-medium mt-1">
                    <span className="text-[#FFFFFF]">4K Total:</span>
                    <span className={`${globalResolution === '4k' ? 'text-[#DC143C]' : 'text-[#FFFFFF]'}`}>
                      {pricing.totalFirstFramePrice + pricing.totalK4Price} credits
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-[#808080] italic mt-2 pt-2 border-t border-[#3F3F46]">
                  Selected: {globalResolution === '4k' ? '4K' : 'HD'} ({globalResolution === '4k' ? pricing.totalFirstFramePrice + pricing.totalK4Price : pricing.totalFirstFramePrice + pricing.totalHdPrice} credits)
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
          <div className="flex gap-3 pt-3 pb-20 border-t border-[#3F3F46]">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex-1 border-[#3F3F46] text-[#FFFFFF] hover:bg-[#1A1A1A]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Shots
            </Button>
            <Button
              onClick={onGenerate}
              disabled={isGenerating || selectedShots.length === 0}
              className="flex-1 bg-[#DC143C] hover:bg-[#B91238] text-white"
            >
              {isGenerating ? (
                <>
                  <span className="mr-2">🤖</span>
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Generate Shots
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
}

