/**
 * UseCasesBadges Component
 * 
 * Displays expandable use case badges for 3D exports.
 * Future-proof component that can be extended with new use cases without code changes.
 */

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface UseCase {
  id: string;
  label: string;
  description?: string;
  icon?: string;
}

interface UseCasesBadgesProps {
  useCases: UseCase[];
  defaultVisible?: number; // Number of badges to show by default
  expandable?: boolean; // Whether to show expand/collapse
  className?: string;
}

const DEFAULT_USE_CASES: UseCase[] = [
  { id: 'ar-vr', label: 'AR/VR', description: 'Augmented and Virtual Reality applications' },
  { id: 'game-engines', label: 'Game Engines', description: 'Unity, Unreal Engine, and more' },
  { id: '3d-animation', label: '3D Animation', description: 'Blender, Maya, Cinema 4D' },
];

export function UseCasesBadges({
  useCases = DEFAULT_USE_CASES,
  defaultVisible = 3,
  expandable = true,
  className = ''
}: UseCasesBadgesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const visibleUseCases = isExpanded ? useCases : useCases.slice(0, defaultVisible);
  const hasMore = useCases.length > defaultVisible;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {visibleUseCases.map((useCase) => (
          <span
            key={useCase.id}
            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[#1F1F1F] border border-[#3F3F46] text-[#E5E7EB]"
            title={useCase.description}
          >
            {useCase.label}
          </span>
        ))}
      </div>
      
      {expandable && hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-[#9CA3AF] hover:text-[#E5E7EB] transition-colors inline-flex items-center gap-1"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Show {useCases.length - defaultVisible} more
            </>
          )}
        </button>
      )}
    </div>
  );
}

