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
import { Image, Video, Palette, Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScreenplay } from '@/contexts/ScreenplayContext';

// Sub-components
import { ImageGenerationTools } from './playground/ImageGenerationTools';
import { VideoGenerationTools } from './playground/VideoGenerationTools';
import { PreProductionWorkflows } from './playground/PreProductionWorkflows';
import { PostProductionWorkflows } from './playground/PostProductionWorkflows';

interface PlaygroundPanelProps {
  className?: string;
}

type PlaygroundTab = 'images' | 'videos' | 'pre-production' | 'post-production';

export function PlaygroundPanel({ className = '' }: PlaygroundPanelProps) {
  const screenplay = useScreenplay();
  const screenplayId = screenplay.screenplayId;
  const [activeTab, setActiveTab] = useState<PlaygroundTab>('images');

  return (
    <div className={cn("h-full flex flex-col bg-[#0A0A0A]", className)}>
      {/* Tab Navigation */}
      <div className="flex-shrink-0 border-b border-[#3F3F46] bg-[#141414]">
        <div className="flex gap-1 px-4">
          <button
            onClick={() => setActiveTab('images')}
            className={cn(
              "relative flex items-center gap-2 px-4 py-3 font-medium text-sm",
              "transition-colors duration-200",
              "border-b-2 -mb-[2px]",
              activeTab === 'images'
                ? cn("border-cinema-red", "text-white")
                : cn("border-transparent", "text-[#808080]", "hover:text-white")
            )}
          >
            <Image className="w-4 h-4" />
            <span>Image Generation</span>
          </button>

          <button
            onClick={() => setActiveTab('videos')}
            className={cn(
              "relative flex items-center gap-2 px-4 py-3 font-medium text-sm",
              "transition-colors duration-200",
              "border-b-2 -mb-[2px]",
              activeTab === 'videos'
                ? cn("border-cinema-red", "text-white")
                : cn("border-transparent", "text-[#808080]", "hover:text-white")
            )}
          >
            <Video className="w-4 h-4" />
            <span>Video Generation</span>
          </button>

          <button
            onClick={() => setActiveTab('pre-production')}
            className={cn(
              "relative flex items-center gap-2 px-4 py-3 font-medium text-sm",
              "transition-colors duration-200",
              "border-b-2 -mb-[2px]",
              activeTab === 'pre-production'
                ? cn("border-cinema-red", "text-white")
                : cn("border-transparent", "text-[#808080]", "hover:text-white")
            )}
          >
            <Palette className="w-4 h-4" />
            <span>Pre-Production Workflows</span>
          </button>

          <button
            onClick={() => setActiveTab('post-production')}
            className={cn(
              "relative flex items-center gap-2 px-4 py-3 font-medium text-sm",
              "transition-colors duration-200",
              "border-b-2 -mb-[2px]",
              activeTab === 'post-production'
                ? cn("border-cinema-red", "text-white")
                : cn("border-transparent", "text-[#808080]", "hover:text-white")
            )}
          >
            <Scissors className="w-4 h-4" />
            <span>Post-Production Workflows</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'images' && (
          <ImageGenerationTools className="h-full" />
        )}

        {activeTab === 'videos' && (
          <VideoGenerationTools className="h-full" screenplayId={screenplayId} />
        )}

        {activeTab === 'pre-production' && (
          <PreProductionWorkflows className="h-full" screenplayId={screenplayId} />
        )}

        {activeTab === 'post-production' && (
          <PostProductionWorkflows className="h-full" screenplayId={screenplayId} />
        )}
      </div>
    </div>
  );
}


