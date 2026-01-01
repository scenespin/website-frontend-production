'use client';

/**
 * Unified Dialogue Dropdown Component
 * 
 * Features:
 * - Wrapped model names (Premium Quality / Reliable Generation)
 * - Multi-character detection and routing
 * - Workflow selector for voiceover options
 * - Clear categorization (Lip Sync vs Non-Lip Sync)
 */

import React, { useMemo } from 'react';
import { Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type DialogueQuality = 'premium' | 'reliable';
export type DialogueWorkflowType = 
  | 'first-frame-lipsync'
  | 'extreme-closeup'
  | 'extreme-closeup-mouth'
  | 'off-frame-voiceover'
  | 'scene-voiceover';

export interface UnifiedDialogueOption {
  quality: DialogueQuality;
  workflowType: DialogueWorkflowType;
  label: string;
  description: string;
  isMultiCharacter?: boolean;
  isRecommended?: boolean;
  costWarning?: string;
}

interface UnifiedDialogueDropdownProps {
  shot: any;
  selectedQuality?: DialogueQuality;
  selectedWorkflow?: DialogueWorkflowType;
  selectedBaseWorkflow?: string; // For voiceover workflows
  characterIds: string[]; // All characters for this shot
  onQualityChange: (quality: DialogueQuality) => void;
  onWorkflowChange: (workflow: DialogueWorkflowType) => void;
  onBaseWorkflowChange?: (baseWorkflow: string) => void; // For voiceover workflows
  detectedWorkflow?: DialogueWorkflowType;
  workflowConfidence?: 'high' | 'medium' | 'low';
  workflowReasoning?: string;
}

// Available base workflows for voiceover options
const AVAILABLE_WORKFLOWS = [
  { value: 'action-line', label: 'Action Line' },
  { value: 'action-director', label: 'Action Director' },
  { value: 'reality-to-toon', label: 'Reality to Toon' },
  { value: 'anime-master', label: 'Anime Master' },
  { value: 'cartoon-classic', label: 'Cartoon Classic' },
  { value: '3d-character', label: '3D Character' },
  { value: 'vfx-elements', label: 'VFX Elements' },
  { value: 'fantasy-epic', label: 'Fantasy Epic' },
  { value: 'superhero-transform', label: 'Superhero Transform' },
  { value: 'animal-kingdom', label: 'Animal Kingdom' },
  { value: 'style-chameleon', label: 'Style Chameleon' },
  { value: 'broll-master', label: 'B-Roll Master' },
  { value: 'complete-scene', label: 'Complete Scene' },
];

export function UnifiedDialogueDropdown({
  shot,
  selectedQuality,
  selectedWorkflow,
  selectedBaseWorkflow,
  characterIds,
  onQualityChange,
  onWorkflowChange,
  onBaseWorkflowChange,
  detectedWorkflow,
  workflowConfidence,
  workflowReasoning
}: UnifiedDialogueDropdownProps) {
  
  const isMultiCharacter = characterIds.length > 1;
  const currentWorkflow = selectedWorkflow || detectedWorkflow || 'first-frame-lipsync';
  const currentQuality = selectedQuality || (isMultiCharacter ? 'reliable' : 'reliable');
  
  // Generate available options based on single vs multi-character
  const lipSyncOptions = useMemo(() => {
    if (isMultiCharacter) {
      return [
        {
          quality: 'reliable' as DialogueQuality,
          workflowType: 'first-frame-lipsync' as DialogueWorkflowType,
          label: 'Reliable Generation (Multi-Character)',
          description: 'Single generation, all characters together. Faster & more cost-effective. Natural character interaction. Always generates successfully.',
          isMultiCharacter: true,
          isRecommended: true
        },
        {
          quality: 'premium' as DialogueQuality,
          workflowType: 'first-frame-lipsync' as DialogueWorkflowType,
          label: 'Premium Quality (Sequential Shots)',
          description: '3 separate generations (~3x cost, slower). Highest quality per character. Can review/edit individual shots. Some content may be restricted.',
          isMultiCharacter: true,
          costWarning: '~3x cost, slower generation'
        }
      ];
    } else {
      return [
        {
          quality: 'reliable' as DialogueQuality,
          workflowType: 'first-frame-lipsync' as DialogueWorkflowType,
          label: 'Reliable Generation (Standard)',
          description: 'Always generates successfully. May have minor visual artifacts (upscaled from 720p).',
        },
        {
          quality: 'reliable' as DialogueQuality,
          workflowType: 'extreme-closeup' as DialogueWorkflowType,
          label: 'Reliable Generation (Extreme Close-Up - Face)',
          description: 'Extreme close-up framing focusing on the face. Always generates successfully.',
        },
        {
          quality: 'reliable' as DialogueQuality,
          workflowType: 'extreme-closeup-mouth' as DialogueWorkflowType,
          label: 'Reliable Generation (Extreme Close-Up - Mouth)',
          description: 'Extreme close-up framing focusing on the mouth. Always generates successfully.',
        },
        {
          quality: 'premium' as DialogueQuality,
          workflowType: 'first-frame-lipsync' as DialogueWorkflowType,
          label: 'Premium Quality (Standard)',
          description: 'Highest quality output. Some content may be restricted by content safety filters.',
        },
        {
          quality: 'premium' as DialogueQuality,
          workflowType: 'extreme-closeup' as DialogueWorkflowType,
          label: 'Premium Quality (Extreme Close-Up - Face)',
          description: 'Extreme close-up framing focusing on the face. Highest quality output.',
        },
        {
          quality: 'premium' as DialogueQuality,
          workflowType: 'extreme-closeup-mouth' as DialogueWorkflowType,
          label: 'Premium Quality (Extreme Close-Up - Mouth)',
          description: 'Extreme close-up framing focusing on the mouth. Highest quality output.',
        }
      ];
    }
  }, [isMultiCharacter]);
  
  const voiceoverOptions = useMemo(() => [
    {
      workflowType: 'scene-voiceover' as DialogueWorkflowType,
      label: 'Narrate Shot (Scene Voiceover)',
      description: 'Create any shot type + add voiceover. The narrator can appear in the scene or just narrate over it.',
    },
    {
      workflowType: 'off-frame-voiceover' as DialogueWorkflowType,
      label: 'Hidden Mouth Dialogue (Off-Frame Voiceover)',
      description: 'Character speaking off-screen, back turned, or side profile. Create any shot type + add voiceover.',
    }
  ], []);
  
  const handleQualityWorkflowChange = (quality: DialogueQuality, workflow: DialogueWorkflowType) => {
    onQualityChange(quality);
    onWorkflowChange(workflow);
  };
  
  const isVoiceoverWorkflow = currentWorkflow === 'off-frame-voiceover' || currentWorkflow === 'scene-voiceover';
  
  return (
    <div className="space-y-4">
      {/* Lip Sync Options */}
      <div>
        <div className="text-xs font-medium text-[#FFFFFF] mb-2">LIP SYNC OPTIONS</div>
        <div className="space-y-2">
          {lipSyncOptions.map((option, idx) => {
            const isSelected = currentQuality === option.quality && 
                              currentWorkflow === option.workflowType;
            return (
              <label
                key={idx}
                className={`block p-3 rounded border cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[#DC143C]/20 border-[#DC143C]'
                    : 'bg-[#1A1A1A] border-[#3F3F46] hover:border-[#808080]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name={`dialogue-${shot.slot}`}
                    checked={isSelected}
                    onChange={() => handleQualityWorkflowChange(option.quality, option.workflowType)}
                    className="mt-1 w-3.5 h-3.5 text-[#DC143C] border-[#3F3F46] focus:ring-[#DC143C] focus:ring-offset-0 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-[#FFFFFF]">
                        {option.label}
                      </span>
                      {option.isRecommended && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#DC143C]/20 text-[#DC143C] rounded">
                          ⭐ Recommended
                        </span>
                      )}
                      {option.costWarning && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
                          ⚠️ {option.costWarning}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#808080] leading-relaxed">
                      {option.description}
                    </div>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>
      
      {/* Divider */}
      <div className="border-t border-[#3F3F46] my-4"></div>
      
      {/* Non-Lip Sync Options */}
      <div>
        <div className="text-xs font-medium text-[#FFFFFF] mb-2">NON-LIP SYNC OPTIONS</div>
        <div className="space-y-2">
          {voiceoverOptions.map((option, idx) => {
            const isSelected = currentWorkflow === option.workflowType;
            return (
              <div key={idx}>
                <label
                  className={`block p-3 rounded border cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#DC143C]/20 border-[#DC143C]'
                      : 'bg-[#1A1A1A] border-[#3F3F46] hover:border-[#808080]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name={`dialogue-${shot.slot}`}
                      checked={isSelected}
                      onChange={() => {
                        onWorkflowChange(option.workflowType);
                        // Voiceover workflows default to 'reliable' quality
                        onQualityChange('reliable');
                      }}
                      className="mt-1 w-3.5 h-3.5 text-[#DC143C] border-[#3F3F46] focus:ring-[#DC143C] focus:ring-offset-0 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-[#FFFFFF] mb-1">
                        {option.label}
                      </div>
                      <div className="text-[10px] text-[#808080] leading-relaxed">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </label>
                
                {/* Base Workflow Selector (shown when voiceover option is selected) */}
                {isSelected && onBaseWorkflowChange && (
                  <div className="mt-3 ml-6">
                    <label className="block text-[10px] text-[#808080] mb-1.5">
                      Base Workflow:
                    </label>
                    <Select
                      value={selectedBaseWorkflow || '__select__'}
                      onValueChange={(value) => {
                        // 🔥 FIX: Convert placeholder back to empty string, otherwise use the value
                        const actualValue = value === '__select__' ? 'action-line' : value;
                        onBaseWorkflowChange(actualValue);
                      }}
                    >
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__select__">Select a base workflow...</SelectItem>
                        {AVAILABLE_WORKFLOWS.map((wf) => (
                          <SelectItem key={wf.value} value={wf.value}>
                            {wf.label} {wf.value === 'action-line' ? '(suggested)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-[10px] text-[#808080] italic mt-1">
                      This will generate a {AVAILABLE_WORKFLOWS.find(wf => wf.value === (selectedBaseWorkflow || 'action-line'))?.label || 'selected workflow'} video and add voiceover audio to it.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Auto-detection indicator */}
      {detectedWorkflow && !selectedWorkflow && (
        <div className="flex items-center gap-2 mt-3 p-2 bg-[#3F3F46]/30 rounded">
          <Info className="w-3 h-3 text-[#808080]" />
          <div className="flex-1">
            <div className="text-[10px] text-[#808080]">
              Auto-detected: <span className="text-[#FFFFFF]">{detectedWorkflow}</span>
            </div>
            {workflowConfidence && (
              <div className={`text-[10px] mt-1 px-1.5 py-0.5 rounded inline-block ${
                workflowConfidence === 'high' ? 'bg-green-500/20 text-green-400' :
                workflowConfidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-orange-500/20 text-orange-400'
              }`}>
                {workflowConfidence === 'high' ? 'High' : workflowConfidence === 'medium' ? 'Medium' : 'Low'} confidence
              </div>
            )}
            {workflowReasoning && (
              <div className="text-[10px] text-[#808080] italic mt-1" title={workflowReasoning}>
                {workflowReasoning}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Override indicator */}
      {selectedWorkflow && selectedWorkflow !== detectedWorkflow && (
        <div className="text-[10px] text-[#808080] italic mt-2">
          Override: Using selected workflow instead of auto-detected
        </div>
      )}
    </div>
  );
}

