'use client';

/**
 * Beat Timeline Navigator - Production Page Top Component
 * 
 * Horizontal scrolling timeline showing all story beats.
 * User clicks a beat → triggers Scene Analyzer & AI suggestions below.
 * 
 * Features:
 * - Horizontal scrolling beat selector
 * - Visual progress indicators (clips generated/pending)
 * - Status badges (not started, in progress, completed, failed)
 * - Auto-scroll to selected beat
 * - Click to jump between beats
 * - Contextual navigation integration
 * 
 * Original Spec: docs/features/STORY_BEAT_PRODUCTION_ALREADY_BUILT.md (Lines 74-83)
 */

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { StoryBeat } from '@/types/screenplay';
import { 
  CheckCircle2, 
  Loader2, 
  Circle, 
  AlertCircle,
  Film,
  PlayCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useContextStore } from '@/lib/contextStore';

interface BeatTimelineNavigatorProps {
  beats: StoryBeat[];
  selectedBeatId: string | null;
  onBeatSelect: (beatId: string) => void;
}

export function BeatTimelineNavigator({ 
  beats, 
  selectedBeatId, 
  onBeatSelect 
}: BeatTimelineNavigatorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const beatRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  
  // Contextual Navigation Integration
  const context = useContextStore((state) => state.context);
  const setCurrentBeat = useContextStore((state) => state.setCurrentBeat);
  
  // Auto-scroll to selected beat
  useEffect(() => {
    if (selectedBeatId && beatRefs.current[selectedBeatId]) {
      beatRefs.current[selectedBeatId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [selectedBeatId]);
  
  // Auto-select beat from editor context
  useEffect(() => {
    if (context.currentBeatId && !selectedBeatId) {
      const beat = beats.find(b => b.id === context.currentBeatId);
      if (beat) {
        onBeatSelect(beat.id);
      }
    }
  }, [context.currentBeatId, selectedBeatId, beats, onBeatSelect]);
  
  function handleBeatClick(beat: StoryBeat) {
    onBeatSelect(beat.id);
    // Update global context
    setCurrentBeat(beat.id, beat.title);
  }
  
  function getStatusIcon(status: string | undefined) {
    switch (status) {
      case 'completed':
      case 'ready':
      case 'in-timeline':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'generating':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'planning':
        return <Film className="w-4 h-4" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  }
  
  function getStatusColor(status: string | undefined): string {
    switch (status) {
      case 'completed':
      case 'ready':
        return 'text-green-500 bg-green-500/10 border-green-500/30';
      case 'in-timeline':
        return 'text-purple-500 bg-purple-500/10 border-purple-500/30';
      case 'generating':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
      case 'planning':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'failed':
        return 'text-red-500 bg-red-500/10 border-red-500/30';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  }
  
  function getProgressPercentage(beat: StoryBeat): number {
    const total = beat.production?.clipCount || 0;
    const completed = beat.production?.clipIds?.length || 0;
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }
  
  if (beats.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 bg-slate-900 border-b border-slate-700">
        <div className="text-center">
          <Film className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No story beats yet</p>
          <p className="text-xs text-slate-500">Create beats in the Write tab to begin</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative bg-slate-900 border-b border-slate-700">
      {/* Scroll Hint - Left */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
      
      {/* Scroll Container */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto py-4 px-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800"
        style={{ scrollbarWidth: 'thin' }}
      >
        {beats.map((beat, index) => {
          const isSelected = beat.id === selectedBeatId;
          const status = beat.production?.status || 'not-started';
          const clipCount = beat.production?.clipCount || 0;
          const completedClips = beat.production?.clipIds?.length || 0;
          const creditsUsed = beat.production?.creditsUsed || 0;
          const progress = getProgressPercentage(beat);
          
          return (
            <motion.button
              key={beat.id}
              ref={(el) => { beatRefs.current[beat.id] = el; }}
              onClick={() => handleBeatClick(beat)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'flex-shrink-0 w-48 p-3 rounded-lg border-2 transition-all',
                'hover:shadow-lg hover:scale-105',
                isSelected 
                  ? 'bg-[#DC143C]/20 border-[#DC143C] shadow-lg shadow-[#DC143C]/20' 
                  : 'bg-slate-800 border-slate-700 hover:border-slate-600'
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                {/* Beat Number */}
                <div className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                  isSelected 
                    ? 'bg-[#DC143C] text-white' 
                    : 'bg-slate-700 text-slate-300'
                )}>
                  {index + 1}
                </div>
                
                {/* Status Icon */}
                <div className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full border',
                  getStatusColor(status)
                )}>
                  {getStatusIcon(status)}
                </div>
              </div>
              
              {/* Title */}
              <h3 className={cn(
                'text-sm font-semibold mb-1 line-clamp-2 text-left',
                isSelected ? 'text-white' : 'text-slate-200'
              )}>
                {beat.title}
              </h3>
              
              {/* Description */}
              <p className="text-xs text-slate-400 line-clamp-2 text-left mb-2">
                {beat.description}
              </p>
              
              {/* Progress Bar */}
              {clipCount > 0 && (
                <div className="mb-2">
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div 
                      className={cn(
                        'h-full rounded-full',
                        status === 'completed' || status === 'ready' 
                          ? 'bg-green-500' 
                          : status === 'generating'
                          ? 'bg-blue-500'
                          : 'bg-yellow-500'
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}
              
              {/* Metadata */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {completedClips}/{clipCount} clips
                </span>
                {creditsUsed > 0 && (
                  <span className="text-slate-500">
                    {creditsUsed}cr
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
      
      {/* Scroll Hint - Right */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />
      
      {/* Context Indicator */}
      {context.currentBeatName && !selectedBeatId && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs text-blue-300 z-20">
          From editor: {context.currentBeatName}
        </div>
      )}
    </div>
  );
}

