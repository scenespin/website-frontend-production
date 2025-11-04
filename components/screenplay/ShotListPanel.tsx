/**
 * Shot List Panel - Professional Cinematography Shot Breakdown
 * 
 * Displays AI-generated shot list with visual previews, editing capabilities,
 * and direct integration with video generation pipeline.
 * 
 * Styled with clapboard aesthetic to match Composition Studio
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Film,
  Camera,
  Clock,
  Edit3,
  Check,
  X,
  Download,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Play,
  Clapperboard
} from 'lucide-react';

// Shot type definitions
export interface Shot {
  id: string;
  sceneNumber: number;
  shotNumber: number;
  shotType: string;
  cameraMovement: string;
  subject: string;
  description: string;
  duration: number;
  startTime: number;
  endTime: number;
  pace: string;
  fountainContext: string;
  compositionNotes: string;
  suggestedLens?: string;
  lightingMood?: string;
  colorPalette?: string;
  visualPrompt?: string;
  negativePrompt?: string;
  generatedVideoUrl?: string;    // After video generation
  isGenerating?: boolean;
}

export interface ShotList {
  id: string;
  projectId: string;
  sceneId: string;
  sceneName: string;
  shots: Shot[];
  totalDuration: number;
  totalShots: number;
  estimatedCost: number;
  generatedAt: Date;
}

interface ShotListPanelProps {
  shotList: ShotList | null;
  onGenerateVideos?: (shots: Shot[]) => void;
  onUpdateShot?: (shotId: string, updates: Partial<Shot>) => void;
  onClose?: () => void;
  onImportToTimeline?: (shots: Shot[]) => void; // NEW: Import to timeline
  isGenerating?: boolean;
}

// Shot type icons and colors
const SHOT_TYPE_INFO: Record<string, { icon: string; color: string; label: string }> = {
  'EWS': { icon: '🌅', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', label: 'Extreme Wide' },
  'WS': { icon: '🏞️', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', label: 'Wide Shot' },
  'MS': { icon: '👥', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', label: 'Medium Shot' },
  'CU': { icon: '😊', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400', label: 'Close-Up' },
  'ECU': { icon: '👁️', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', label: 'Extreme Close-Up' },
  'OTS': { icon: '👤', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', label: 'Over-Shoulder' },
  'POV': { icon: '🎯', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400', label: 'Point of View' },
};

export function ShotListPanel({
  shotList,
  onGenerateVideos,
  onUpdateShot,
  onClose,
  onImportToTimeline,
  isGenerating = false
}: ShotListPanelProps) {
  const [expandedShots, setExpandedShots] = useState<Set<number>>(new Set([0])); // First shot expanded by default
  const [editingShot, setEditingShot] = useState<string | null>(null);

  if (!shotList) {
    return (
      <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <CardContent className="py-16">
          <div className="text-center space-y-4">
            <Clapperboard className="w-16 h-16 mx-auto text-slate-400" />
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-base-content mb-2">
                No Shot List Yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Generate a professional shot list from your screenplay
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const toggleExpanded = (shotNumber: number) => {
    const newExpanded = new Set(expandedShots);
    if (newExpanded.has(shotNumber)) {
      newExpanded.delete(shotNumber);
    } else {
      newExpanded.add(shotNumber);
    }
    setExpandedShots(newExpanded);
  };

  const handleGenerateAll = () => {
    if (onGenerateVideos) {
      onGenerateVideos(shotList.shots);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
      {/* Clapboard Header */}
      <div className="relative bg-white dark:bg-slate-900 border-b-2 border-slate-200 dark:border-slate-700">
        {/* Striped Top */}
        <div className="h-10 flex">
          <div className="flex-1 bg-slate-900 dark:bg-white"></div>
          <div className="flex-1 bg-white dark:bg-slate-900"></div>
          <div className="flex-1 bg-slate-900 dark:bg-white"></div>
          <div className="flex-1 bg-white dark:bg-slate-900"></div>
          <div className="flex-1 bg-slate-900 dark:bg-white"></div>
          <div className="flex-1 bg-white dark:bg-slate-900"></div>
        </div>

        {/* Header Content */}
        <div className="p-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-yellow-400 rounded-lg">
                  <Film className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-base-content">
                    Shot List
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {shotList.sceneName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Shots</div>
                  <div className="font-bold text-slate-900 dark:text-base-content text-lg">{shotList.totalShots}</div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Duration</div>
                  <div className="font-bold text-slate-900 dark:text-base-content text-lg">{formatTime(shotList.totalDuration)}</div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Est. Cost</div>
                  <div className="font-bold text-slate-900 dark:text-base-content text-lg">{shotList.estimatedCost} cr</div>
                </div>
              </div>
            </div>

            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="ml-4"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Shots List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {shotList.shots.map((shot, index) => (
          <ShotCard
            key={shot.id}
            shot={shot}
            isExpanded={expandedShots.has(shot.shotNumber)}
            isEditing={editingShot === shot.id}
            onToggleExpand={() => toggleExpanded(shot.shotNumber)}
            onEdit={() => setEditingShot(shot.id)}
            onSave={(updates) => {
              if (onUpdateShot) {
                onUpdateShot(shot.id, updates);
              }
              setEditingShot(null);
            }}
            onCancel={() => setEditingShot(null)}
          />
        ))}
      </div>

      {/* Action Footer */}
      <div className="p-6 border-t-2 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-yellow-400 to-yellow-500 space-y-3">
        {/* Import to Timeline Button */}
        {onImportToTimeline && (
          <Button
            size="lg"
            onClick={() => onImportToTimeline(shotList.shots)}
            className="w-full h-14 text-lg font-bold bg-white text-black hover:bg-slate-100 border-2 border-black transition-all"
          >
            <Film className="w-5 h-5 mr-3" />
            📽️ Import to Timeline Editor
          </Button>
        )}

        {/* Generate Videos Button */}
        {onGenerateVideos && (
          <Button
            size="lg"
            onClick={handleGenerateAll}
            disabled={isGenerating}
            className="w-full h-16 text-xl font-bold bg-black text-yellow-400 hover:bg-slate-900 border-2 border-yellow-400 transition-all"
          >
            {isGenerating ? (
              <>
                <Clock className="w-6 h-6 mr-3 animate-spin" />
                Generating Videos...
              </>
            ) : (
              <>
                <Play className="w-6 h-6 mr-3" />
                🎬 Generate All {shotList.totalShots} Videos
              </>
            )}
          </Button>
        )}
        
        <p className="text-center text-sm text-black font-medium">
          Est. {Math.ceil(shotList.totalDuration * 1.5)} min wait · {shotList.estimatedCost} credits
        </p>
      </div>
    </div>
  );
}

// Individual Shot Card Component
interface ShotCardProps {
  shot: Shot;
  isExpanded: boolean;
  isEditing: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onSave: (updates: Partial<Shot>) => void;
  onCancel: () => void;
}

function ShotCard({
  shot,
  isExpanded,
  isEditing,
  onToggleExpand,
  onEdit,
  onSave,
  onCancel
}: ShotCardProps) {
  const [editedDescription, setEditedDescription] = useState(shot.description);
  const [editedPrompt, setEditedPrompt] = useState(shot.visualPrompt || '');

  const shotTypeInfo = SHOT_TYPE_INFO[shot.shotType] || {
    icon: '🎬',
    color: 'bg-slate-100 text-slate-800',
    label: shot.shotType
  };

  const handleSave = () => {
    onSave({
      description: editedDescription,
      visualPrompt: editedPrompt
    });
  };

  return (
    <Card className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-yellow-400 transition-all overflow-hidden">
      {/* Card Header - Always Visible */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-4 flex-1">
          {/* Shot Number Badge */}
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-black text-lg border-2 border-yellow-600">
            {shot.shotNumber}
          </div>

          {/* Shot Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={shotTypeInfo.color}>
                {shotTypeInfo.icon} {shotTypeInfo.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Camera className="w-3 h-3 mr-1" />
                {shot.cameraMovement}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {shot.duration}s
              </Badge>
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-base-content truncate">
              {shot.subject}
            </p>
            {!isExpanded && (
              <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-1">
                {shot.description}
              </p>
            )}
          </div>
        </div>

        {/* Expand Icon */}
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-4 bg-slate-50 dark:bg-slate-900/30">
          {/* Description */}
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 block flex items-center gap-2">
              <Film className="w-4 h-4" />
              Shot Description
            </label>
            {isEditing ? (
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="min-h-[80px]"
              />
            ) : (
              <p className="text-sm text-slate-900 dark:text-base-content bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                {shot.description}
              </p>
            )}
          </div>

          {/* Visual Prompt */}
          {shot.visualPrompt && (
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 block flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Video Prompt
              </label>
              {isEditing ? (
                <Textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  className="min-h-[100px] font-mono text-xs"
                />
              ) : (
                <p className="text-xs text-slate-700 dark:text-slate-300 bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800 font-mono leading-relaxed">
                  {shot.visualPrompt}
                </p>
              )}
            </div>
          )}

          {/* Technical Details */}
          <div className="grid grid-cols-2 gap-3">
            {shot.suggestedLens && (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400">Lens</div>
                <div className="text-sm font-medium text-slate-900 dark:text-base-content">{shot.suggestedLens}</div>
              </div>
            )}
            {shot.lightingMood && (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400">Lighting</div>
                <div className="text-sm font-medium text-slate-900 dark:text-base-content">{shot.lightingMood}</div>
              </div>
            )}
            {shot.colorPalette && (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 col-span-2">
                <div className="text-xs text-slate-500 dark:text-slate-400">Color Palette</div>
                <div className="text-sm font-medium text-slate-900 dark:text-base-content">{shot.colorPalette}</div>
              </div>
            )}
          </div>

          {/* Composition Notes */}
          {shot.compositionNotes && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border-2 border-yellow-300 dark:border-yellow-700">
              <div className="text-xs font-medium text-yellow-900 dark:text-yellow-100 mb-1 flex items-center gap-1">
                💡 Composition Notes
              </div>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {shot.compositionNotes}
              </p>
            </div>
          )}

          {/* Edit Actions */}
          <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="flex-1 bg-yellow-400 text-black hover:bg-[#DC143C]"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="flex-1"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Shot
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

