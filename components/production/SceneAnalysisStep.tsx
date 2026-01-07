'use client';

/**
 * SceneAnalysisStep - Step 1 of Scene Builder Wizard
 * 
 * Features:
 * - Scene analysis display
 * - Shot selection checkboxes (all selected by default)
 * - Props-to-Shots assignment (if props exist)
 * - Continue to shot configuration
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Loader2, ArrowRight, Film, Sparkles, Check, Box, X } from 'lucide-react';
import { SceneAnalysisResult } from '@/types/screenplay';
import { useSceneBuilderState, useSceneBuilderActions } from '@/contexts/SceneBuilderContext';
import { toast } from 'sonner';

export type Resolution = '1080p' | '4k';

interface SceneAnalysisStepProps {
  sceneAnalysisResult: SceneAnalysisResult | null;
  enabledShots: number[];
  onEnabledShotsChange: (shots: number[]) => void;
  onNext: () => void;
  isAnalyzing: boolean;
  // Props-to-Shots Assignment
  sceneProps?: Array<{ id: string; name: string; imageUrl?: string; s3Key?: string }>;
  propsToShots: Record<string, number[]>; // propId -> shot slots
  onPropsToShotsChange: (assignment: Record<string, number[]>) => void;
}

export function SceneAnalysisStep({
  sceneAnalysisResult: sceneAnalysisResultProp,
  enabledShots: enabledShotsProp,
  onEnabledShotsChange: onEnabledShotsChangeProp,
  onNext,
  isAnalyzing,
  sceneProps: scenePropsProp = [],
  propsToShots: propsToShotsProp,
  onPropsToShotsChange: onPropsToShotsChangeProp
}: SceneAnalysisStepProps) {
  // Get state and actions from context (context is source of truth)
  const state = useSceneBuilderState();
  const actions = useSceneBuilderActions();
  
  // Use context values, fallback to props for backward compatibility
  // IMPORTANT: Always prefer context state over props since context is the source of truth
  // Even if state values are empty arrays/objects, they represent the actual state
  const sceneAnalysisResult = state.sceneAnalysisResult || sceneAnalysisResultProp;
  // Always use state.enabledShots (even if empty) - context is source of truth
  const enabledShots = state.enabledShots;
  const sceneProps = state.sceneProps.length > 0 ? state.sceneProps : scenePropsProp;
  // Always use state.propsToShots (even if empty) - context is source of truth
  const propsToShots = state.propsToShots;
  
  // Create handlers that use context actions
  const onEnabledShotsChange = useCallback((shots: number[]) => {
    console.log('[SceneAnalysisStep] onEnabledShotsChange called with:', shots);
    actions.setEnabledShots(shots);
    console.log('[SceneAnalysisStep] onEnabledShotsChange - context action called, checking state...');
    if (onEnabledShotsChangeProp) {
      onEnabledShotsChangeProp(shots);
    }
  }, [actions, onEnabledShotsChangeProp]);
  
  const onPropsToShotsChange = useCallback((assignment: Record<string, number[]>) => {
    console.log('[SceneAnalysisStep] onPropsToShotsChange called with:', assignment);
    actions.setPropsToShots(assignment);
    console.log('[SceneAnalysisStep] onPropsToShotsChange - context action called, checking state...');
    if (onPropsToShotsChangeProp) {
      onPropsToShotsChangeProp(assignment);
    }
  }, [actions, onPropsToShotsChangeProp]);
  
  // Auto-select all shots when analysis completes
  useEffect(() => {
    if (sceneAnalysisResult?.shotBreakdown?.shots && enabledShots.length === 0) {
      const allShotSlots = sceneAnalysisResult.shotBreakdown.shots.map((s: any) => s.slot);
      onEnabledShotsChange(allShotSlots);
    }
  }, [sceneAnalysisResult?.shotBreakdown?.shots, enabledShots.length, onEnabledShotsChange]);

  // Initialize props-to-shots assignment (default: all props in all shots)
  useEffect(() => {
    if (sceneAnalysisResult?.shotBreakdown?.shots && sceneProps.length > 0) {
      const allShotSlots = sceneAnalysisResult.shotBreakdown.shots.map((s: any) => s.slot);
      const initialAssignment: Record<string, number[]> = {};
      sceneProps.forEach(prop => {
        if (!propsToShots[prop.id]) {
          initialAssignment[prop.id] = [...allShotSlots];
        }
      });
      if (Object.keys(initialAssignment).length > 0) {
        onPropsToShotsChange({ ...propsToShots, ...initialAssignment });
      }
    }
  }, [sceneAnalysisResult?.shotBreakdown?.shots, sceneProps, propsToShots, onPropsToShotsChange]);

  if (isAnalyzing) {
    return (
      <Card className="bg-[#141414] border-[#3F3F46]">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#DC143C] mx-auto mb-3" />
          <div className="text-sm text-[#FFFFFF] mb-1">Analyzing Scene</div>
          <div className="text-xs text-[#808080]">Breaking down shots and identifying elements...</div>
        </CardContent>
      </Card>
    );
  }

  if (!sceneAnalysisResult) {
    return (
      <Card className="bg-[#141414] border-[#3F3F46]">
        <CardContent className="p-6 text-center">
          <Sparkles className="w-8 h-8 text-[#808080] mx-auto mb-3" />
          <div className="text-sm text-[#FFFFFF] mb-1">No Analysis Available</div>
          <div className="text-xs text-[#808080]">Please select a scene to analyze</div>
        </CardContent>
      </Card>
    );
  }

  const shots = sceneAnalysisResult.shotBreakdown?.shots || [];
  const selectedShotsCount = enabledShots.length;

  return (
    <div className="space-y-4">
      <Card className="bg-[#141414] border-[#3F3F46]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-[#FFFFFF] flex items-center gap-2">
            <Film className="w-4 h-4" />
            Scene Analysis & Shot Selection
          </CardTitle>
          <CardDescription className="text-[10px] text-[#808080]">
            Review the shot breakdown and select which shots to generate. Configure details in the next steps.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Props Assignment Section (if props exist) */}
          {sceneProps.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#FFFFFF]">
                  Props Assignment ({sceneProps.length} {sceneProps.length === 1 ? 'prop' : 'props'})
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('[SceneAnalysisStep] Props Select All clicked', { enabledShots, shots: shots.map((s: any) => s.slot), sceneProps });
                      // Select All: Assign all props to all enabled shots (or all shots if none enabled)
                      const allSlots = enabledShots.length > 0 ? enabledShots : shots.map((s: any) => s.slot);
                      const newPropsToShots: Record<string, number[]> = {};
                      sceneProps.forEach(prop => {
                        newPropsToShots[prop.id] = [...allSlots];
                      });
                      console.log('[SceneAnalysisStep] Props Select All - calling onPropsToShotsChange with:', newPropsToShots);
                      onPropsToShotsChange(newPropsToShots);
                    }}
                    className="text-[10px] text-[#808080] hover:text-[#DC143C] transition-colors cursor-pointer"
                  >
                    Select All
                  </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[SceneAnalysisStep] Props Deselect All clicked', { currentPropsToShots: propsToShots });
                    // Deselect All: Remove all props from all shots
                    // 🔥 FIX: Force state update by creating a new empty object (not reusing empty object)
                    const emptyPropsToShots: Record<string, number[]> = {};
                    console.log('[SceneAnalysisStep] Props Deselect All - calling onPropsToShotsChange with:', emptyPropsToShots);
                    onPropsToShotsChange(emptyPropsToShots);
                  }}
                  className="text-[10px] text-[#808080] hover:text-[#DC143C] transition-colors cursor-pointer"
                >
                  Deselect All
                </button>
                </div>
              </div>
              {/* Props List with Checkboxes */}
              <div className="space-y-2 p-2 bg-[#0A0A0A] rounded border border-[#3F3F46]">
                {sceneProps.map((prop) => {
                  // Check if prop is assigned to all enabled shots (or all shots if none enabled)
                  const targetShots = enabledShots.length > 0 ? enabledShots : shots.map((s: any) => s.slot);
                  const assignedShots = propsToShots[prop.id] || [];
                  const isAssignedToAll = targetShots.length > 0 && 
                    targetShots.every(slot => assignedShots.includes(slot));
                  
                  // 🔥 DEBUG: Log checkbox state
                  if (prop.id === sceneProps[0]?.id) {
                    console.log('[SceneAnalysisStep] Prop checkbox state:', {
                      propId: prop.id,
                      targetShots,
                      assignedShots,
                      isAssignedToAll,
                      propsToShotsKeys: Object.keys(propsToShots),
                      propsToShotsEmpty: Object.keys(propsToShots).length === 0
                    });
                  }
                  
                  return (
                    <label
                      key={prop.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-[#1A1A1A] p-1.5 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isAssignedToAll}
                        onChange={(e) => {
                          const assignedShots = propsToShots[prop.id] || [];
                          const newShots = e.target.checked
                            ? [...new Set([...assignedShots, ...targetShots])] // Add to all target shots
                            : assignedShots.filter(s => !targetShots.includes(s)); // Remove from target shots
                          onPropsToShotsChange({
                            ...propsToShots,
                            [prop.id]: newShots
                          });
                        }}
                        className="w-3.5 h-3.5 text-[#DC143C] rounded border-[#3F3F46] focus:ring-[#DC143C] focus:ring-offset-0 cursor-pointer"
                      />
                      {prop.imageUrl && (
                        <img 
                          src={prop.imageUrl} 
                          alt={prop.name}
                          className="w-4 h-4 object-cover rounded"
                        />
                      )}
                      <span className="text-xs text-[#FFFFFF]">
                        {prop.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Shot Breakdown with Checkboxes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#FFFFFF]">
                Shot Breakdown ({selectedShotsCount} of {shots.length} selected)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[SceneAnalysisStep] Shots Select All clicked', { shots: shots.map((s: any) => s.slot) });
                    const allSlots = shots.map((s: any) => s.slot);
                    console.log('[SceneAnalysisStep] Shots Select All - calling onEnabledShotsChange with:', allSlots);
                    onEnabledShotsChange(allSlots);
                  }}
                  className="text-[10px] text-[#808080] hover:text-[#DC143C] transition-colors cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[SceneAnalysisStep] Shots Deselect All clicked', { currentEnabledShots: enabledShots });
                    // 🔥 FIX: Force state update by creating a new empty array (not reusing empty array)
                    const emptyShots: number[] = [];
                    console.log('[SceneAnalysisStep] Shots Deselect All - calling onEnabledShotsChange with:', emptyShots);
                    onEnabledShotsChange(emptyShots);
                  }}
                  className="text-[10px] text-[#808080] hover:text-[#DC143C] transition-colors cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {shots.map((shot: any) => {
                const isSelected = enabledShots.includes(shot.slot);
                // Get props assigned to this shot
                const assignedProps = sceneProps.filter(prop => 
                  propsToShots[prop.id]?.includes(shot.slot)
                );
                
                // 🔥 DEBUG: Log shot checkbox state
                if (shot.slot === shots[0]?.slot) {
                  console.log('[SceneAnalysisStep] Shot checkbox state:', {
                    shotSlot: shot.slot,
                    enabledShots,
                    isSelected,
                    enabledShotsLength: enabledShots.length,
                    enabledShotsEmpty: enabledShots.length === 0
                  });
                }
                
                return (
                  <div
                    key={shot.slot}
                    className={`flex items-start gap-3 p-3 rounded border transition-colors ${
                      isSelected
                        ? 'bg-[#1A1A1A] border-[#3F3F46]'
                        : 'bg-[#0A0A0A] border-[#3F3F46] opacity-50'
                    }`}
                  >
                    {/* Left Side: Shot Info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onEnabledShotsChange([...enabledShots, shot.slot]);
                          } else {
                            onEnabledShotsChange(enabledShots.filter(s => s !== shot.slot));
                          }
                        }}
                        className="mt-1 w-4 h-4 text-[#DC143C] rounded border-[#3F3F46] focus:ring-[#DC143C] focus:ring-offset-0 cursor-pointer flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-[#FFFFFF]">
                            Shot {shot.slot}
                          </span>
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
                        <div className="text-xs text-[#808080] mt-1 line-clamp-2">
                          {shot.description || shot.dialogueBlock?.dialogue || 'No description'}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-[#808080]">
                            {shot.credits || 0} credits
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right Side: Props Assignment - Badges (only show assigned props) */}
                    {sceneProps.length > 0 && (() => {
                      // Get props assigned to this shot
                      const assignedProps = sceneProps.filter(prop => 
                        propsToShots[prop.id]?.includes(shot.slot)
                      );
                      
                      if (assignedProps.length === 0) return null;
                      
                      return (
                        <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0 justify-end max-w-[120px]">
                          {assignedProps.map((prop) => (
                            <Tooltip key={prop.id}>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => {
                                    // Remove this prop from this shot
                                    const assignedShots = propsToShots[prop.id] || [];
                                    const newShots = assignedShots.filter(s => s !== shot.slot);
                                    const updatedPropsToShots = { ...propsToShots };
                                    if (newShots.length > 0) {
                                      updatedPropsToShots[prop.id] = newShots;
                                    } else {
                                      delete updatedPropsToShots[prop.id];
                                    }
                                    onPropsToShotsChange(updatedPropsToShots);
                                  }}
                                  className="group relative flex items-center justify-center w-6 h-6 rounded border border-[#DC143C] bg-[#DC143C]/10 hover:bg-[#DC143C]/20 transition-colors cursor-pointer"
                                  title={`Click to remove ${prop.name}`}
                                >
                                  {prop.imageUrl ? (
                                    <img 
                                      src={prop.imageUrl} 
                                      alt={prop.name}
                                      className="w-4 h-4 object-cover rounded"
                                    />
                                  ) : (
                                    <Box className="w-3 h-3 text-[#DC143C]" />
                                  )}
                                  <X className="absolute -top-1 -right-1 w-2.5 h-2.5 text-[#DC143C] opacity-0 group-hover:opacity-100 transition-opacity bg-[#0A0A0A] rounded-full" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-[#1A1A1A] text-[#FFFFFF] border border-[#3F3F46]">
                                <p className="text-xs font-medium">{prop.name}</p>
                                <p className="text-[10px] text-[#808080] mt-0.5">Click to remove</p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Continue Button - Moved to Scene Preview section */}
        </CardContent>
      </Card>
    </div>
  );
}


