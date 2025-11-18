'use client';

/**
 * QuickActions Component
 * 
 * Three main action buttons for Production Hub navigation.
 * Part of Production Hub Phase 1 redesign.
 */

import React from 'react';
import { MessageSquare, Video, FolderOpen, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickActionsProps {
  onOneOffClick?: () => void;
  onScreenplayClick?: () => void;
  onHybridClick?: () => void;
  className?: string;
  isMobile?: boolean;
}

export function QuickActions({
  onOneOffClick,
  onScreenplayClick,
  onHybridClick,
  className = '',
  isMobile = false
}: QuickActionsProps) {
  return (
    <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-4 ${className}`}>
      {/* One-Off Creation */}
      <button
        onClick={onOneOffClick}
        className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 hover:bg-white/20 transition-all text-left"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-600/20 rounded-lg group-hover:bg-purple-600/30 transition-colors">
            <MessageSquare className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold mb-1 group-hover:text-purple-200 transition-colors">
              One-Off Creation
            </h3>
            <p className="text-sm text-purple-200/80 mb-2">
              Quick scenes with AI guidance
            </p>
            <div className="flex items-center gap-1 text-xs text-purple-300 group-hover:text-purple-200 transition-colors">
              <span>Start Chat</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </button>

      {/* From Screenplay */}
      <button
        onClick={onScreenplayClick}
        className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 hover:bg-white/20 transition-all text-left"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-600/20 rounded-lg group-hover:bg-blue-600/30 transition-colors">
            <Video className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold mb-1 group-hover:text-blue-200 transition-colors">
              From Screenplay
            </h3>
            <p className="text-sm text-blue-200/80 mb-2">
              Generate scenes from your script
            </p>
            <div className="flex items-center gap-1 text-xs text-blue-300 group-hover:text-blue-200 transition-colors">
              <span>Open Scene Builder</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </button>

      {/* Hybrid Workflow */}
      <button
        onClick={onHybridClick}
        className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 hover:bg-white/20 transition-all text-left"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-600/20 rounded-lg group-hover:bg-green-600/30 transition-colors">
            <FolderOpen className="w-6 h-6 text-green-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold mb-1 group-hover:text-green-200 transition-colors">
              Hybrid Workflow
            </h3>
            <p className="text-sm text-green-200/80 mb-2">
              Mix your footage with AI
            </p>
            <div className="flex items-center gap-1 text-xs text-green-300 group-hover:text-green-200 transition-colors">
              <span>Open Media Library</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

