'use client';

/**
 * Storage Hub - Media Library & Style Analyzer
 * 
 * Contains:
 * - Media Library (upload management)
 * - Style Analyzer (match existing footage)
 */

import React, { useState } from 'react';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import MediaLibrary from '@/components/production/MediaLibrary';
import StyleAnalyzer from '@/components/production/StyleAnalyzer';
import { X } from 'lucide-react';

export function StorageHub() {
  const screenplay = useScreenplay();
  const screenplayId = screenplay.screenplayId;
  const [showStyleAnalyzer, setShowStyleAnalyzer] = useState(false);

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

  const handleStyleAnalysisComplete = (profile: any) => {
    console.log('[StorageHub] Style analysis complete:', profile);
    setShowStyleAnalyzer(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A]">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-5">
          <MediaLibrary
            projectId={screenplayId}
            onSelectFile={handleMediaSelect}
            className="mb-4 md:mb-5"
          />

          {showStyleAnalyzer && (
            <div className="mt-4 md:mt-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg md:text-xl font-semibold text-white">Style Analyzer</h3>
                <button
                  onClick={() => setShowStyleAnalyzer(false)}
                  className="p-1.5 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <StyleAnalyzer
                projectId={screenplayId}
                onAnalysisComplete={handleStyleAnalysisComplete}
              />
            </div>
          )}

          {!showStyleAnalyzer && (
            <button
              onClick={() => setShowStyleAnalyzer(true)}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mt-4"
            >
              Show Style Analyzer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

