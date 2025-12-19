'use client';

/**
 * WorkflowRecommendationsPanel - Feature Workflow Detection Phase 2
 * 
 * Displays all detected workflows with checkboxes for selection
 * Shows confidence scores, reasoning, and combination hints
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { WorkflowRecommendation } from '@/types/screenplay';

interface WorkflowRecommendationsPanelProps {
  recommendations: WorkflowRecommendation[];
  selectedWorkflows: string[];
  onToggleWorkflow: (workflowId: string) => void;
}

function ConfidenceBadge({ level, score }: { level: 'high' | 'medium' | 'low', score: number }) {
  const colors = {
    high: 'bg-green-600 text-white',
    medium: 'bg-yellow-600 text-white',
    low: 'bg-orange-600 text-white'
  };
  
  return (
    <Badge className={`${colors[level]} text-xs font-semibold`}>
      <span className="capitalize">{level}</span>
      <span className="ml-1">({score}%)</span>
    </Badge>
  );
}

function getWorkflowIcon(workflowId: string): string {
  const icons: Record<string, string> = {
    'reality-to-toon': '🎨',
    'superhero-transform': '🦸',
    'animal-kingdom': '🐺',
    'style-chameleon': '🦎',
    'anime-master': '🎌',
    'cartoon-classic': '📺',
    '3d-character': '🎮',
    'vfx-elements': '✨',
    'fantasy-epic': '🐉',
    'voice-consistency-system': '🎙️',
    'action-director': '💥',
    'reverse-action-builder': '⏪',
    'broll-master': '📹',
    'hollywood-standard': '🎬',
    'complete-scene': '🎞️'
  };
  return icons[workflowId] || '🎬';
}

export function WorkflowRecommendationsPanel({
  recommendations,
  selectedWorkflows,
  onToggleWorkflow
}: WorkflowRecommendationsPanelProps) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="bg-[#141414] border-[#3F3F46]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-[#FFFFFF] flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#DC143C]" />
          Recommended Workflows
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        {recommendations.map((rec) => {
          const isSelected = selectedWorkflows.includes(rec.workflowId);
          
          return (
            <div
              key={rec.workflowId}
              className={`bg-[#1F1F1F] border rounded-lg p-3 transition-all cursor-pointer ${
                isSelected 
                  ? 'border-[#DC143C] border-2' 
                  : 'border-[#3F3F46] hover:border-[#52525B]'
              }`}
              onClick={() => onToggleWorkflow(rec.workflowId)}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleWorkflow(rec.workflowId)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 w-4 h-4 text-[#DC143C] rounded border-[#3F3F46] focus:ring-[#DC143C] focus:ring-offset-0 cursor-pointer"
                />
                
                <div className="flex-1 min-w-0">
                  {/* Workflow Name & Confidence */}
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-base">{getWorkflowIcon(rec.workflowId)}</span>
                    <h3 className="text-sm font-semibold text-[#FFFFFF]">
                      {rec.workflowName}
                    </h3>
                    <ConfidenceBadge level={rec.confidence} score={rec.confidenceScore} />
                  </div>
                  
                  {/* Reasoning */}
                  <p className="text-xs text-[#808080] mb-2">
                    {rec.reasoning}
                  </p>
                  
                  {/* Can Combine Indicator */}
                  {rec.canCombine && (
                    <div className="flex items-center gap-1.5 text-xs text-green-400">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Can combine with other workflows</span>
                    </div>
                  )}
                  
                  {/* Combination Hint */}
                  {rec.combinationHint && (
                    <p className="text-xs text-[#52525B] italic mt-1">
                      {rec.combinationHint}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

