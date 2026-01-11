'use client';

/**
 * Archive Hub - Media Library & Style Analyzer
 * 
 * NOTE: Displayed to users as "Archive" for film industry terminology.
 * Backend/API still uses "Storage" or "media-library" - component name kept for compatibility.
 * 
 * Contains:
 * - Archive (upload management - displayed as "Archive", backend uses "Storage")
 * - Style Analyzer (match existing footage)
 */

import React from 'react';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import MediaLibrary from '@/components/production/MediaLibrary';

export function StorageHub() {
  const screenplay = useScreenplay();
  const screenplayId = screenplay.screenplayId;

  // Early return if no screenplay
  if (!screenplayId) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading screenplay...</p>
        </div>
      </div>
    );
  }

  const handleMediaSelect = (file: any) => {
    console.log('[StorageHub] Media selected:', file);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A]">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-5">
          <MediaLibrary
            projectId={screenplayId}
            onSelectFile={handleMediaSelect}
          />
        </div>
      </div>
    </div>
  );
}

