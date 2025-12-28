'use client';

/**
 * SceneSelector Component
 * 
 * Allows users to select a scene from the database using a scene navigator list.
 * Part of Production Hub Phase 2 redesign.
 */

import React from 'react';
import { SceneNavigatorList } from './SceneNavigatorList';

interface SceneSelectorProps {
  selectedSceneId: string | null;
  onSceneSelect: (sceneId: string) => void;
  onUseScene?: (scene: any) => void; // Kept for compatibility but not used
  onEditScene?: (sceneId: string) => void; // Kept for compatibility but not used
  className?: string;
  isMobile?: boolean;
  projectId?: string; // Optional: for fetching first line of scene text
}

export function SceneSelector({
  selectedSceneId,
  onSceneSelect,
  onUseScene,
  onEditScene,
  className = '',
  isMobile = false,
  projectId
}: SceneSelectorProps) {
  return (
    <div className={className}>
      <SceneNavigatorList
        selectedSceneId={selectedSceneId}
        onSceneSelect={onSceneSelect}
        isMobile={isMobile}
        projectId={projectId}
      />
    </div>
  );
}

