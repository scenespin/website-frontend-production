'use client';

/**
 * Playground Panel - Main Component
 * 
 * Unified experimentation and generation interface following film production workflow.
 * - Pre-Production: Image generation + workflows
 * - Post-Production: Audio generation + Annotation-to-Video + workflows
 * 
 * Based on: docs/features/PLAYGROUND_COMPREHENSIVE_PLAN.md
 */

import React, { useState } from 'react';
import { Palette, Scissors, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScreenplay } from '@/contexts/ScreenplayContext';

// Sub-components (to be created)
import { PreProductionPanel } from './playground/PreProductionPanel';
import { PostProductionPanel } from './playground/PostProductionPanel';

interface PlaygroundPanelProps {
  className?: string;
}

type PlaygroundTab = 'pre-production' | 'post-production';

export function PlaygroundPanel({ className = '' }: PlaygroundPanelProps) {
  const screenplay = useScreenplay();
  const screenplayId = screenplay.screenplayId;
  const [activeTab, setActiveTab] = useState<PlaygroundTab>('pre-production');

  return (
    <div className={cn("h-full flex flex-col bg-[#0A0A0A]", className)}>
      {/* Tab Navigation */}
      <div className="flex-shrink-0 border-b border-[#3F3F46] bg-[#141414]">
        <div className="flex gap-1 px-4">
          <button
            onClick={() => setActiveTab('pre-production')}
            className={cn(
              "relative flex items-center gap-2 px-4 py-3 font-medium text-sm",
              "transition-colors duration-200",
              "border-b-2 -mb-[2px]",
              activeTab === 'pre-production'
                ? cn(
                    "border-cinema-red",
                    "text-white"
                  )
                : cn(
                    "border-transparent",
                    "text-[#808080]",
                    "hover:text-white"
                  )
            )}
          >
            <Palette className="w-4 h-4" />
            <span>Pre-Production</span>
          </button>

          <button
            onClick={() => setActiveTab('post-production')}
            className={cn(
              "relative flex items-center gap-2 px-4 py-3 font-medium text-sm",
              "transition-colors duration-200",
              "border-b-2 -mb-[2px]",
              activeTab === 'post-production'
                ? cn(
                    "border-cinema-red",
                    "text-white"
                  )
                : cn(
                    "border-transparent",
                    "text-[#808080]",
                    "hover:text-white"
                  )
            )}
          >
            <Scissors className="w-4 h-4" />
            <span>Post-Production</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'pre-production' && (
          <PreProductionPanel className="h-full" screenplayId={screenplayId} />
        )}

        {activeTab === 'post-production' && (
          <PostProductionPanel className="h-full" screenplayId={screenplayId} />
        )}
      </div>
    </div>
  );
}


