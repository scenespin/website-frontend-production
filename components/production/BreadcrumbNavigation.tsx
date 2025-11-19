'use client';

/**
 * Breadcrumb Navigation Component
 * 
 * Shows current folder path and allows navigation up the folder hierarchy.
 */

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbNavigationProps {
  path: string[];
  onNavigate: (index: number) => void;
}

export function BreadcrumbNavigation({ path, onNavigate }: BreadcrumbNavigationProps) {
  const handleClick = (index: number) => {
    // -1 means "All Files" (root)
    onNavigate(index);
  };

  return (
    <div className="flex items-center gap-2 p-4 bg-[#141414] border-b border-[#3F3F46]">
      <button
        onClick={() => handleClick(-1)}
        className="flex items-center gap-1 text-sm text-[#808080] hover:text-[#FFFFFF] transition-colors"
      >
        <Home className="w-4 h-4" />
        <span>All Files</span>
      </button>
      {path.length > 0 && (
        <>
          <ChevronRight className="w-4 h-4 text-[#808080]" />
          {path.map((segment, index) => (
            <React.Fragment key={index}>
              <button
                onClick={() => handleClick(index)}
                className="text-sm text-[#808080] hover:text-[#FFFFFF] transition-colors truncate max-w-[150px]"
                title={segment}
              >
                {segment}
              </button>
              {index < path.length - 1 && (
                <ChevronRight className="w-4 h-4 text-[#808080]" />
              )}
            </React.Fragment>
          ))}
        </>
      )}
    </div>
  );
}

