'use client';

/**
 * Story Beats Panel - Production Page Left Panel
 * 
 * Shows story beats organized hierarchically with production status:
 * - Not started (gray)
 * - Planning (yellow)
 * - Generating (blue)
 * - Ready (green)
 * - In Timeline (purple)
 * 
 * Now with Contextual Navigation:
 * - Auto-selects beat from editor context
 * - Can navigate to BeatBoard for reorganization
 * - Updates context when beat is selected
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { StoryBeat } from '@/types/screenplay';
import { ChevronRight, ChevronDown, Film, CheckCircle2, Loader2, PlayCircle, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useContextStore } from '@/lib/contextStore';

interface StoryBeatsPanelProps {
  beats: StoryBeat[];
  selectedBeatId: string | null;
  onBeatSelect: (beatId: string) => void;
}

export function StoryBeatsPanel({ beats, selectedBeatId, onBeatSelect }: StoryBeatsPanelProps) {
  const router = useRouter();
  const [expandedBeats, setExpandedBeats] = useState<Set<string>>(new Set());
  
  // Contextual Navigation Integration
  const context = useContextStore((state) => state.context);
  const setCurrentBeat = useContextStore((state) => state.setCurrentBeat);
  
  // Auto-select beat from context on mount
  useEffect(() => {
    if (context.currentBeatId && !selectedBeatId) {
      const beat = beats.find(b => b.id === context.currentBeatId);
      if (beat) {
        onBeatSelect(beat.id);
        // Auto-expand the beat
        setExpandedBeats(prev => new Set(prev).add(beat.id));
      }
    }
  }, [context.currentBeatId, selectedBeatId, beats, onBeatSelect]);
  
  function toggleBeat(beatId: string) {
    setExpandedBeats(prev => {
      const next = new Set(prev);
      if (next.has(beatId)) {
        next.delete(beatId);
      } else {
        next.add(beatId);
      }
      return next;
    });
  }
  
  function handleBeatSelect(beat: StoryBeat) {
    onBeatSelect(beat.id);
    // Update global context
    setCurrentBeat(beat.id, beat.title);
  }
  
  function navigateToBeatBoard() {
    const projectId = context.projectId || 'default';
    router.push(`/beats?projectId=${projectId}`);
  }

  function getStatusColor(status: string | undefined): string {
    switch (status) {
      case 'not-started':
        return 'text-slate-400 dark:text-slate-500';
      case 'planning':
        return 'text-yellow-500';
      case 'generating':
        return 'text-blue-500 animate-pulse';
      case 'ready':
        return 'text-green-500';
      case 'in-timeline':
        return 'text-purple-500';
      default:
        return 'text-slate-400';
    }
  }

  function getStatusIcon(status: string | undefined) {
    switch (status) {
      case 'not-started':
        return <Film className="w-4 h-4" />;
      case 'planning':
        return <Film className="w-4 h-4" />;
      case 'generating':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'ready':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'in-timeline':
        return <PlayCircle className="w-4 h-4" />;
      default:
        return <Film className="w-4 h-4" />;
    }
  }

  function getStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'not-started':
        return 'Not Started';
      case 'planning':
        return 'Planning';
      case 'generating':
        return 'Generating...';
      case 'ready':
        return 'Ready';
      case 'in-timeline':
        return 'In Timeline';
      default:
        return 'Not Started';
    }
  }

  if (beats.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <Film className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
          No Story Beats
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-500">
          Create story beats in the Write tab to get started
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Story Beats
          </h2>
          <button
            onClick={navigateToBeatBoard}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors group"
            title="Open Beat Board (Drag & Drop)"
          >
            <LayoutGrid className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-[#DC143C]" />
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select a beat to begin production
        </p>
      </div>

      {/* Beats List */}
      <div className="flex-1 overflow-y-auto p-2">
        {beats.map((beat, beatIndex) => {
          const isExpanded = expandedBeats.has(beat.id);
          const isSelected = beat.id === selectedBeatId;
          const status = beat.production?.status || 'not-started';
          const clipCount = beat.production?.clipCount || 0;
          const creditsUsed = beat.production?.creditsUsed || 0;

          return (
            <div key={beat.id} className="mb-2">
              {/* Beat Header */}
              <button
                onClick={() => handleBeatSelect(beat)}
                className={cn(
                  'w-full flex items-start gap-2 p-3 rounded-lg transition-all',
                  'hover:bg-slate-100 dark:hover:bg-slate-700/50',
                  isSelected && 'bg-[#DC143C]/10 ring-2 ring-[#DC143C]/20'
                )}
              >
                {/* Status Icon */}
                <div className={cn('mt-0.5', getStatusColor(status))}>
                  {getStatusIcon(status)}
                </div>

                {/* Beat Content */}
                <div className="flex-1 text-left min-w-0">
                  {/* Title */}
                  <div className="flex items-center gap-2">
                    <h3 className={cn(
                      'font-semibold text-sm truncate',
                      isSelected 
                        ? 'text-[#DC143C]' 
                        : 'text-slate-700 dark:text-slate-300'
                    )}>
                      {beat.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {beat.description}
                  </p>

                  {/* Status & Metadata */}
                  <div className="flex items-center gap-3 mt-2">
                    <span className={cn('text-xs font-medium', getStatusColor(status))}>
                      {getStatusLabel(status)}
                    </span>

                    {clipCount > 0 && (
                      <>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {clipCount} {clipCount === 1 ? 'clip' : 'clips'}
                        </span>
                      </>
                    )}

                    {creditsUsed > 0 && (
                      <>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {creditsUsed} credits
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Expand/Collapse for Scenes */}
                {beat.scenes.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBeat(beat.id);
                    }}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                )}
              </button>

              {/* Expanded Scenes */}
              {isExpanded && beat.scenes.length > 0 && (
                <div className="ml-4 mt-1 pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-1">
                  {beat.scenes.map((scene) => (
                    <div
                      key={scene.id}
                      className="text-xs p-2 rounded bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Scene {scene.number}: {scene.heading}
                      </div>
                      {scene.synopsis && (
                        <div className="text-slate-500 dark:text-slate-400 line-clamp-2">
                          {scene.synopsis}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Stats */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400">
            {beats.length} {beats.length === 1 ? 'beat' : 'beats'}
          </span>
          <span className="text-slate-600 dark:text-slate-400">
            {beats.reduce((sum, b) => sum + (b.production?.clipCount || 0), 0)} clips generated
          </span>
        </div>
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-[#DC143C] font-medium">
            {beats.filter(b => b.production?.status === 'ready').length} ready for timeline
          </span>
        </div>
      </div>
    </div>
  );
}

