/**
 * Production Studio - Unified Workflow Manager
 * 
 * Integrates all production stages into one seamless experience:
 * Screenplay → Shot List → Timeline → Composition → Export
 */

'use client';

import React, { useState } from 'react';
import {
  ProductionPipelineNavigator,
  ProductionStage
} from './ProductionPipelineNavigator';
import { SceneVisualizerPanel } from '../screenplay/SceneVisualizerPanel';
import { TimelineEditor } from '../timeline/TimelineEditor';
import { CompositionStudio } from '../composition/CompositionStudio';

interface ProductionStudioProps {
  projectId?: string;
  initialStage?: ProductionStage;
}

export function ProductionStudio({
  projectId = `project_${Date.now()}`,
  initialStage = 'screenplay'
}: ProductionStudioProps) {
  const [currentStage, setCurrentStage] = useState<ProductionStage>(initialStage);
  const [completedStages, setCompletedStages] = useState<ProductionStage[]>([]);
  const [projectName, setProjectName] = useState('Untitled Project');

  // Mark a stage as completed
  const markStageComplete = (stage: ProductionStage) => {
    if (!completedStages.includes(stage)) {
      setCompletedStages([...completedStages, stage]);
    }
  };

  // Handle stage change
  const handleStageChange = (stage: ProductionStage) => {
    setCurrentStage(stage);
  };

  // Handle shot list generation completion
  const handleShotListComplete = () => {
    markStageComplete('shotlist');
    // Auto-advance to timeline when shot list is imported
  };

  // Handle timeline export
  const handleTimelineReady = () => {
    markStageComplete('timeline');
  };

  // Handle composition complete
  const handleCompositionComplete = () => {
    markStageComplete('composition');
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] bg-slate-100 dark:bg-slate-900">
      {/* Production Pipeline Navigator */}
      <ProductionPipelineNavigator
        currentStage={currentStage}
        completedStages={completedStages}
        onStageChange={handleStageChange}
        projectName={projectName}
      />

      {/* Stage Content */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full max-w-[1920px] mx-auto">
          {/* Screenplay Stage */}
          {currentStage === 'screenplay' && (
            <div className="h-full">
              <SceneVisualizerPanel
                prompts={[]}
                onUpdatePrompt={(index, updatedPrompt) => {
                  console.log('Prompt updated:', index, updatedPrompt);
                }}
                onGenerateVideos={(prompts, quality, resolution, useFastMode, useVideoExtension, preferredModel) => {
                  console.log('Generating videos:', prompts);
                }}
                isGenerating={false}
                projectId={projectId}
                sceneId="scene_1"
              />
            </div>
          )}

          {/* Shot List Stage */}
          {currentStage === 'shotlist' && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-8">
                <div className="text-6xl mb-4">📋</div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Shot List Stage
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Generate shot list from screenplay in the previous stage
                </p>
                <button
                  onClick={() => setCurrentStage('screenplay')}
                  className="mt-4 px-4 py-2 bg-yellow-400 text-black rounded-lg font-bold hover:bg-yellow-500"
                >
                  ← Back to Screenplay
                </button>
              </div>
            </div>
          )}

          {/* Timeline Stage */}
          {currentStage === 'timeline' && (
            <div className="h-full">
              <TimelineEditor projectId={projectId} />
            </div>
          )}

          {/* Composition Stage */}
          {currentStage === 'composition' && (
            <div className="h-full">
              <CompositionStudio userId="temp-user-id" />
            </div>
          )}

          {/* Export Stage */}
          {currentStage === 'export' && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-8 max-w-2xl">
                <div className="text-6xl mb-4">🎬</div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Export Your Masterpiece
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Final rendering and export coming soon! This will combine all your
                  compositions, pacing, and effects into one beautiful video.
                </p>
                <div className="space-y-4">
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                      Export Features (Coming Soon)
                    </h3>
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 text-left">
                      <li>✓ Multiple resolution options (720p, 1080p, 4K)</li>
                      <li>✓ Aspect ratio conversion (16:9, 9:16, 1:1)</li>
                      <li>✓ Audio mixing and mastering</li>
                      <li>✓ Color grading presets</li>
                      <li>✓ Direct upload to YouTube, Vimeo, etc.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

