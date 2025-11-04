/**
 * Mobile Timeline Bottom Toolbar
 * 
 * Context-aware toolbar that changes based on clip selection
 * - No selection: Add Media, Text, Audio, More
 * - 1 clip: Split, Effects, Speed, More
 * - 2+ clips: Copy, Delete, Ripple, More
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useHaptic } from '@/lib/haptics';
import {
  Plus,
  Type,
  Music,
  Settings,
  Scissors,
  Wand2,
  Gauge,
  Copy,
  Trash2,
  Link,
  Upload
} from 'lucide-react';

interface MobileTimelineToolbarProps {
  selectedCount: number;
  onAddMedia: () => void;
  onAddText: () => void;
  onAddAudio: () => void;
  onSplitClip: () => void;
  onOpenEffects: () => void;
  onOpenSpeed: () => void;
  onCopyClips: () => void;
  onDeleteClips: () => void;
  onToggleRipple: () => void;
  onOpenMore: () => void;
  rippleMode: boolean;
  canSplit: boolean; // True if exactly 1 clip selected
}

export function MobileTimelineToolbar({
  selectedCount,
  onAddMedia,
  onAddText,
  onAddAudio,
  onSplitClip,
  onOpenEffects,
  onOpenSpeed,
  onCopyClips,
  onDeleteClips,
  onToggleRipple,
  onOpenMore,
  rippleMode,
  canSplit
}: MobileTimelineToolbarProps) {
  const haptic = useHaptic();
  
  // Add haptic feedback to all button handlers
  const withHaptic = (callback: () => void) => () => {
    haptic.light();
    callback();
  };
  
  // No clips selected: Show creation tools
  if (selectedCount === 0) {
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-50 safe-area-inset-bottom">
        <div className="grid grid-cols-4 gap-1 p-2">
          <Button
            onClick={withHaptic(onAddMedia)}
            variant="ghost"
            className="h-16 flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white hover:bg-slate-800 touch-manipulation"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs font-medium">Media</span>
          </Button>

          <Button
            onClick={withHaptic(onAddText)}
            variant="ghost"
            className="h-16 flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white hover:bg-slate-800 touch-manipulation"
          >
            <Type className="w-5 h-5" />
            <span className="text-xs font-medium">Text</span>
          </Button>

          <Button
            onClick={withHaptic(onAddAudio)}
            variant="ghost"
            className="h-16 flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white hover:bg-slate-800 touch-manipulation"
          >
            <Music className="w-5 h-5" />
            <span className="text-xs font-medium">Audio</span>
          </Button>

          <Button
            onClick={withHaptic(onOpenMore)}
            variant="ghost"
            className="h-16 flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white hover:bg-slate-800 touch-manipulation"
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs font-medium">More</span>
          </Button>
        </div>
      </div>
    );
  }

  // Single clip selected: Show editing tools
  if (selectedCount === 1) {
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-50 safe-area-inset-bottom">
        <div className="grid grid-cols-4 gap-1 p-2">
          <Button
            onClick={withHaptic(onSplitClip)}
            variant="ghost"
            disabled={!canSplit}
            className="h-16 flex flex-col items-center justify-center gap-1 text-[#DC143C] hover:text-white hover:bg-[#DC143C]/20 touch-manipulation disabled:opacity-50"
          >
            <Scissors className="w-5 h-5" />
            <span className="text-xs font-medium">Split</span>
          </Button>

          <Button
            onClick={withHaptic(onOpenEffects)}
            variant="ghost"
            className="h-16 flex flex-col items-center justify-center gap-1 text-purple-400 hover:text-white hover:bg-purple-900/20 touch-manipulation"
          >
            <Wand2 className="w-5 h-5" />
            <span className="text-xs font-medium">Effects</span>
          </Button>

          <Button
            onClick={withHaptic(onOpenSpeed)}
            variant="ghost"
            className="h-16 flex flex-col items-center justify-center gap-1 text-orange-400 hover:text-white hover:bg-orange-900/20 touch-manipulation"
          >
            <Gauge className="w-5 h-5" />
            <span className="text-xs font-medium">Speed</span>
          </Button>

          <Button
            onClick={withHaptic(onOpenMore)}
            variant="ghost"
            className="h-16 flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white hover:bg-slate-800 touch-manipulation"
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs font-medium">More</span>
          </Button>
        </div>
      </div>
    );
  }

  // Multiple clips selected: Show multi-clip tools
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-50 safe-area-inset-bottom">
      <div className="grid grid-cols-4 gap-1 p-2">
        <Button
          onClick={withHaptic(onCopyClips)}
          variant="ghost"
          className="h-16 flex flex-col items-center justify-center gap-1 text-blue-400 hover:text-white hover:bg-blue-900/20 touch-manipulation"
        >
          <Copy className="w-5 h-5" />
          <span className="text-xs font-medium">Copy</span>
        </Button>

        <Button
          onClick={withHaptic(onDeleteClips)}
          variant="ghost"
          className="h-16 flex flex-col items-center justify-center gap-1 text-red-400 hover:text-white hover:bg-red-900/20 touch-manipulation"
        >
          <Trash2 className="w-5 h-5" />
          <span className="text-xs font-medium">Delete</span>
        </Button>

        <Button
          onClick={withHaptic(onToggleRipple)}
          variant="ghost"
          className={`h-16 flex flex-col items-center justify-center gap-1 touch-manipulation ${
            rippleMode
              ? 'text-[#DC143C] bg-[#DC143C]/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Link className="w-5 h-5" />
          <span className="text-xs font-medium">Ripple</span>
        </Button>

        <Button
          onClick={withHaptic(onOpenMore)}
          variant="ghost"
          className="h-16 flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white hover:bg-slate-800 touch-manipulation"
        >
          <Settings className="w-5 h-5" />
          <span className="text-xs font-medium">More</span>
        </Button>
      </div>
    </div>
  );
}

