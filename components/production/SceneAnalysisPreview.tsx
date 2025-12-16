'use client';

/**
 * SceneAnalysisPreview - Feature 0136 Phase 2.2
 * 
 * Compact summary card showing Scene Analyzer results
 * Default: Compact view with key info
 * Expandable: Detailed shot breakdown and workflow reasoning
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Film, Users, MapPin, Package, Coins, Clock, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { SceneAnalysisResult } from '@/types/screenplay';

interface SceneAnalysisPreviewProps {
  analysis: SceneAnalysisResult;
  isAnalyzing?: boolean;
  error?: string | null;
}

export function SceneAnalysisPreview({ analysis, isAnalyzing = false, error }: SceneAnalysisPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Show loading state
  if (isAnalyzing) {
    return (
      <Card className="bg-[#141414] border-[#3F3F46]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-[#808080] text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#DC143C] border-t-transparent" />
            <span>Analyzing scene...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-[#141414] border-[#DC143C]/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-[#DC143C] text-sm">
            <AlertCircle className="w-4 h-4" />
            <div>
              <div className="font-medium">Analysis Error</div>
              <div className="text-xs text-[#808080] mt-0.5">{error}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card className="bg-[#141414] border-[#DC143C]/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-[#DC143C] text-sm">
            <AlertCircle className="w-4 h-4" />
            <div>
              <div className="font-medium">Analysis Error</div>
              <div className="text-xs text-[#808080] mt-0.5">{error}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show nothing if no analysis yet
  if (!analysis) {
    return null;
  }

  const { shotBreakdown, characters, location, assets, workflowRecommendations, sceneType } = analysis;

  // Count shot types for expandable view
  const shotTypeCounts = shotBreakdown.shots.reduce((acc, shot) => {
    acc[shot.type] = (acc[shot.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const shotTypeLabels: Record<string, string> = {
    'establishing': 'Establishing',
    'character': 'Character',
    'vfx': 'VFX',
    'broll': 'B-roll',
    'dialogue': 'Dialogue'
  };

  // Format workflow name for display
  const formatWorkflowName = (workflowId: string): string => {
    return workflowId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const primaryWorkflow = workflowRecommendations?.[0];

  return (
    <Card className="bg-[#141414] border-[#3F3F46]">
      <CardHeader className="pb-1.5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-[#FFFFFF] flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#DC143C]" />
            Scene Analysis
          </CardTitle>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[#808080] hover:text-[#FFFFFF] transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {/* Compact View - Always Visible */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Scene Type */}
          <Badge variant="outline" className="border-[#DC143C] text-[#DC143C] text-xs">
            {sceneType.charAt(0).toUpperCase() + sceneType.slice(1)}
          </Badge>
          
          {/* Credits & Time */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Coins className="w-3 h-3 text-[#DC143C]" />
              <span className="text-[#FFFFFF] font-medium">{shotBreakdown.totalCredits}</span>
              <span className="text-[#808080]">credits</span>
            </div>
            <span className="text-[#3F3F46]">•</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#DC143C]" />
              <span className="text-[#FFFFFF]">{shotBreakdown.estimatedTime}</span>
            </div>
          </div>
        </div>

        {/* References - Compact List */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {/* Characters */}
          {characters.map((char) => (
            <div key={char.id} className="flex items-center gap-1.5 px-2 py-1 bg-[#0A0A0A] rounded border border-[#3F3F46]">
              {char.hasReferences ? (
                <CheckCircle2 className="w-3 h-3 text-green-500" />
              ) : (
                <AlertCircle className="w-3 h-3 text-yellow-500" />
              )}
              <span className="text-[#FFFFFF]">{char.name}</span>
              {char.hasReferences && (
                <span className="text-[#808080]">({char.references.length})</span>
              )}
            </div>
          ))}
          
          {/* Location */}
          {location.id && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#0A0A0A] rounded border border-[#3F3F46]">
              {location.hasReference ? (
                <CheckCircle2 className="w-3 h-3 text-green-500" />
              ) : (
                <AlertCircle className="w-3 h-3 text-yellow-500" />
              )}
              <span className="text-[#FFFFFF]">{location.name}</span>
            </div>
          )}
          
          {/* Assets */}
          {assets.map((asset) => (
            <div key={asset.id} className="flex items-center gap-1.5 px-2 py-1 bg-[#0A0A0A] rounded border border-[#3F3F46]">
              {asset.hasReference ? (
                <CheckCircle2 className="w-3 h-3 text-green-500" />
              ) : (
                <AlertCircle className="w-3 h-3 text-yellow-500" />
              )}
              <span className="text-[#FFFFFF]">{asset.name}</span>
            </div>
          ))}
        </div>

        {/* Workflow - Compact */}
        {primaryWorkflow && (
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#DC143C]" />
            <span className="text-[#808080]">Workflow:</span>
            <span className="text-[#FFFFFF] font-medium">{formatWorkflowName(primaryWorkflow.workflowId)}</span>
            <Badge 
              variant="outline" 
              className={`text-xs ${
                primaryWorkflow.confidence === 'high' 
                  ? 'border-green-500 text-green-500' 
                  : primaryWorkflow.confidence === 'medium'
                  ? 'border-yellow-500 text-yellow-500'
                  : 'border-[#808080] text-[#808080]'
              }`}
            >
              {primaryWorkflow.confidence}
            </Badge>
          </div>
        )}

        {/* Expandable Details */}
        {isExpanded && (
          <div className="pt-3 border-t border-[#3F3F46] space-y-3">
            {/* Shot Breakdown Details */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Film className="w-3.5 h-3.5 text-[#DC143C]" />
                <span className="text-sm font-medium text-[#FFFFFF]">Generation Plan</span>
                <span className="text-xs text-[#808080]">({shotBreakdown.totalShots} videos)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(shotTypeCounts).map(([type, count]) => (
                  <Badge key={type} variant="secondary" className="bg-[#1F1F1F] text-[#808080] text-xs">
                    {count} {shotTypeLabels[type] || type}
                  </Badge>
                ))}
              </div>
              {/* Individual shots */}
              <div className="mt-2 space-y-1">
                {shotBreakdown.shots.map((shot, idx) => (
                  <div key={idx} className="text-xs text-[#808080] pl-5">
                    {shot.slot}. {shot.description}
                  </div>
                ))}
              </div>
            </div>

            {/* Workflow Reasoning */}
            {primaryWorkflow && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#DC143C]" />
                  <span className="text-sm font-medium text-[#FFFFFF]">Why This Workflow?</span>
                </div>
                <p className="text-xs text-[#808080] pl-5">{primaryWorkflow.reasoning}</p>
              </div>
            )}

            {/* Missing References Warning */}
            {(characters.some(c => !c.hasReferences) || (location.id && !location.hasReference) || assets.some(a => !a.hasReference)) && (
              <div className="p-2 bg-yellow-500/10 border border-yellow-500/50 rounded text-xs text-yellow-500">
                <div className="font-medium mb-1">Missing References:</div>
                <ul className="list-disc list-inside space-y-0.5">
                  {characters.filter(c => !c.hasReferences).map(c => (
                    <li key={c.id}>{c.name} - Add in Character Bank</li>
                  ))}
                  {location.id && !location.hasReference && (
                    <li>{location.name} - Add in Location Bank</li>
                  )}
                  {assets.filter(a => !a.hasReference).map(a => (
                    <li key={a.id}>{a.name} - Add in Asset Bank</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

