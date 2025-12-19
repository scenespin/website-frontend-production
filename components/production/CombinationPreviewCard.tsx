'use client';

/**
 * CombinationPreviewCard - Feature Workflow Detection Phase 2
 * 
 * Shows preview when 2+ workflows are selected
 * Displays combined credits, time, and generate button
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Coins, Clock, Sparkles } from 'lucide-react';
import { WorkflowRecommendation } from '@/types/screenplay';

interface CombinationPreviewCardProps {
  selectedWorkflows: string[];
  recommendations: WorkflowRecommendation[];
  onGenerate: () => void;
  isGenerating?: boolean;
}

// Estimate credits per workflow (rough estimates)
const WORKFLOW_CREDITS: Record<string, number> = {
  'reality-to-toon': 150,
  'superhero-transform': 150,
  'animal-kingdom': 150,
  'style-chameleon': 150,
  'anime-master': 150,
  'cartoon-classic': 150,
  '3d-character': 150,
  'vfx-elements': 100,
  'fantasy-epic': 200,
  'voice-consistency-system': 200,
  'action-director': 100,
  'reverse-action-builder': 100,
  'broll-master': 50,
  'hollywood-standard': 75,
  'complete-scene': 200
};

// Estimate time per workflow (minutes)
const WORKFLOW_TIME: Record<string, number> = {
  'reality-to-toon': 3,
  'superhero-transform': 3,
  'animal-kingdom': 3,
  'style-chameleon': 3,
  'anime-master': 3,
  'cartoon-classic': 3,
  '3d-character': 3,
  'vfx-elements': 2,
  'fantasy-epic': 4,
  'voice-consistency-system': 3,
  'action-director': 2,
  'reverse-action-builder': 2,
  'broll-master': 1,
  'hollywood-standard': 2,
  'complete-scene': 4
};

export function CombinationPreviewCard({
  selectedWorkflows,
  recommendations,
  onGenerate,
  isGenerating = false
}: CombinationPreviewCardProps) {
  if (selectedWorkflows.length < 2) {
    return null;
  }

  // Get selected workflow details
  const selectedRecs = recommendations.filter(rec => 
    selectedWorkflows.includes(rec.workflowId)
  );

  // Calculate combined credits
  const totalCredits = selectedWorkflows.reduce((sum, workflowId) => {
    return sum + (WORKFLOW_CREDITS[workflowId] || 100);
  }, 0);

  // Calculate combined time (parallel where possible, sequential for dialogue)
  const hasDialogue = selectedWorkflows.includes('voice-consistency-system');
  const totalTime = hasDialogue
    ? selectedWorkflows.reduce((sum, workflowId) => sum + (WORKFLOW_TIME[workflowId] || 2), 0)
    : Math.max(...selectedWorkflows.map(id => WORKFLOW_TIME[id] || 2)) + 2; // Max + overhead

  return (
    <Card className="bg-green-900/20 border-2 border-green-500">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <h4 className="text-sm font-semibold text-green-400">
            Combined Workflow Preview
          </h4>
        </div>
        
        {/* Selected Workflows List */}
        <div className="mb-3">
          <p className="text-xs text-[#808080] mb-2">You're combining:</p>
          <ul className="list-disc list-inside text-xs text-[#FFFFFF] space-y-1">
            {selectedRecs.map(rec => (
              <li key={rec.workflowId}>{rec.workflowName}</li>
            ))}
          </ul>
        </div>
        
        {/* Credits & Time Estimate */}
        <div className="mb-4 p-3 bg-[#1F1F1F] rounded">
          <div className="flex justify-between items-center text-xs mb-2">
            <div className="flex items-center gap-1.5 text-[#808080]">
              <Coins className="w-3.5 h-3.5" />
              <span>Estimated Credits:</span>
            </div>
            <span className="text-[#FFFFFF] font-semibold">{totalCredits}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5 text-[#808080]">
              <Clock className="w-3.5 h-3.5" />
              <span>Estimated Time:</span>
            </div>
            <span className="text-[#FFFFFF] font-semibold">
              ~{totalTime} {totalTime === 1 ? 'minute' : 'minutes'}
            </span>
          </div>
        </div>
        
        {/* Generate Button */}
        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
        >
          {isGenerating ? (
            <>
              <Sparkles className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Combined Workflow'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

