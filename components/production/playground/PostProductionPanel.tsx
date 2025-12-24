'use client';

/**
 * Post-Production Panel
 * 
 * Everything that happens AFTER principal photography:
 * - Audio generation (Background Music, Sound Effects, Soundtracks)
 * - Annotation-to-Video
 * - Post-Production workflows (12 workflows)
 */

import React, { useState } from 'react';
import { Music, Video, Workflow } from 'lucide-react';
import { cn } from '@/lib/utils';

// Sub-components
import { AudioGenerationPanel } from './AudioGenerationPanel';
import { AnnotationToVideoPanel } from './AnnotationToVideoPanel';
import { VideoGenerationTools } from './VideoGenerationTools';
import { PostProductionWorkflows } from './PostProductionWorkflows';

interface PostProductionPanelProps {
  className?: string;
  screenplayId?: string;
}

type PostProductionSection = 'audio' | 'video-generation' | 'annotation-to-video' | 'workflows';

export function PostProductionPanel({ className = '', screenplayId }: PostProductionPanelProps) {
  const [activeSection, setActiveSection] = useState<PostProductionSection>('audio');

  return (
    <div className={cn("h-full flex flex-col bg-[#0A0A0A] overflow-hidden", className)}>
      {/* Section Tabs */}
      <div className="flex-shrink-0 border-b border-[#3F3F46] bg-[#141414]">
        <div className="flex gap-1 px-4">
          <button
            onClick={() => setActiveSection('audio')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium",
              "transition-colors",
              activeSection === 'audio'
                ? "text-white border-b-2 border-cinema-red -mb-[2px]"
                : "text-[#808080] hover:text-white"
            )}
          >
            <Music className="w-4 h-4" />
            <span>Audio Generation</span>
          </button>

          <button
            onClick={() => setActiveSection('video-generation')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium",
              "transition-colors",
              activeSection === 'video-generation'
                ? "text-white border-b-2 border-cinema-red -mb-[2px]"
                : "text-[#808080] hover:text-white"
            )}
          >
            <Video className="w-4 h-4" />
            <span>Video Generation</span>
          </button>

          <button
            onClick={() => setActiveSection('annotation-to-video')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium",
              "transition-colors",
              activeSection === 'annotation-to-video'
                ? "text-white border-b-2 border-cinema-red -mb-[2px]"
                : "text-[#808080] hover:text-white"
            )}
          >
            <Video className="w-4 h-4" />
            <span>Annotation-to-Video</span>
          </button>

          <button
            onClick={() => setActiveSection('workflows')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium",
              "transition-colors",
              activeSection === 'workflows'
                ? "text-white border-b-2 border-cinema-red -mb-[2px]"
                : "text-[#808080] hover:text-white"
            )}
          >
            <Workflow className="w-4 h-4" />
            <span>Post-Production Workflows</span>
          </button>
        </div>
      </div>

      {/* Section Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSection === 'audio' && (
          <AudioGenerationPanel className="h-full" />
        )}

        {activeSection === 'video-generation' && (
          <VideoGenerationTools className="h-full" screenplayId={screenplayId} />
        )}

        {activeSection === 'annotation-to-video' && (
          <AnnotationToVideoPanel className="h-full" />
        )}

        {activeSection === 'workflows' && (
          <PostProductionWorkflows className="h-full" screenplayId={screenplayId} />
        )}
      </div>
    </div>
  );
}


