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
import { Check, Film, ArrowLeft, Play } from 'lucide-react';
import { SceneAnalysisResult } from '@/types/screenplay';
import { useSceneBuilderState, useSceneBuilderActions, DEFAULT_REFERENCE_SHOT_MODEL } from '@/contexts/SceneBuilderContext';
import type { Resolution, CameraAngle } from './ShotConfigurationPanel';
import { SceneBuilderService } from '@/services/SceneBuilderService';
import { useAuth } from '@clerk/nextjs';
import { getCharacterName, getCharacterSource } from './utils/sceneBuilderUtils';
import { DEFAULT_ELEMENTS_VIDEO_MODEL, getEffectiveElementsVideoDuration } from '@/lib/elementsWorkflowUtils';

// Honest resolution (0237): No resolution selector. Output is 720p (Reliable/LongCat) or 1080p (Premium/VEO) by workflow.

/** Display labels for reference shot (first frame) model IDs. Kept in sync with model-selection API / ReferenceShotSelector. */
const REFERENCE_SHOT_MODEL_LABELS: Record<string, string> = {
  'nano-banana-pro': 'Nano Banana Pro (4K)',
  'nano-banana-pro-2k': 'Nano Banana Pro (2K)',
  'flux2-max-4k-16:9': 'FLUX.2 [max] (4K)',
  'flux2-max-2k': 'FLUX.2 [max] (2K)',
  'flux2-pro-4k': 'FLUX.2 [pro] (4K)',
  'flux2-pro-2k': 'FLUX.2 [pro] (2K)'
};

interface SceneReviewStepProps {
  sceneAnalysisResult: SceneAnalysisResult | null;
  enabledShots: number[];
  // Global settings
  globalResolution: Resolution;
  onGlobalResolutionChange: (resolution: Resolution) => void;
  // Per-shot overrides (no resolution - global only, set in review step)
  shotCameraAngles?: Record<number, CameraAngle>;
  shotDurations?: Record<number, 'quick-cut' | 'extended-take'>;
  shotAspectRatios?: Record<number, '16:9' | '9:16' | '1:1' | '21:9' | '9:21'>;
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
  selectedReferenceShotModels?: Record<number, 'nano-banana-pro' | 'nano-banana-pro-2k' | 'flux2-max-4k-16:9' | 'flux2-max-2k' | 'flux2-pro-4k' | 'flux2-pro-2k'>;
  // Actions
  onBack: () => void;
  onGenerate: () => void;
  isGenerating?: boolean;
  allCharacters?: any[];
  // Style Profiles
  styleProfiles?: Array<{ profileId: string; videoUrl: string; createdAt: string; confidence: number }>;
  selectedStyleProfile?: string | null;
  onStyleProfileChange?: (profileId: string | null) => void;
  // URL Maps for thumbnail display
  characterThumbnailS3KeyMap?: Map<string, string>; // Map of s3Key -> thumbnailS3Key
  characterThumbnailUrlsMap?: Map<string, string>; // Map of thumbnailS3Key -> presigned URL
  locationThumbnailS3KeyMap?: Map<string, string>; // Map of location s3Key -> thumbnailS3Key
  locationThumbnailUrlsMap?: Map<string, string>; // Map of location thumbnailS3Key -> presigned URL
  propThumbnailS3KeyMap?: Map<string, string>; // Map of prop s3Key -> thumbnailS3Key
  propThumbnailUrlsMap?: Map<string, string>; // Map of prop thumbnailS3Key -> presigned URL
  // Uploaded first frames
  uploadedFirstFrames?: Record<number, string>;
  // Feature 0234: Per-shot video opt-in state
  generateVideoForShot?: Record<number, boolean>;
  // Feature 0262/0259: Per-shot Elements to Video (pricing: first frame = 0, video = VEO)
  useElementsForVideo?: Record<number, boolean>;
  elementsVideoDurations?: Record<number, 4 | 6 | 8>;
  elementsVideoAspectRatios?: Record<number, '16:9' | '9:16'>;
}

export function SceneReviewStep({
  sceneAnalysisResult,
  enabledShots,
  globalResolution,
  onGlobalResolutionChange,
  shotCameraAngles = {},
  shotDurations = {},
  shotAspectRatios = {},
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
  allCharacters = [],
  styleProfiles = [],
  selectedStyleProfile = null,
  onStyleProfileChange,
  characterThumbnailS3KeyMap,
  characterThumbnailUrlsMap,
  locationThumbnailS3KeyMap,
  locationThumbnailUrlsMap,
  propThumbnailS3KeyMap,
  propThumbnailUrlsMap,
  uploadedFirstFrames = {},
  generateVideoForShot = {},
  useElementsForVideo = {},
  elementsVideoDurations = {},
  elementsVideoAspectRatios = {}
}: SceneReviewStepProps) {
  const { getToken } = useAuth();
  const [pricing, setPricing] = useState<{ totalHdPrice: number; totalK4Price: number; totalFirstFramePrice: number } | null>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  const reviewWarningEventSentRef = useRef<Set<string>>(new Set());

  const resolveDialogueVideoAspectRatio = (
    firstFrameRatio: '16:9' | '9:16' | '1:1' | '21:9' | '9:21',
    quality: 'premium' | 'reliable'
  ): '16:9' | '9:16' | '1:1' | '3:2' | '2:3' => {
    if (quality === 'premium') {
      // Premium Dialogue (VEO): only 16:9 and 9:16.
      return firstFrameRatio === '9:16' || firstFrameRatio === '9:21' ? '9:16' : '16:9';
    }
    // Standard Dialogue (Grok): 16:9, 9:16, 3:2, 2:3, 1:1
    if (firstFrameRatio === '16:9' || firstFrameRatio === '9:16' || firstFrameRatio === '1:1') {
      return firstFrameRatio;
    }
    if (firstFrameRatio === '21:9') return '16:9';
    if (firstFrameRatio === '9:21') return '9:16';
    return '16:9';
  };
  
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
        // Ensure all shots have a reference model (default when not selected)
        const referenceShotModelsWithDefaults: Record<number, 'nano-banana-pro' | 'nano-banana-pro-2k' | 'flux2-max-4k-16:9' | 'flux2-max-2k' | 'flux2-pro-4k' | 'flux2-pro-2k'> = {};
        selectedShots.forEach((shot: any) => {
          referenceShotModelsWithDefaults[shot.slot] = selectedReferenceShotModels?.[shot.slot] || DEFAULT_REFERENCE_SHOT_MODEL;
        });
        
        const pricingResult = await SceneBuilderService.calculatePricing(
          selectedShots.map((shot: any) => ({ 
            slot: shot.slot, 
            credits: shot.credits || 0, 
            type: shot.type,
            dialogueText: shot.type === 'dialogue' ? shot.dialogueBlock?.dialogue : undefined
          })),
          shotDurations,
          getToken,
          referenceShotModelsWithDefaults,
          undefined, // videoTypes (Review step uses generateVideoForShot for dialogue; action shots use shot.credits fallback)
          selectedDialogueQualities,
          selectedDialogueWorkflows,
          voiceoverBaseWorkflows,
          generateVideoForShot,
          useElementsForVideo,
          elementsVideoDurations
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
  }, [sceneAnalysisResult?.shotBreakdown?.shots, enabledShots, shotDurations, selectedReferenceShotModels, selectedDialogueQualities, selectedDialogueWorkflows, voiceoverBaseWorkflows, generateVideoForShot, useElementsForVideo, elementsVideoDurations, getToken]);
  
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
  const premiumShortDialogueShots = selectedShots
    .filter((shot: any) => {
      if (shot.type !== 'dialogue') return false;
      if (!generateVideoForShot[shot.slot]) return false;
      const quality = selectedDialogueQualities?.[shot.slot] || 'reliable';
      if (quality !== 'premium') return false;
      const dialogueText = (shot.dialogueBlock?.dialogue || '').trim();
      if (!dialogueText) return false;
      const wordCount = dialogueText.split(/\s+/).filter(Boolean).length;
      return wordCount > 0 && wordCount < 4;
    })
    .map((shot: any) => ({
      shotSlot: shot.slot as number,
      dialogue: (shot.dialogueBlock?.dialogue || '').trim(),
      wordCount: (shot.dialogueBlock?.dialogue || '').trim().split(/\s+/).filter(Boolean).length
    }));
  const hasPremiumShortLineRisk = premiumShortDialogueShots.length > 0;
  const premiumShortLineShotList = premiumShortDialogueShots.map((s) => `#${s.shotSlot}`).join(', ');
  const premiumShortLineSignature = premiumShortDialogueShots
    .map((s) => `${s.shotSlot}:${s.wordCount}:${s.dialogue}`)
    .join('|');

  useEffect(() => {
    if (!hasPremiumShortLineRisk || !premiumShortLineSignature) return;
    if (reviewWarningEventSentRef.current.has(premiumShortLineSignature)) return;
    reviewWarningEventSentRef.current.add(premiumShortLineSignature);

    // Lightweight counter for how often this guardrail appears at submit-time.
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'dialogue_premium_short_line_warning_review_shown',
        timestamp: new Date().toISOString(),
        shotCount: premiumShortDialogueShots.length,
        shotSlots: premiumShortDialogueShots.map((s) => s.shotSlot)
      })
    }).catch(() => {
      // Non-blocking analytics.
    });
  }, [hasPremiumShortLineRisk, premiumShortLineSignature, premiumShortDialogueShots]);

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
      'hollywood-standard': 'Hollywood Standard',
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
    { value: 'hollywood-standard', label: 'Hollywood Standard', category: 'action' },
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

  // Feature 0234: Calculate total duration - dialogue video opt-in + Elements to Video (Feature 0259)
  const totalDuration = selectedShots.reduce((total: number, shot: any) => {
    if (shot.type === 'dialogue' && generateVideoForShot[shot.slot]) {
      const duration = shotDurations[shot.slot] || 'quick-cut';
      const quality = selectedDialogueQualities?.[shot.slot] || 'reliable';
      const seconds = duration === 'extended-take'
        ? 8
        : (quality === 'premium' ? 4 : 5);
      return total + seconds;
    }
    // Feature 0259: Elements duration is normalized from model capabilities.
    if (useElementsForVideo[shot.slot]) {
      const sec = getEffectiveElementsVideoDuration(elementsVideoDurations[shot.slot], DEFAULT_ELEMENTS_VIDEO_MODEL);
      return total + sec;
    }
    return total;
  }, 0);

  const hasAnyVideo = totalDuration > 0;
  const minutes = Math.floor(totalDuration / 60);
  const seconds = totalDuration % 60;
  const durationText = hasAnyVideo
    ? (minutes > 0 
        ? `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}${seconds > 0 ? ` ${seconds} ${seconds === 1 ? 'second' : 'seconds'}` : ''}`
        : `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`)
    : 'First frames only';

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
                    <span className="text-sm font-medium text-[#FFFFFF]">
                      {hasAnyVideo ? pricing.totalFirstFramePrice + pricing.totalHdPrice : pricing.totalFirstFramePrice} credits
                    </span>
                  </div>
                )}
              </div>
              
              <div className="pt-3 border-t border-[#3F3F46]">
                <p className="text-xs text-[#FFFFFF] leading-relaxed mb-2">
                  You're about to generate <span className="text-[#DC143C] font-medium">{selectedShots.length} {selectedShots.length === 1 ? 'shot' : 'shots'}</span>
                  {hasAnyVideo ? (
                    <> totaling <span className="text-[#DC143C] font-medium">{durationText}</span> of professional video content.</>
                  ) : (
                    <> as first frame images (no video).</>
                  )}
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

                    {/* Dialogue line - Display for dialogue shots when video is opted-in (instead of suggested workflow). Fallback "—" for rare bad/legacy data where type is dialogue but dialogueBlock.dialogue is missing. */}
                    {shot.type === 'dialogue' && generateVideoForShot[shot.slot] && (
                      <div className="text-[10px] text-[#808080]">
                        Dialogue: <span className="text-[#FFFFFF]">"{shot.dialogueBlock?.dialogue ?? '—'}"</span>
                        {shotWorkflowOverrides[shot.slot] && shotWorkflowOverrides[shot.slot] !== shot.workflow && (
                          <span className="text-[#DC143C] ml-2">
                            (Override: {getWorkflowLabel(shotWorkflowOverrides[shot.slot])})
                          </span>
                        )}
                      </div>
                    )}

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

                    {/* Reference Images Section */}
                    {(uploadedFirstFrames[shot.slot] || 
                      Object.keys(shotCharacterRefs).length > 0 || 
                      shotLocation || 
                      shotPropsForShot.length > 0) && (
                      <div className="mt-2 pt-2 border-t border-[#3F3F46]">
                        <div className="text-[10px] text-[#808080] mb-2">First Frame References:</div>
                        {uploadedFirstFrames[shot.slot] ? (
                          <div className="flex items-center gap-2">
                            <img 
                              src={uploadedFirstFrames[shot.slot]} 
                              className="w-16 h-16 rounded border border-[#3F3F46] object-cover" 
                              alt="Uploaded first frame"
                              onError={(e) => {
                                const imgElement = e.target as HTMLImageElement;
                                imgElement.style.display = 'none';
                              }}
                            />
                            <span className="text-[10px] text-[#808080]">Uploaded First Frame</span>
                          </div>
                        ) : (
                          <div className="flex gap-2 flex-wrap">
                            {/* Character references */}
                            {Object.entries(shotCharacterRefs).map(([charId, ref]) => {
                              // Two-step lookup: s3Key -> thumbnailS3Key -> URL; fallback to ref.imageUrl when maps missing
                              let thumbnailUrl: string | undefined;
                              if (ref.s3Key) {
                                const thumbnailS3Key = characterThumbnailS3KeyMap?.get(ref.s3Key);
                                if (thumbnailS3Key) {
                                  thumbnailUrl = characterThumbnailUrlsMap?.get(thumbnailS3Key);
                                }
                              }
                              if (!thumbnailUrl && ref.imageUrl && (ref.imageUrl.startsWith('http') || ref.imageUrl.startsWith('data:'))) {
                                thumbnailUrl = ref.imageUrl;
                              }
                              return thumbnailUrl ? (
                                <div key={charId} className="relative">
                                  <img 
                                    src={thumbnailUrl} 
                                    className="w-12 h-12 rounded border border-[#3F3F46] object-cover" 
                                    alt={`Character: ${getCharName(charId)}`}
                                    onError={(e) => {
                                      const imgElement = e.target as HTMLImageElement;
                                      imgElement.style.display = 'none';
                                    }}
                                  />
                                  <div className="absolute -bottom-4 left-0 right-0 text-[8px] text-[#808080] text-center truncate max-w-[48px]">
                                    {getCharName(charId)}
                                  </div>
                                </div>
                              ) : null;
                            })}
                            {/* Location reference */}
                            {shotLocation && (() => {
                              // Two-step lookup: s3Key -> thumbnailS3Key -> URL; fallback to shotLocation.imageUrl when maps missing
                              let thumbnailUrl: string | undefined;
                              if (shotLocation.s3Key) {
                                const thumbnailS3Key = locationThumbnailS3KeyMap?.get(shotLocation.s3Key);
                                if (thumbnailS3Key) {
                                  thumbnailUrl = locationThumbnailUrlsMap?.get(thumbnailS3Key);
                                }
                              }
                              if (!thumbnailUrl && shotLocation.imageUrl && (shotLocation.imageUrl.startsWith('http') || shotLocation.imageUrl.startsWith('data:'))) {
                                thumbnailUrl = shotLocation.imageUrl;
                              }
                              return thumbnailUrl ? (
                                <div key="location" className="relative">
                                  <img 
                                    src={thumbnailUrl} 
                                    className="w-12 h-12 rounded border border-[#3F3F46] object-cover" 
                                    alt="Location"
                                    onError={(e) => {
                                      const imgElement = e.target as HTMLImageElement;
                                      imgElement.style.display = 'none';
                                    }}
                                  />
                                  <div className="absolute -bottom-4 left-0 right-0 text-[8px] text-[#808080] text-center">
                                    Location
                                  </div>
                                </div>
                              ) : null;
                            })()}
                            {/* Prop references — same resolution + fallback chain as config step (ShotConfigurationPanel) */}
                            {shotPropsForShot.map(prop => {
                              const config = shotPropsConfig[prop.id];
                              const selectedImageId = config?.selectedImageId;
                              if (!selectedImageId) return null;
                              
                              const propWithRefs = prop as typeof prop & {
                                angleReferences?: Array<{ id: string; s3Key: string; imageUrl?: string }>;
                                images?: Array<{ s3Key?: string; url?: string }>;
                                baseReference?: { s3Key?: string; imageUrl?: string };
                              };
                              // Same as config: resolve selectedImageId to s3Key and get the matching ref/img for fallbacks
                              let lookupKey = selectedImageId;
                              const matchedRef = propWithRefs.angleReferences?.find((r) => r.id === selectedImageId || r.s3Key === selectedImageId);
                              if (matchedRef?.s3Key) lookupKey = matchedRef.s3Key;
                              const matchedImg = !matchedRef && propWithRefs.images?.length
                                ? propWithRefs.images.find((i) => i.s3Key === selectedImageId)
                                : undefined;
                              if (matchedImg?.s3Key) lookupKey = matchedImg.s3Key;
                              if (lookupKey === selectedImageId && propWithRefs.baseReference?.s3Key === selectedImageId) {
                                lookupKey = propWithRefs.baseReference.s3Key;
                              }
                              
                              // Same order as config step: thumbnail → fallback to enriched ref/image URL (payload presigned)
                              let displayUrl: string | undefined;
                              if (propThumbnailS3KeyMap?.has(lookupKey)) {
                                const thumbnailS3Key = propThumbnailS3KeyMap.get(lookupKey);
                                if (thumbnailS3Key) displayUrl = propThumbnailUrlsMap?.get(thumbnailS3Key);
                              }
                              if (!displayUrl) displayUrl = propThumbnailUrlsMap?.get(lookupKey);
                              if (!displayUrl && matchedRef?.imageUrl && (matchedRef.imageUrl.startsWith('http') || matchedRef.imageUrl.startsWith('data:'))) {
                                displayUrl = matchedRef.imageUrl;
                              }
                              if (!displayUrl && matchedImg?.url && (matchedImg.url.startsWith('http') || matchedImg.url.startsWith('data:'))) {
                                displayUrl = matchedImg.url;
                              }
                              if (!displayUrl && propWithRefs.baseReference?.s3Key === lookupKey && propWithRefs.baseReference?.imageUrl?.startsWith('http')) {
                                displayUrl = propWithRefs.baseReference.imageUrl;
                              }
                              if (!displayUrl && (prop as { imageUrl?: string }).imageUrl && ((prop as { imageUrl?: string }).imageUrl!.startsWith('http') || (prop as { imageUrl?: string }).imageUrl!.startsWith('data:'))) {
                                displayUrl = (prop as { imageUrl?: string }).imageUrl;
                              }
                              
                              return displayUrl ? (
                                <div key={prop.id} className="relative">
                                  <img 
                                    src={displayUrl} 
                                    className="w-12 h-12 rounded border border-[#3F3F46] object-cover" 
                                    alt={`Prop: ${prop.name}`}
                                    onError={(e) => {
                                      const imgElement = e.target as HTMLImageElement;
                                      imgElement.style.display = 'none';
                                    }}
                                  />
                                  <div className="absolute -bottom-4 left-0 right-0 text-[8px] text-[#808080] text-center truncate max-w-[48px]">
                                    {prop.name}
                                  </div>
                                </div>
                              ) : null;
                            })}
                          </div>
                        )}
                        {/* Elements path: "Video from elements". Otherwise: first frame model. */}
                        <div className="mt-4 pt-2 border-t border-[#3F3F46]">
                          {(() => {
                            const isElementsVideo = !!useElementsForVideo[shot.slot];
                            const isDialogueVideo = shot.type === 'dialogue' && !!generateVideoForShot[shot.slot];
                            const hasVideoForShot = isElementsVideo || isDialogueVideo;
                            const hasFirstFrameForShot = !isElementsVideo;
                            const firstFrameAspectRatio = (shotAspectRatios[shot.slot] || '16:9') as '16:9' | '9:16' | '1:1' | '21:9' | '9:21';
                            const dialogueQuality = (selectedDialogueQualities?.[shot.slot] || 'reliable') as 'premium' | 'reliable';

                            const videoAspectRatio = isElementsVideo
                              ? (elementsVideoAspectRatios[shot.slot] || '16:9')
                              : isDialogueVideo
                                ? resolveDialogueVideoAspectRatio(firstFrameAspectRatio, dialogueQuality)
                                : (shotAspectRatios[shot.slot] || '16:9');

                            const showAdjustment = hasVideoForShot && hasFirstFrameForShot && videoAspectRatio !== firstFrameAspectRatio;
                            const videoWorkflowLabel = isElementsVideo
                              ? 'Elements'
                              : isDialogueVideo
                                ? (dialogueQuality === 'premium' ? 'Premium Dialogue' : 'Dialogue')
                                : null;

                            return (
                              <div className="space-y-1">
                                {isElementsVideo ? (
                                  <>
                                    <div className="text-[10px] text-[#808080] mb-0.5">Video from elements</div>
                                    <div className="text-xs text-[#FFFFFF]">Reference-driven (characters, location, props)</div>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-[10px] text-[#808080] mb-0.5">First frame model</div>
                                    <div className="text-xs text-[#FFFFFF]">
                                      {REFERENCE_SHOT_MODEL_LABELS[selectedReferenceShotModels[shot.slot] || DEFAULT_REFERENCE_SHOT_MODEL] ?? (selectedReferenceShotModels[shot.slot] || DEFAULT_REFERENCE_SHOT_MODEL)}
                                    </div>
                                  </>
                                )}

                                {hasFirstFrameForShot && (
                                  <div className="text-[10px] text-[#808080]">
                                    First frame aspect ratio: <span className="text-[#FFFFFF]">{firstFrameAspectRatio}</span>
                                  </div>
                                )}

                                {videoWorkflowLabel && (
                                  <div className="text-[10px] text-[#808080]">
                                    Video workflow: <span className="text-[#FFFFFF]">{videoWorkflowLabel}</span>
                                  </div>
                                )}

                                {hasVideoForShot && (
                                  <div className="text-[10px] text-[#808080]">
                                    Video aspect ratio: <span className="text-[#FFFFFF]">{videoAspectRatio}</span>
                                  </div>
                                )}

                                {showAdjustment && (
                                  <div className="text-[10px] text-[#808080]">
                                    Adjusted from {firstFrameAspectRatio} to {videoAspectRatio} for this video workflow.
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cost Calculator (0237: honest resolution — single cost, no resolution selector) */}
          <div className="pt-3 border-t border-[#3F3F46] space-y-3 pb-3">
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
                {hasAnyVideo && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#808080]">Video (720p or 1080p by workflow):</span>
                    <span className="text-sm font-medium text-[#FFFFFF]">
                      {pricing.totalHdPrice} credits
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-[#3F3F46]">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="text-[#FFFFFF]">Total:</span>
                    <span className="text-[#DC143C]">
                      {hasAnyVideo ? pricing.totalFirstFramePrice + pricing.totalHdPrice : pricing.totalFirstFramePrice} credits
                    </span>
                  </div>
                </div>
                {hasAnyVideo && (
                  <div className="text-[10px] text-[#808080] italic mt-2 pt-2 border-t border-[#3F3F46]">
                    Standard = 720p · Premium = 1080p
                  </div>
                )}
              </div>
            )}
            {isLoadingPricing && (
              <div className="bg-[#1A1A1A] border border-[#3F3F46] rounded p-3">
                <div className="text-xs text-[#808080]">Loading pricing...</div>
              </div>
            )}
          </div>

          {/* Style Profile Selection */}
          {styleProfiles && styleProfiles.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-[#3F3F46]">
              <label className="text-xs font-medium text-[#FFFFFF] flex items-center gap-2">
                <span>Style Profile</span>
                <span className="text-[10px] text-[#808080] font-normal">(Optional)</span>
              </label>
              <select
                value={selectedStyleProfile || ''}
                onChange={(e) => onStyleProfileChange?.(e.target.value || null)}
                className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-md text-sm text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent"
              >
                <option value="">None (Use default style)</option>
                {styleProfiles.map((profile) => (
                  <option key={profile.profileId} value={profile.profileId}>
                    {profile.videoUrl.split('/').pop() || 'Style Profile'} ({Math.round(profile.confidence)}% confidence)
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-[#808080]">
                Apply a pre-analyzed video style to match the visual aesthetic of your reference video.
              </p>
              {!selectedStyleProfile && styleProfiles.length > 0 && (
                <p className="text-[10px] text-[#808080] italic">
                  💡 Tip: Create style profiles in <strong>Direct → Style Profiles</strong> to match specific visual styles.
                </p>
              )}
            </div>
          )}

          {hasPremiumShortLineRisk && (
            <div className="text-[11px] px-2.5 py-2 rounded border border-yellow-500/40 bg-yellow-500/10 text-yellow-200">
              Premium Dialogue may produce unstable speech with very short lines ({premiumShortLineShotList}). For best results, use 4+ words or switch those shots to Reliable.
            </div>
          )}

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
                <>Generating...</>
              ) : (
                <>Generate Shots</>
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

