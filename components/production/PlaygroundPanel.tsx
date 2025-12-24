'use client';

/**
 * Playground Panel - Main Component
 * 
 * Unified experimentation and generation interface.
 * Structure:
 * - Image Generation (Character, Location, Asset, First Frame)
 * - Video Generation (Starting Frame, Frame to Frame, Basic workflows)
 * - Pre-Production Workflows
 * - Post-Production Workflows
 * 
 * Based on: docs/features/PLAYGROUND_COMPREHENSIVE_PLAN.md
 */

import React, { useState } from 'react';
import { Palette, Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScreenplay } from '@/contexts/ScreenplayContext';

// Sub-components
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
      {/* Tab Navigation - Match ProductionTabBar styling */}
      <div className="flex-shrink-0 border-b border-white/10 bg-[#0A0A0A] w-full">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('pre-production')}
            className={cn(
              "relative flex items-center gap-2 px-4 py-3 font-medium text-sm",
              "transition-colors duration-200",
              "border-b-2 -mb-[2px]",
              "whitespace-nowrap",
              activeTab === 'pre-production'
                ? cn(
                    "border-cinema-red",
                    "bg-base-100",
                    "text-base-content"
                  )
                : cn(
                    "border-transparent",
                    "text-base-content/60",
                    "hover:text-base-content",
                    "hover:bg-base-100/50"
                  )
            )}
            aria-current={activeTab === 'pre-production' ? 'page' : undefined}
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
              "whitespace-nowrap",
              activeTab === 'post-production'
                ? cn(
                    "border-cinema-red",
                    "bg-base-100",
                    "text-base-content"
                  )
                : cn(
                    "border-transparent",
                    "text-base-content/60",
                    "hover:text-base-content",
                    "hover:bg-base-100/50"
                  )
            )}
            aria-current={activeTab === 'post-production' ? 'page' : undefined}
          >
            <Scissors className="w-4 h-4" />
            <span>Post-Production</span>
          </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 h-full">
        {activeTab === 'pre-production' && (
          <PreProductionPanel className="h-full" screenplayId={screenplayId} />
        )}

        {activeTab === 'post-production' && (
          <PostProductionPanel className="h-full" screenplayId={screenplayId} />
        )}
        </div>
      </div>
    </div>
  );
}


