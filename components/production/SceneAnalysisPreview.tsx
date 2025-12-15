'use client';

/**
 * SceneAnalysisPreview - Feature 0136 Phase 2.2
 * 
 * Displays Scene Analyzer results in a user-friendly preview card
 * Shows shot breakdown, credit estimates, references, and workflow recommendations
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Film, Users, MapPin, Package, Coins, Clock, Sparkles } from 'lucide-react';
import { SceneAnalysisResult } from '@/types/screenplay';

interface SceneAnalysisPreviewProps {
  analysis: SceneAnalysisResult;
  isAnalyzing?: boolean;
  error?: string | null;
}

export function SceneAnalysisPreview({ analysis, isAnalyzing = false, error }: SceneAnalysisPreviewProps) {
  if (isAnalyzing) {
    return (
      <Card className="bg-[#141414] border-[#3F3F46]">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-[#808080]">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#DC143C] border-t-transparent" />
            <span>Analyzing scene...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-[#141414] border-[#DC143C]/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-[#DC143C]">
            <AlertCircle className="w-5 h-5" />
            <div>
              <div className="font-medium">Analysis Error</div>
              <div className="text-sm text-[#808080] mt-1">{error}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { shotBreakdown, characters, location, assets, workflowRecommendations, sceneType } = analysis;

  // Count shot types
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

  return (
    <Card className="bg-[#141414] border-[#3F3F46]">
      <CardHeader>
        <CardTitle className="text-lg text-[#FFFFFF] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#DC143C]" />
          Scene Analysis
        </CardTitle>
        <CardDescription className="text-[#808080]">
          Intelligent analysis of your scene with automatic workflow recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scene Type Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-[#DC143C] text-[#DC143C]">
            {sceneType.charAt(0).toUpperCase() + sceneType.slice(1)} Scene
          </Badge>
        </div>

        {/* Shot Breakdown */}
        <div className="p-4 bg-[#0A0A0A] rounded-lg border border-[#3F3F46]">
          <div className="flex items-center gap-2 mb-3">
            <Film className="w-4 h-4 text-[#DC143C]" />
            <span className="font-medium text-[#FFFFFF]">Shot Breakdown</span>
          </div>
          <div className="flex items-center gap-4 mb-2">
            <span className="text-2xl font-bold text-[#FFFFFF]">{shotBreakdown.totalShots}</span>
            <span className="text-sm text-[#808080]">shots</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(shotTypeCounts).map(([type, count]) => (
              <Badge key={type} variant="secondary" className="bg-[#1F1F1F] text-[#808080]">
                {count} {shotTypeLabels[type] || type}
              </Badge>
            ))}
          </div>
        </div>

        {/* Credit & Time Estimates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-[#0A0A0A] rounded-lg border border-[#3F3F46]">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-4 h-4 text-[#DC143C]" />
              <span className="text-xs text-[#808080]">Credits</span>
            </div>
            <div className="text-lg font-bold text-[#FFFFFF]">{shotBreakdown.totalCredits}</div>
          </div>
          <div className="p-3 bg-[#0A0A0A] rounded-lg border border-[#3F3F46]">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-[#DC143C]" />
              <span className="text-xs text-[#808080]">Time</span>
            </div>
            <div className="text-lg font-bold text-[#FFFFFF]">{shotBreakdown.estimatedTime}</div>
          </div>
        </div>

        {/* Character References */}
        {characters.length > 0 && (
          <div className="p-4 bg-[#0A0A0A] rounded-lg border border-[#3F3F46]">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-[#DC143C]" />
              <span className="font-medium text-[#FFFFFF]">Characters ({characters.length})</span>
            </div>
            <div className="space-y-2">
              {characters.map((char) => (
                <div key={char.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#FFFFFF]">{char.name}</span>
                    {char.hasReferences ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  {char.hasReferences && (
                    <Badge variant="secondary" className="bg-[#1F1F1F] text-[#808080] text-xs">
                      {char.references.length} ref{char.references.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            {characters.some(c => !c.hasReferences) && (
              <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/50 rounded text-xs text-yellow-500">
                Some characters are missing reference images. Add them in Character Bank for better consistency.
              </div>
            )}
          </div>
        )}

        {/* Location Reference */}
        {location.id && (
          <div className="p-4 bg-[#0A0A0A] rounded-lg border border-[#3F3F46]">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-[#DC143C]" />
              <span className="font-medium text-[#FFFFFF]">Location</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#FFFFFF]">{location.name}</span>
              {location.hasReference ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              )}
            </div>
            {!location.hasReference && (
              <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/50 rounded text-xs text-yellow-500">
                Location reference missing. Add it in Location Bank for establishing shots.
              </div>
            )}
          </div>
        )}

        {/* Asset References */}
        {assets.length > 0 && (
          <div className="p-4 bg-[#0A0A0A] rounded-lg border border-[#3F3F46]">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-[#DC143C]" />
              <span className="font-medium text-[#FFFFFF]">Assets ({assets.length})</span>
            </div>
            <div className="space-y-2">
              {assets.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between">
                  <span className="text-sm text-[#FFFFFF]">{asset.name}</span>
                  {asset.hasReference ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workflow Recommendations */}
        {workflowRecommendations && workflowRecommendations.length > 0 && (
          <div className="p-4 bg-[#0A0A0A] rounded-lg border border-[#3F3F46]">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#DC143C]" />
              <span className="font-medium text-[#FFFFFF]">Recommended Workflows</span>
            </div>
            <div className="space-y-2">
              {workflowRecommendations.map((rec, idx) => (
                <div key={idx} className="p-2 bg-[#1F1F1F] rounded border border-[#3F3F46]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[#FFFFFF]">
                      {rec.shotType.charAt(0).toUpperCase() + rec.shotType.slice(1).replace('-', ' ')}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={
                        rec.confidence === 'high' 
                          ? 'border-green-500 text-green-500' 
                          : rec.confidence === 'medium'
                          ? 'border-yellow-500 text-yellow-500'
                          : 'border-[#808080] text-[#808080]'
                      }
                    >
                      {rec.confidence} confidence
                    </Badge>
                  </div>
                  <p className="text-xs text-[#808080] mt-1">{rec.reasoning}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

