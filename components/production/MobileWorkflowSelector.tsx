'use client';

/**
 * Mobile Workflow Selector
 * 
 * Simplified workflow-based interface for mobile production.
 * Hides provider complexity and guides users through workflow selection.
 */

import React, { useState } from 'react';
import { 
  Film, Users, Palette, Zap, Sparkles, Crown, 
  ArrowLeft, Clock, DollarSign, Tag, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

// Import dynamic workflow hook
import { useWorkflows, type WorkflowDefinition } from '@/hooks/useWorkflows';
import { WorkflowInputForm, type WorkflowInputs } from './WorkflowInputForm';
import { WorkflowProgressTracker, type WorkflowResults } from './WorkflowProgressTracker';
import { WorkflowResultsDisplay } from './WorkflowResultsDisplay';
import { useRouter } from 'next/navigation';

interface MobileWorkflowSelectorProps {
  projectId: string;
}

type ViewMode = 'categories' | 'workflows' | 'details' | 'inputs' | 'progress' | 'results';

interface WorkflowCategory {
  id: string;
  name: string;
  icon: typeof Film;
  color: string;
  description: string;
}

const WORKFLOW_CATEGORIES: WorkflowCategory[] = [
  {
    id: 'production',
    name: 'Production Essentials',
    icon: Film,
    color: 'from-blue-500 to-indigo-600',
    description: 'Complete scenes and multi-shot packages'
  },
  {
    id: 'photorealistic',
    name: 'Photorealistic',
    icon: Users,
    color: 'from-purple-500 to-pink-600',
    description: 'Realistic characters and scenes'
  },
  {
    id: 'performance-capture',
    name: 'Performance Capture',
    icon: Sparkles,
    color: 'from-green-500 to-emerald-600',
    description: 'Upload your performance, become the character'
  },
  {
    id: 'animated',
    name: 'Animated',
    icon: Palette,
    color: 'from-yellow-500 to-orange-600',
    description: 'Cartoon, anime, and 3D characters'
  },
  {
    id: 'budget',
    name: 'Fast & Affordable',
    icon: Zap,
    color: 'from-cyan-500 to-blue-600',
    description: 'Quick loops and speed-optimized workflows'
  },
  {
    id: 'fantasy',
    name: 'Fantasy & VFX',
    icon: Crown,
    color: 'from-fuchsia-500 to-purple-600',
    description: 'Superhero transformations and epic scenes'
  }
];

export function MobileWorkflowSelector({
  projectId
}: MobileWorkflowSelectorProps) {
  const router = useRouter();
  
  // Fetch workflows dynamically from backend (all 58 workflows)
  const { workflows, workflowsByCategory, isLoading, error } = useWorkflows();
  
  // Navigation state
  const [viewMode, setViewMode] = useState<ViewMode>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(null);
  
  // Execution state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [workflowResults, setWorkflowResults] = useState<WorkflowResults | null>(null);

  /**
   * Handle workflow inputs submission
   */
  const handleInputsSubmit = async (inputs: WorkflowInputs) => {
    if (!selectedWorkflow) return;

    setIsSubmitting(true);

    try {
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('workflowId', selectedWorkflow.id);
      formData.append('projectId', projectId);
      
      if (inputs.sceneDescription) {
        formData.append('sceneDescription', inputs.sceneDescription);
      }
      if (inputs.characterDescription) {
        formData.append('characterDescription', inputs.characterDescription);
      }
      if (inputs.stylePreference) {
        formData.append('stylePreference', inputs.stylePreference);
      }
      if (inputs.characterImageFile) {
        formData.append('characterImageFile', inputs.characterImageFile);
      }
      if (inputs.performanceVideoFile) {
        formData.append('performanceVideoFile', inputs.performanceVideoFile);
      }

      // Start workflow execution
      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to start workflow');
      }

      // Move to progress view
      setCurrentJobId(data.jobId);
      setViewMode('progress');

      toast.success('Workflow started!', {
        description: `Estimated time: ${Math.round(data.estimatedTime / 60)} minutes`
      });

    } catch (error) {
      console.error('[MobileWorkflow] Execution error:', error);
      toast.error('Failed to start workflow', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle workflow completion
   */
  const handleWorkflowComplete = (results: WorkflowResults) => {
    setWorkflowResults(results);
    setViewMode('results');
    
    toast.success('Workflow complete!', {
      description: `Generated ${results.videos.length} video(s)`
    });
  };

  /**
   * Handle workflow error
   */
  const handleWorkflowError = (error: string) => {
    toast.error('Workflow failed', {
      description: error
    });
    setViewMode('details'); // Go back to details to try again
  };

  /**
   * Save results to gallery
   */
  const handleSaveToGallery = () => {
    if (!workflowResults) return;

    try {
      const existingMedia = JSON.parse(localStorage.getItem('mediaGallery') || '[]');
      
      const newItems = workflowResults.videos.map((video, index) => ({
        id: `workflow-${currentJobId}-${index}`,
        type: 'video' as const,
        url: video.url,
        name: `${selectedWorkflow?.name || 'workflow'}_${index + 1}.mp4`,
        size: 0,
        createdAt: new Date().toISOString(),
        s3Key: video.s3Key,
        metadata: {
          source: 'workflow',
          workflowId: selectedWorkflow?.id,
          workflowName: selectedWorkflow?.name,
          creditsUsed: video.creditsUsed
        }
      }));
      
      localStorage.setItem('mediaGallery', JSON.stringify([...existingMedia, ...newItems]));
      
      toast.success(`Saved ${workflowResults.videos.length} video(s) to gallery!`);
    } catch (error) {
      console.error('[MobileWorkflow] Save to gallery error:', error);
      toast.error('Failed to save to gallery');
    }
  };

  /**
   * Send results to timeline
   */
  const handleSendToTimeline = () => {
    if (!workflowResults) return;

    const clipsData = workflowResults.videos.map((video, index) => ({
      url: video.url,
      type: 'video',
      name: `${selectedWorkflow?.name || 'workflow'}_${index + 1}.mp4`
    }));
    
    const encoded = encodeURIComponent(JSON.stringify(clipsData));
    router.push(`/app/timeline?preloadClips=${encoded}`);
    
    toast.success(`Sending ${workflowResults.videos.length} video(s) to timeline...`);
  };

  /**
   * Send results to composition
   */
  const handleSendToComposition = () => {
    if (!workflowResults) return;

    const clipsData = workflowResults.videos.map((video, index) => ({
      url: video.url,
      type: 'video',
      name: `${selectedWorkflow?.name || 'workflow'}_${index + 1}.mp4`
    }));
    
    const encoded = encodeURIComponent(JSON.stringify(clipsData));
    router.push(`/app/composition?preloadClips=${encoded}`);
    
    toast.success(`Sending ${workflowResults.videos.length} video(s) to composition...`);
  };

  /**
   * Start new workflow
   */
  const handleStartNew = () => {
    setViewMode('categories');
    setSelectedCategory(null);
    setSelectedWorkflow(null);
    setCurrentJobId(null);
    setWorkflowResults(null);
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    if (viewMode === 'results') {
      setViewMode('categories');
      setSelectedCategory(null);
      setSelectedWorkflow(null);
      setCurrentJobId(null);
      setWorkflowResults(null);
    } else if (viewMode === 'inputs') {
      setViewMode('details');
    } else if (viewMode === 'details') {
      setViewMode('workflows');
      setSelectedWorkflow(null);
    } else if (viewMode === 'workflows') {
      setViewMode('categories');
      setSelectedCategory(null);
    }
  };

  // ==================== RENDER ====================

  // Loading state - workflows fetching from backend
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900 p-8">
        <Loader2 className="w-12 h-12 text-[#DC143C] animate-spin mb-4" />
        <p className="text-white font-semibold mb-2">Loading Workflows...</p>
        <p className="text-slate-400 text-sm text-center">
          Fetching all 58 professional workflows from server
        </p>
      </div>
    );
  }

  // Error state - failed to fetch workflows
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900 p-8">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <p className="text-white font-semibold mb-2">Failed to Load Workflows</p>
        <p className="text-slate-400 text-sm text-center mb-4">
          {error.message || 'Unable to fetch workflows from server'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Render based on view mode
  if (viewMode === 'progress' && currentJobId && selectedWorkflow) {
    return (
      <WorkflowProgressTracker
        jobId={currentJobId}
        workflowName={selectedWorkflow.name}
        onComplete={handleWorkflowComplete}
        onError={handleWorkflowError}
      />
    );
  }

  if (viewMode === 'results' && workflowResults && selectedWorkflow) {
    return (
      <WorkflowResultsDisplay
        results={workflowResults}
        workflowName={selectedWorkflow.name}
        onSaveToGallery={handleSaveToGallery}
        onSendToTimeline={handleSendToTimeline}
        onSendToComposition={handleSendToComposition}
        onStartNew={handleStartNew}
      />
    );
  }

  if (viewMode === 'inputs' && selectedWorkflow) {
    return (
      <WorkflowInputForm
        workflow={selectedWorkflow}
        projectId={projectId}
        onSubmit={handleInputsSubmit}
        onCancel={handleBack}
        isSubmitting={isSubmitting}
      />
    );
  }

  // Step 1: Show category grid
  if (viewMode === 'categories') {
    return (
      <div className="flex flex-col h-full p-4 space-y-4 bg-slate-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Choose Your Workflow
          </h2>
          <p className="text-sm text-slate-300 mb-1">
            Select a category to see available workflows
          </p>
          <p className="text-xs text-slate-500">
            ✅ {workflows.length} professional workflows loaded from backend
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 overflow-auto">
          {WORKFLOW_CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setViewMode('workflows');
                }}
                className="p-4 rounded-lg border-2 border-slate-700 
                         bg-slate-800 hover:border-[#DC143C] transition-all
                         text-left"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${category.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-200 mb-1">
                      {category.name}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {category.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Step 2: Show workflows in selected category
  if (viewMode === 'workflows' && selectedCategory) {
    const category = WORKFLOW_CATEGORIES.find(c => c.id === selectedCategory);
    const workflows = workflowsByCategory[selectedCategory] || [];

    return (
      <div className="flex flex-col h-full bg-slate-900">
        {/* Header with back button */}
        <div className="p-4 border-b border-slate-700 bg-slate-800">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-300 hover:text-white mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Categories</span>
          </button>
          <h2 className="text-xl font-bold text-white mb-1">
            {category?.name}
          </h2>
          <p className="text-sm text-slate-300">
            {workflows.length} workflow{workflows.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {/* Workflow cards */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {workflows.map((workflow: any) => (
            <button
              key={workflow.id}
              onClick={() => {
                setSelectedWorkflow(workflow);
                setViewMode('details');
              }}
              className="w-full p-4 rounded-lg border-2 border-slate-700 
                       bg-slate-800 hover:border-[#DC143C] transition-all
                       text-left"
            >
              <div className="space-y-3">
                {/* Title & Featured Badge */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-white flex-1">
                    {workflow.name}
                  </h3>
                  {workflow.featured && (
                    <span className="px-2 py-1 text-xs font-bold bg-yellow-900/30 
                                   text-yellow-300 rounded">
                      Popular
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-slate-300 line-clamp-2">
                  {workflow.description}
                </p>

                {/* Cost & Time */}
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    <span>{workflow.cost.min}-{workflow.cost.max} credits</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{workflow.time.min}-{workflow.time.max} min</span>
                  </div>
                </div>

                {/* Tags */}
                {workflow.tags && workflow.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {workflow.tags.slice(0, 3).map((tag: string) => (
                      <span 
                        key={tag}
                        className="px-2 py-0.5 text-xs bg-slate-700 
                                 text-slate-300 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          ))}

          {workflows.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Film className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No workflows available in this category yet.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step 3: Show workflow detail & input form
  if (viewMode === 'details' && selectedWorkflow) {
    return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-800">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-slate-300 hover:text-white mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Workflows</span>
        </button>
        <h2 className="text-xl font-bold text-white mb-1">
          {selectedWorkflow.name}
        </h2>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            <span>{selectedWorkflow.cost.min}-{selectedWorkflow.cost.max} credits</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{selectedWorkflow.time.min}-{selectedWorkflow.time.max} minutes</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Description */}
        <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
          <p className="text-sm text-slate-300">
            {selectedWorkflow.description}
          </p>
        </div>

        {/* Best For */}
        {selectedWorkflow.bestFor && selectedWorkflow.bestFor.length > 0 && (
          <div>
            <h3 className="font-semibold text-white mb-2 text-sm">
              Best For:
            </h3>
            <ul className="space-y-1 text-sm text-slate-300">
              {selectedWorkflow.bestFor.slice(0, 4).map((use: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>{use}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Examples */}
        {selectedWorkflow.examples && selectedWorkflow.examples.length > 0 && (
          <div>
            <h3 className="font-semibold text-white mb-2 text-sm">
              Examples:
            </h3>
            <ul className="space-y-2">
              {selectedWorkflow.examples.slice(0, 2).map((example: string, idx: number) => (
                <li 
                  key={idx}
                  className="text-xs text-slate-300 
                           p-2 rounded bg-slate-800 border border-slate-700"
                >
                  {example}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upload Instructions (for performance capture) */}
        {selectedWorkflow.requiresVideoUpload && (
          <div className="p-3 rounded-lg border-2 border-blue-500/30 bg-blue-500/10">
            <h3 className="font-semibold text-white mb-2 text-sm flex items-center gap-2">
              <Film className="w-4 h-4 text-blue-400" />
              {selectedWorkflow.videoUploadInstructions?.title || 'Performance Video Required'}
            </h3>
            {selectedWorkflow.videoUploadInstructions?.subtitle && (
              <p className="text-xs text-slate-300 mb-2">
                {selectedWorkflow.videoUploadInstructions.subtitle}
              </p>
            )}
            <p className="text-xs text-slate-400">
              You&apos;ll be asked to upload your performance video in the next step.
            </p>
          </div>
        )}
      </div>

      {/* Start Button */}
      <div className="p-4 border-t border-slate-700 bg-slate-800">
        <button
          onClick={() => setViewMode('inputs')}
          className="w-full py-3 px-4 rounded-lg bg-[#DC143C] text-white font-bold
                   hover:bg-[#B01030] transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Use This Workflow
        </button>
      </div>
    </div>
  );
  }

  // Fallback (should never reach here)
  return null;
}

