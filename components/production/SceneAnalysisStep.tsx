'use client';

/**
 * SceneAnalysisStep - Step 1 of Scene Builder Wizard
 * 
 * Features:
 * - Scene analysis display
 * - Shot selection checkboxes (all selected by default)
 * - Global Model Style Selector (Cinematic/Photorealistic/Auto)
 * - Props-to-Shots assignment (if props exist)
 * - Continue to shot configuration
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight, Film, Sparkles, Check } from 'lucide-react';
import { SceneAnalysisResult } from '@/types/screenplay';
import { toast } from 'sonner';

export type ModelStyle = 'cinematic' | 'photorealistic' | 'auto';
export type Resolution = '1080p' | '4k';

interface SceneAnalysisStepProps {
  sceneAnalysisResult: SceneAnalysisResult | null;
  enabledShots: number[];
  onEnabledShotsChange: (shots: number[]) => void;
  onNext: () => void;
  isAnalyzing: boolean;
  // Model Style Selector (global only - resolution moved to review step)
  globalStyle: ModelStyle;
  onGlobalStyleChange: (style: ModelStyle) => void;
  // Props-to-Shots Assignment
  sceneProps?: Array<{ id: string; name: string; imageUrl?: string; s3Key?: string }>;
  propsToShots: Record<string, number[]>; // propId -> shot slots
  onPropsToShotsChange: (assignment: Record<string, number[]>) => void;
}

export function SceneAnalysisStep({
  sceneAnalysisResult,
  enabledShots,
  onEnabledShotsChange,
                onNext,
                isAnalyzing,
                globalStyle,
                onGlobalStyleChange,
                sceneProps = [],
                propsToShots,
                onPropsToShotsChange
}: SceneAnalysisStepProps) {
  // Auto-select all shots when analysis completes
  useEffect(() => {
    if (sceneAnalysisResult?.shotBreakdown?.shots && enabledShots.length === 0) {
      const allShotSlots = sceneAnalysisResult.shotBreakdown.shots.map((s: any) => s.slot);
      onEnabledShotsChange(allShotSlots);
    }
  }, [sceneAnalysisResult?.shotBreakdown?.shots]);

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
  }, [sceneAnalysisResult?.shotBreakdown?.shots, sceneProps]);

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
        <CardContent className="space-y-4 pb-6">
          {/* Global Model Style Selector */}
          <div className="space-y-2 pb-3 border-b border-[#3F3F46]">
            <label className="block text-xs font-medium text-[#FFFFFF] mb-2">
              Model Style (applies to all shots)
            </label>
            <select
              value={globalStyle}
              onChange={(e) => onGlobalStyleChange(e.target.value as ModelStyle)}
              className="w-full px-3 py-1.5 bg-[#1A1A1A] border border-[#3F3F46] rounded text-xs text-[#FFFFFF] hover:border-[#808080] focus:border-[#DC143C] focus:outline-none transition-colors"
            >
              <option value="auto">Auto (Content-aware)</option>
              <option value="cinematic">Cinematic</option>
              <option value="photorealistic">Photorealistic</option>
            </select>
            <div className="text-[10px] text-[#808080] italic mt-1">
              You can override style for individual shots in shot configuration steps. Resolution will be set in the review step.
            </div>
          </div>

          {/* Shot Breakdown with Checkboxes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#FFFFFF]">
                Shot Breakdown ({selectedShotsCount} of {shots.length} selected)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const allSlots = shots.map((s: any) => s.slot);
                    onEnabledShotsChange(allSlots);
                  }}
                  className="text-[10px] text-[#808080] hover:text-[#DC143C] transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={() => onEnabledShotsChange([])}
                  className="text-[10px] text-[#808080] hover:text-[#DC143C] transition-colors"
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
                
                return (
                  <div
                    key={shot.slot}
                    className={`flex items-start gap-3 p-3 rounded border transition-colors ${
                      isSelected
                        ? 'bg-[#1A1A1A] border-[#3F3F46]'
                        : 'bg-[#0A0A0A] border-[#3F3F46] opacity-50'
                    }`}
                  >
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
                      className="mt-1 w-4 h-4 text-[#DC143C] rounded border-[#3F3F46] focus:ring-[#DC143C] focus:ring-offset-0 cursor-pointer"
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
                      
                      {/* Props Assignment - Integrated into shot row */}
                      {sceneProps.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#3F3F46]">
                          <div className="text-[10px] font-medium text-[#808080] mb-2">
                            Props ({assignedProps.length} assigned)
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {sceneProps.map((prop) => {
                              const isAssigned = propsToShots[prop.id]?.includes(shot.slot) || false;
                              return (
                                <label
                                  key={prop.id}
                                  className={`flex items-center gap-1.5 px-2 py-1 rounded border cursor-pointer transition-colors ${
                                    isAssigned
                                      ? 'border-[#DC143C] bg-[#DC143C]/10'
                                      : 'border-[#3F3F46] hover:border-[#808080]'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isAssigned}
                                    onChange={(e) => {
                                      const assignedShots = propsToShots[prop.id] || [];
                                      const newShots = e.target.checked
                                        ? [...assignedShots, shot.slot]
                                        : assignedShots.filter(s => s !== shot.slot);
                                      onPropsToShotsChange({
                                        ...propsToShots,
                                        [prop.id]: newShots
                                      });
                                    }}
                                    className="w-3 h-3 text-[#DC143C] rounded border-[#3F3F46] focus:ring-[#DC143C] focus:ring-offset-0"
                                  />
                                  {prop.imageUrl && (
                                    <img 
                                      src={prop.imageUrl} 
                                      alt={prop.name}
                                      className="w-4 h-4 object-cover rounded"
                                    />
                                  )}
                                  <span className="text-[10px] text-[#FFFFFF]">
                                    {prop.name}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
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

