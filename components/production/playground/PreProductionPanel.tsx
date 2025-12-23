'use client';

/**
 * Pre-Production Panel
 * 
 * Everything that happens BEFORE principal photography:
 * - Image generation (Character, Location, Asset, First Frame)
 * - Pre-Production workflows (47 workflows)
 */

import React, { useState } from 'react';
import { Image, Users, MapPin, Package, Film, Workflow, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Sub-components (to be created)
import { ImageGenerationTools } from './ImageGenerationTools';
import { PreProductionWorkflows } from './PreProductionWorkflows';

interface PreProductionPanelProps {
  className?: string;
  screenplayId?: string;
}

type PreProductionSection = 'images' | 'workflows';

export function PreProductionPanel({ className = '', screenplayId }: PreProductionPanelProps) {
  const [activeSection, setActiveSection] = useState<PreProductionSection>('images');

  return (
    <div className={cn("h-full flex flex-col bg-[#0A0A0A] overflow-hidden", className)}>
      {/* Section Tabs */}
      <div className="flex-shrink-0 border-b border-[#3F3F46] bg-[#141414]">
        <div className="flex gap-1 px-4">
          <button
            onClick={() => setActiveSection('images')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium",
              "transition-colors",
              activeSection === 'images'
                ? "text-white border-b-2 border-cinema-red -mb-[2px]"
                : "text-[#808080] hover:text-white"
            )}
          >
            <Image className="w-4 h-4" />
            <span>Image Generation</span>
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
            <span>Pre-Production Workflows</span>
          </button>
        </div>
      </div>

      {/* Section Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSection === 'images' && (
          <ImageGenerationTools className="h-full" />
        )}

        {activeSection === 'workflows' && (
          <PreProductionWorkflows className="h-full" screenplayId={screenplayId} />
        )}
      </div>
    </div>
  );
}


