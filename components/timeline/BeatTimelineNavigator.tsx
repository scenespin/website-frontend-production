/**
 * Beat Timeline Navigator
 * 
 * Horizontal scrolling timeline showing all story beats with:
 * - Visual thumbnails
 * - Progress indicators
 * - Quick navigation
 * - Status badges
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Circle, 
  Loader2,
  AlertCircle,
  Video,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface StoryBeat {
  id: string;
  title: string;
  description?: string;
  synopsis?: string;
  duration?: number;
  status?: 'not_started' | 'in_progress' | 'completed' | 'failed';
  clipCount?: number;
  thumbnailUrl?: string;
}

interface BeatTimelineNavigatorProps {
  beats: StoryBeat[];
  selectedBeatId: string | null;
  onBeatSelect: (beatId: string) => void;
  className?: string;
}

export function BeatTimelineNavigator({
  beats,
  selectedBeatId,
  onBeatSelect,
  className
}: BeatTimelineNavigatorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected beat
  useEffect(() => {
    if (selectedRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const selected = selectedRef.current;
      const containerRect = container.getBoundingClientRect();
      const selectedRect = selected.getBoundingClientRect();

      // Check if selected is outside visible area
      if (selectedRect.left < containerRect.left || selectedRect.right > containerRect.right) {
        selected.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedBeatId]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Circle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/20 border-green-500';
      case 'in_progress':
        return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-500';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/20 border-red-500';
      default:
        return 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700';
    }
  };

  // Calculate overall progress
  const completedCount = beats.filter(b => b.status === 'completed').length;
  const progressPercent = beats.length > 0 ? (completedCount / beats.length) * 100 : 0;

  return (
    <div className={cn("relative bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm", className)}>
      {/* Header */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Video className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Story Beat Timeline</h3>
              <p className="text-xs text-slate-500">Select a beat to start production</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{completedCount}</span>
              <span className="text-slate-500 dark:text-slate-400"> / {beats.length} completed</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Scroll Left Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-slate-900 shadow-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Scroll Right Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-slate-900 shadow-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>

        {/* Scrollable Beat Cards */}
        <ScrollArea className="w-full" ref={scrollRef}>
          <div className="flex gap-3 p-6 min-w-min">
            {beats.map((beat, index) => {
              const isSelected = beat.id === selectedBeatId;
              const isFirst = index === 0;
              const isLast = index === beats.length - 1;

              return (
                <motion.div
                  key={beat.id}
                  ref={isSelected ? selectedRef : null}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative flex-shrink-0"
                >
                  {/* Connecting Line */}
                  {!isLast && (
                    <div className={cn(
                      "absolute top-1/2 left-full w-3 h-0.5 -translate-y-1/2",
                      beat.status === 'completed' ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'
                    )} />
                  )}

                  {/* Beat Card */}
                  <button
                    onClick={() => onBeatSelect(beat.id)}
                    className={cn(
                      "relative w-48 h-32 rounded-xl border-2 transition-all overflow-hidden group",
                      isSelected 
                        ? "border-indigo-500 shadow-lg shadow-indigo-500/30 scale-105" 
                        : getStatusColor(beat.status),
                      "hover:scale-105 hover:shadow-xl"
                    )}
                  >
                    {/* Thumbnail Background */}
                    <div className="absolute inset-0">
                      {beat.thumbnailUrl ? (
                        <img 
                          src={beat.thumbnailUrl} 
                          alt={beat.title}
                          className="w-full h-full object-cover opacity-30"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 opacity-50" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="relative h-full p-3 flex flex-col">
                      {/* Status Badge */}
                      <div className="absolute top-2 right-2">
                        {getStatusIcon(beat.status)}
                      </div>

                      {/* Beat Number */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn(
                          "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                          isSelected ? "bg-indigo-500 text-white" : "bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                        )}>
                          {index + 1}
                        </div>
                        {beat.clipCount !== undefined && beat.clipCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {beat.clipCount} clips
                          </Badge>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-2 mb-auto">
                        {beat.title}
                      </h4>

                      {/* Duration */}
                      {beat.duration && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{beat.duration}s</span>
                        </div>
                      )}
                    </div>

                    {/* Selected Indicator */}
                    {isSelected && (
                      <motion.div
                        layoutId="selectedBeat"
                        className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/10 transition-colors" />
                  </button>
                </motion.div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}

