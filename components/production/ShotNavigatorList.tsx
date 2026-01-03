'use client';

/**
 * ShotNavigatorList - Shot list navigator for Shot Configuration steps
 * 
 * Shows all shots in a scrollable list, allowing users to navigate between shots.
 * Similar layout and style to SceneNavigatorList for UI consistency.
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Film } from 'lucide-react';
import type { SceneAnalysisResult } from '@/types/screenplay';

interface ShotNavigatorListProps {
  shots: any[];
  currentShotSlot: number;
  onShotSelect: (shotSlot: number) => void;
  className?: string;
  isMobile?: boolean;
  completedShots?: Set<number>; // Shots that are completely filled out
  enabledShots?: number[]; // All enabled shots (for determining "next" shot)
  // Feature 0182: Continuation (REMOVED - deferred to post-launch)
}

export function ShotNavigatorList({
  shots,
  currentShotSlot,
  onShotSelect,
  className = '',
  isMobile = false,
  completedShots = new Set(),
  enabledShots = []
}: ShotNavigatorListProps) {
  if (!shots || shots.length === 0) {
    return (
      <div className={cn("w-full rounded-lg border border-[#3F3F46] bg-[#0A0A0A] p-4", className)}>
        <p className="text-sm font-medium text-[#808080] mb-2">
          No shots available
        </p>
      </div>
    );
  }

  // Sort shots by slot number
  const sortedShots = [...shots].sort((a, b) => (a.slot || 0) - (b.slot || 0));
  
  // Find current shot index to determine "next" shot
  const currentIndex = sortedShots.findIndex(s => s.slot === currentShotSlot);
  const nextShotSlot = currentIndex >= 0 && currentIndex < sortedShots.length - 1 
    ? sortedShots[currentIndex + 1].slot 
    : null;
  
  // Check if current shot is complete
  const isCurrentShotComplete = completedShots.has(currentShotSlot);
  
  // Determine if a shot is navigable
  const isNavigable = (shotSlot: number): boolean => {
    // Always allow current shot
    if (shotSlot === currentShotSlot) return true;
    
    // Get shot index for comparison
    const shotIndex = sortedShots.findIndex(s => s.slot === shotSlot);
    if (shotIndex === -1) return false;
    
    // Allow previous shots if they're completed
    if (shotIndex < currentIndex) {
      return completedShots.has(shotSlot);
    }
    
    // Allow next shot ONLY if current shot is complete
    if (shotSlot === nextShotSlot) {
      return isCurrentShotComplete;
    }
    
    // Don't allow shots beyond next until reached sequentially
    return false;
  };

  return (
    <div className={cn(
      "w-full overflow-auto rounded-lg border border-[#3F3F46] bg-[#0A0A0A] p-2",
      isMobile ? "max-h-64" : "max-h-96",
      className
    )}>
      <div className="flex flex-col gap-1">
        {sortedShots.map((shot) => {
          const isSelected = shot.slot === currentShotSlot;
          const shotType = shot.type === 'dialogue' ? 'Dialogue' : 'Action';
          const credits = shot.credits || 0;
          const isComplete = completedShots.has(shot.slot);
          const isNavigableShot = isNavigable(shot.slot);
          const isNextShot = shot.slot === nextShotSlot;

          return (
            <button
              key={shot.slot}
              onClick={() => {
                if (isNavigableShot) {
                  onShotSelect(shot.slot);
                }
              }}
              disabled={!isNavigableShot}
              className={cn(
                "flex w-full flex-col items-start rounded-md transition-all p-2 gap-1 text-left",
                isSelected
                  ? "bg-[#1A1A1A] text-[#FFFFFF] border-l-2 border-[#DC143C]"
                  : isNavigableShot
                  ? "text-[#808080] hover:bg-[#141414] border-l-2 border-transparent hover:text-[#FFFFFF] cursor-pointer"
                  : "text-[#3F3F46] border-l-2 border-transparent cursor-not-allowed opacity-50"
              )}
              title={!isNavigableShot && !isNextShot ? "Complete previous shots first" : undefined}
            >
              {/* Shot Number & Type */}
              <div className="flex items-center w-full gap-2">
                <span className={cn(
                  "font-bold tabular-nums text-xs min-w-[20px]",
                  isSelected ? "text-[#DC143C]" : "text-[#808080]"
                )}>
                  {shot.slot}
                </span>
                <span className={cn(
                  "font-medium truncate flex-1 text-xs",
                  isSelected ? "text-[#FFFFFF]" : "text-[#808080]"
                )}>
                  Shot {shot.slot}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] px-1.5 py-0 h-4 border-[#3F3F46] gap-1",
                    shot.type === 'dialogue'
                      ? "border-blue-500 text-blue-400"
                      : "border-green-500 text-green-400"
                  )}
                >
                  {shotType}
                </Badge>
              </div>

              {/* Shot Description - Full text, no truncation */}
              {shot.description && (
                <p className="w-full text-left text-[10px] leading-relaxed text-[#808080] break-words whitespace-pre-wrap">
                  {shot.description}
                </p>
              )}
              
              {/* Dialogue Preview - Full text, no truncation */}
              {shot.dialogueBlock?.dialogue && !shot.description && (
                <p className="w-full text-left text-[10px] leading-relaxed text-[#808080] italic break-words whitespace-pre-wrap">
                  "{shot.dialogueBlock.dialogue}"
                </p>
              )}

              {/* Credits Badge */}
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-[#3F3F46] text-[#808080]">
                  {credits} credits
                </Badge>
                {isComplete && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-green-500 text-green-400">
                    ✓ Complete
                  </Badge>
                )}
                {isNextShot && !isComplete && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-blue-500 text-blue-400">
                    Next
                  </Badge>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

