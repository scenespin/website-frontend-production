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

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Info, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Base Workflow Dropdown Component (Custom DaisyUI Dropdown)
function BaseWorkflowDropdown({ 
  value, 
  workflows, 
  onChange 
}: { 
  value: string; 
  workflows: Array<{ value: string; label: string }>; 
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLabel = workflows.find(wf => wf.value === value)?.label || 'Action Line';

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
        className="w-full h-8 text-xs px-3 py-1.5 bg-[#1F1F1F] border border-[#3F3F46] rounded-md text-[#FFFFFF] flex items-center justify-between hover:bg-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent"
      >
        <span>{currentLabel} {value === 'hollywood-standard' ? '(suggested)' : ''}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <ul
          className="absolute top-full left-0 mt-1 w-full menu p-2 shadow-lg bg-[#1F1F1F] rounded-box border border-[#3F3F46] z-[9999] max-h-96 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {workflows.map((wf) => (
            <li key={wf.value}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(wf.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 w-full text-left px-2 py-1.5 rounded text-xs",
                  value === wf.value
                    ? "bg-[#DC143C]/20 text-[#FFFFFF]"
                    : "text-[#808080] hover:bg-[#2A2A2A] hover:text-[#FFFFFF]"
                )}
              >
                {wf.label} {wf.value === 'hollywood-standard' ? '(suggested)' : ''}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
  showOnlyLipSync?: boolean; // 🔥 NEW: If true, only show lip-sync options (hide non-lip-sync)
}

// Available base workflows for voiceover options
const AVAILABLE_WORKFLOWS = [
  { value: 'hollywood-standard', label: 'Hollywood Standard' },
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
  workflowReasoning,
  showOnlyLipSync = false // 🔥 NEW: Default to showing both sections
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
          label: 'Wryda (Multi-Character)',
          description: 'Single generation, all characters together. Faster & more cost-effective. Natural character interaction. Always generates successfully.',
          isMultiCharacter: true,
          isRecommended: true
        },
        {
          quality: 'premium' as DialogueQuality,
          workflowType: 'first-frame-lipsync' as DialogueWorkflowType,
          label: 'Premium Lip Sync (Sequential Shots)',
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
          label: 'Wryda (Standard)',
          description: 'Always generates successfully. May have minor visual artifacts.',
        },
        {
          quality: 'reliable' as DialogueQuality,
          workflowType: 'extreme-closeup' as DialogueWorkflowType,
          label: 'Wryda (Extreme Close-Up - Face)',
          description: 'Extreme close-up framing focusing on the face. Always generates successfully.',
        },
        {
          quality: 'reliable' as DialogueQuality,
          workflowType: 'extreme-closeup-mouth' as DialogueWorkflowType,
          label: 'Wryda (Extreme Close-Up - Mouth)',
          description: 'Extreme close-up framing focusing on the mouth. Always generates successfully.',
        },
        {
          quality: 'premium' as DialogueQuality,
          workflowType: 'first-frame-lipsync' as DialogueWorkflowType,
          label: 'Premium Lip Sync (Standard)',
          description: 'Highest quality output. Some content may be restricted by content safety filters.',
        },
        {
          quality: 'premium' as DialogueQuality,
          workflowType: 'extreme-closeup' as DialogueWorkflowType,
          label: 'Premium Lip Sync (Extreme Close-Up - Face)',
          description: 'Extreme close-up framing focusing on the face. Highest quality output.',
        },
        {
          quality: 'premium' as DialogueQuality,
          workflowType: 'extreme-closeup-mouth' as DialogueWorkflowType,
          label: 'Premium Lip Sync (Extreme Close-Up - Mouth)',
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
      
      {/* Divider - Only show if non-lip-sync options are visible */}
      {!showOnlyLipSync && <div className="border-t border-[#3F3F46] my-4"></div>}
      
      {/* Non-Lip Sync Options - Only show if showOnlyLipSync is false */}
      {!showOnlyLipSync && (
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
                    <BaseWorkflowDropdown
                      key={`base-workflow-${shot.slot}-${selectedWorkflow}`}
                      value={selectedBaseWorkflow || 'hollywood-standard'}
                      workflows={AVAILABLE_WORKFLOWS}
                      onChange={(value) => {
                        if (onBaseWorkflowChange) {
                          console.log('[UnifiedDialogueDropdown] Base workflow changed:', value);
                          onBaseWorkflowChange(value);
                        }
                      }}
                    />
                    <div className="text-[10px] text-[#808080] italic mt-1">
                      This will generate a {AVAILABLE_WORKFLOWS.find(wf => wf.value === (selectedBaseWorkflow || 'hollywood-standard'))?.label || 'selected workflow'} video and add voiceover audio to it.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}
      
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

