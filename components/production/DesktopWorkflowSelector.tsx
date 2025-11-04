'use client';

/**
 * Desktop Workflow Selector
 * 
 * Grid-based workflow interface optimized for desktop screens.
 * Shows workflow categories in a responsive grid layout.
 */

import React, { useState } from 'react';
import { 
  Film, Users, Palette, Zap, Sparkles, Crown, 
  ArrowLeft, Clock, DollarSign, Tag, Loader2, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

// Import dynamic workflow hook
import { useWorkflows, type WorkflowDefinition } from '@/hooks/useWorkflows';
import { WorkflowInputForm, type WorkflowInputs } from './WorkflowInputForm';
import { WorkflowProgressTracker, type WorkflowResults } from './WorkflowProgressTracker';
import { WorkflowResultsDisplay } from './WorkflowResultsDisplay';
import { useRouter } from 'next/navigation';

interface DesktopWorkflowSelectorProps {
  projectId: string;
}

type ViewMode = 'categories' | 'workflows' | 'details' | 'inputs' | 'progress' | 'results';

interface WorkflowCategory {
  id: string;
  name: string;
  icon: any;
  color: string;
  description: string;
}

const WORKFLOW_CATEGORIES: WorkflowCategory[] = [
  {
    id: 'production-essentials',
    name: 'Production Essentials',
    icon: Film,
    color: 'from-blue-500 to-blue-600',
    description: 'Complete scenes and multi-shot packages'
  },
  {
    id: 'photorealistic',
    name: 'Photorealistic',
    icon: Users,
    color: 'from-pink-500 to-pink-600',
    description: 'Realistic characters and scenes'
  },
  {
    id: 'performance-capture',
    name: 'Performance Capture',
    icon: Zap,
    color: 'from-green-500 to-green-600',
    description: 'Upload your performance, become the character'
  },
  {
    id: 'animated',
    name: 'Animated',
    icon: Palette,
    color: 'from-orange-500 to-orange-600',
    description: 'Cartoon, anime, and 3D characters'
  },
  {
    id: 'fast-affordable',
    name: 'Fast & Affordable',
    icon: Sparkles,
    color: 'from-cyan-500 to-cyan-600',
    description: 'Quick loops and speed-optimized workflows'
  },
  {
    id: 'premium',
    name: 'Premium',
    icon: Crown,
    color: 'from-purple-500 to-purple-600',
    description: 'Superhero transformations and epic scenes'
  }
];

export function DesktopWorkflowSelector({
  projectId
}: DesktopWorkflowSelectorProps) {
  
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

  const router = useRouter();

  /**
   * Handle workflow inputs submission
   */
  const handleInputsSubmit = async (inputs: WorkflowInputs) => {
    if (!selectedWorkflow) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          projectId,
          workflowId: selectedWorkflow.id,
          inputs,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start workflow');
      }

      const data = await response.json();
      setCurrentJobId(data.jobId);
      setViewMode('progress');
      toast.success('Workflow started successfully');
    } catch (error: any) {
      console.error('Workflow execution error:', error);
      toast.error(error.message || 'Failed to start workflow');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (viewMode === 'workflows') {
      setViewMode('categories');
      setSelectedCategory(null);
    } else if (viewMode === 'details') {
      setViewMode('workflows');
      setSelectedWorkflow(null);
    } else if (viewMode === 'inputs') {
      setViewMode('details');
    }
  };

  const handleWorkflowComplete = (results: WorkflowResults) => {
    setWorkflowResults(results);
    setViewMode('results');
  };

  const handleSaveToGallery = () => {
    toast.success('Saved to gallery');
  };

  const handleSendToTimeline = () => {
    toast.success('Sent to timeline');
  };

  const handleSendToComposition = () => {
    toast.success('Sent to composition');
  };

  const handleStartNew = () => {
    setViewMode('categories');
    setSelectedCategory(null);
    setSelectedWorkflow(null);
    setCurrentJobId(null);
    setWorkflowResults(null);
  };

  // Show progress tracker during workflow execution
  if (viewMode === 'progress' && currentJobId && selectedWorkflow) {
    return (
      <WorkflowProgressTracker
        jobId={currentJobId}
        workflowName={selectedWorkflow.name}
        onComplete={handleWorkflowComplete}
        onError={(error) => {
          console.error('Workflow error:', error);
          toast.error(`Workflow failed: ${error}`);
          handleStartNew();
        }}
      />
    );
  }

  // Show results after workflow completion
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

  // Show workflow input form
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#DC143C] animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading workflows...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-slate-200 mb-2">Failed to Load Workflows</h3>
          <p className="text-slate-400 mb-4">{error instanceof Error ? error.message : String(error)}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#DC143C] text-white rounded-lg hover:bg-[#B91238] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Show category grid (Desktop optimized)
  if (viewMode === 'categories') {
    return (
      <div className="flex flex-col h-full bg-slate-900 overflow-auto">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-700">
          <h2 className="text-3xl font-bold text-slate-200 mb-2">
            Choose Your Workflow
          </h2>
          <p className="text-slate-400">
            Select a category to see available workflows
          </p>
          <div className="mt-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-slate-500">
              {workflows.length} professional workflows loaded from backend
            </span>
          </div>
        </div>

        {/* Category Grid - Desktop 2 columns */}
        <div className="flex-1 p-8">
          <div className="grid grid-cols-2 gap-6 max-w-6xl mx-auto">
            {WORKFLOW_CATEGORIES.map((category) => {
              const Icon = category.icon;
              const categoryWorkflows = workflowsByCategory[category.id] || [];
              
              return (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setViewMode('workflows');
                  }}
                  className="group p-6 rounded-lg border-2 border-slate-700 
                           bg-slate-800 hover:border-[#DC143C] transition-all
                           text-left hover:shadow-xl hover:shadow-[#DC143C]/10"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${category.color} flex-shrink-0`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-slate-200 mb-2 group-hover:text-white transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-slate-400 mb-3">
                        {category.description}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Film className="w-4 h-4" />
                        <span>
                          {categoryWorkflows.length} workflow{categoryWorkflows.length !== 1 ? 's' : ''} available
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Show workflows in selected category (Desktop grid)
  if (viewMode === 'workflows' && selectedCategory) {
    const category = WORKFLOW_CATEGORIES.find(c => c.id === selectedCategory);
    const categoryWorkflows = workflowsByCategory[selectedCategory] || [];

    return (
      <div className="flex flex-col h-full bg-slate-900 overflow-auto">
        {/* Header with back button */}
        <div className="px-8 py-6 border-b border-slate-700 bg-slate-800">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Categories</span>
          </button>
          <div className="flex items-center gap-4">
            {category && (
              <div className={`p-3 rounded-lg bg-gradient-to-br ${category.color}`}>
                <category.icon className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-slate-200 mb-1">
                {category?.name}
              </h2>
              <p className="text-slate-400">
                {categoryWorkflows.length} workflow{categoryWorkflows.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
        </div>

        {/* Workflow Grid - Desktop 3 columns */}
        <div className="flex-1 p-8">
          <div className="grid grid-cols-3 gap-4 max-w-7xl mx-auto">
            {categoryWorkflows.map((workflow: WorkflowDefinition) => (
              <button
                key={workflow.id}
                onClick={() => {
                  setSelectedWorkflow(workflow);
                  setViewMode('inputs');
                }}
                className="group p-5 rounded-lg border-2 border-slate-700 
                         bg-slate-800 hover:border-[#DC143C] transition-all
                         text-left hover:shadow-lg"
              >
                <h3 className="font-bold text-slate-200 mb-2 group-hover:text-white transition-colors line-clamp-2">
                  {workflow.name}
                </h3>
                <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                  {workflow.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{workflow.estimatedTime}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    <span>{workflow.cost}</span>
                  </div>
                </div>
                {workflow.tags && workflow.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {workflow.tags.slice(0, 3).map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

