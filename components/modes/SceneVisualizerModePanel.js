'use client';

import { useState, useEffect } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { Zap, Sparkles, Loader2 } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import WorkflowCard from '@/components/workflows/WorkflowCard';
import {
  getAllWorkflows,
  getCharacterConsistencyWorkflows,
  getBeginnerWorkflows,
  getFastWorkflows
} from '@/lib/workflowMetadata';
import {
  trackWorkflowDiscovery,
  trackWorkflowSelection,
  trackWorkflowFilter,
} from '@/lib/workflowAnalytics';

/**
 * SceneVisualizerModePanel - Mobile-optimized workflow selector for AgentDrawer
 * 
 * Features:
 * - Simple 3-button filters (All, Beginner, Fast & Budget)
 * - Character Consistency toggle (shows all 32 workflows)
 * - Inline badges on workflow cards (💡 Optional / ⚠️ Required)
 * - Tap for AI explanation before starting
 * - Compact single-column layout
 */
export function SceneVisualizerModePanel({ onInsert, onWorkflowComplete }) {
  const { state, addMessage } = useChatContext();
  const { user } = useUser();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Mobile-simplified filters
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'beginner', 'fast'
  const [showCharacterConsistency, setShowCharacterConsistency] = useState(false);
  
  // Track page view on mount
  useEffect(() => {
    trackWorkflowDiscovery({
      source: 'mobile_chat_panel',
      workflowCount: getAllWorkflows().length,
      category: 'all',
      userId: user?.id,
    });
  }, [user]);
  
  useEffect(() => {
    fetchWorkflows();
  }, [activeFilter, showCharacterConsistency]);
  
  function fetchWorkflows() {
    setLoading(true);
    
    let result = [];
    
    // Apply Character Consistency toggle first
    if (showCharacterConsistency) {
      result = getCharacterConsistencyWorkflows('all'); // Show all 32
    } else {
      // Then apply simple filters
      if (activeFilter === 'beginner') {
        result = getBeginnerWorkflows();
      } else if (activeFilter === 'fast') {
        result = getFastWorkflows();
      } else {
        result = getAllWorkflows();
      }
    }
    
    setWorkflows(result);
    setLoading(false);
  }
  
  const handleWorkflowSelect = async (workflow) => {
    setSelectedWorkflow(workflow);
    
    // Track selection
    trackWorkflowSelection(workflow, {
      source: 'mobile_chat_panel',
      userId: user?.id,
    });
    
    // Show workflow details and requirements via AI message
    const characterRequirement = workflow.inputRequirements.requiresImages 
      ? '⚠️ **Requires 1-2 character images** - You must upload Character Bank images before using this workflow.' 
      : workflow.inputRequirements.supportsCharacterBank
      ? '💡 **Supports optional Character Bank** - Works from text alone, or add 1-2 character images for consistent characters across multiple generations.'
      : '✍️ **Text description only** - No images needed! Perfect for beginners.';
    
    const videoRequirement = workflow.inputRequirements.requiresVideo
      ? '\n🎬 **Requires video upload** - This workflow transforms existing video.'
      : '';
    
    addMessage({
      role: 'assistant',
      content: `# 🎬 ${workflow.name} ${Array(workflow.stars).fill('⭐').join('')}\n\n${workflow.heroDescription}\n\n## What It Does\n\n${workflow.whatItDoes}\n\n## Requirements\n\n${characterRequirement}${videoRequirement}\n\n## Perfect For\n\n${workflow.perfectFor.map(p => `• ${p}`).join('\n')}\n\n💡 **Pro Tip:** ${workflow.proTip}\n\n**Credits:** ${workflow.creditRange.min}-${workflow.creditRange.max}\n\n---\n\nReady to start this workflow?`,
      mode: 'scene-visualizer'
    });
    
    toast.success(`${workflow.name} selected!`);
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-base-300 border-b border-cinema-red/20">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-cinema-red" />
          <h3 className="font-bold text-base-content">AI Workflow Selector</h3>
        </div>
        <p className="text-xs text-base-content/60 mt-1">
          {showCharacterConsistency 
            ? `32 Character Consistency workflows` 
            : `${workflows.length} professional workflows`}
        </p>
      </div>
      
      {/* Simple Mobile Filters */}
      <div className="px-4 py-3 bg-base-200 border-b border-base-300">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => {
              setActiveFilter('all');
              setShowCharacterConsistency(false);
            }}
            className={`btn btn-sm ${activeFilter === 'all' && !showCharacterConsistency ? 'btn-primary' : 'btn-ghost'} whitespace-nowrap`}
          >
            All
          </button>
          <button
            onClick={() => {
              setActiveFilter('beginner');
              setShowCharacterConsistency(false);
            }}
            className={`btn btn-sm ${activeFilter === 'beginner' && !showCharacterConsistency ? 'btn-primary' : 'btn-ghost'} whitespace-nowrap`}
          >
            🟢 Beginner
          </button>
          <button
            onClick={() => {
              setActiveFilter('fast');
              setShowCharacterConsistency(false);
            }}
            className={`btn btn-sm ${activeFilter === 'fast' && !showCharacterConsistency ? 'btn-primary' : 'btn-ghost'} whitespace-nowrap`}
          >
            ⚡ Fast & Budget
          </button>
        </div>
        
        {/* Character Consistency Toggle */}
        <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              checked={showCharacterConsistency}
              onChange={(e) => {
                const checked = e.target.checked;
                setShowCharacterConsistency(checked);
                trackWorkflowFilter({
                  filterType: 'character_consistency_toggle',
                  value: checked ? 'enabled' : 'disabled',
                  resultCount: workflows.length,
                  userId: user?.id,
                });
              }}
              className="checkbox checkbox-sm checkbox-primary"
              id="char-consistency-toggle"
            />
          <label htmlFor="char-consistency-toggle" className="text-sm cursor-pointer">
            🎭 Character Consistency Only (32)
          </label>
        </div>
        
        {/* Explanation when toggled */}
        {showCharacterConsistency && (
          <div className="alert alert-info mt-2 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="text-xs">
              <strong>18 workflows</strong> work from text (add images later) + <strong>14 require</strong> images from the start
            </p>
          </div>
        )}
      </div>
      
      {/* Workflows Grid */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {state.messages.filter(m => m.mode === 'scene-visualizer').length > 0 ? (
          /* Messages Area */
          <div className="space-y-4">
            {state.messages
              .filter(m => m.mode === 'scene-visualizer')
              .map((message, index) => {
                const isUser = message.role === 'user';
                
                return (
                  <div
                    key={index}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-lg px-4 py-3 ${
                      isUser 
                        ? 'bg-cinema-red text-base-content' 
                        : 'bg-base-200 text-base-content'
                    }`}>
                      <div className="whitespace-pre-wrap break-words prose prose-sm max-w-none">
                        {message.content}
                      </div>
                    </div>
                  </div>
                );
              })}
            
            {isGenerating && (
              <div className="flex justify-start">
                <div className="bg-base-200 px-4 py-3 rounded-lg flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-cinema-blue" />
                  <span className="text-sm">Loading workflow details...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Workflow Grid */
          loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-cinema-blue" />
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center text-base-content/60 py-6">
              <Sparkles className="w-12 h-12 mx-auto mb-2 text-cinema-gold" />
              <p className="text-sm font-semibold">No workflows found</p>
              <p className="text-xs mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {workflows.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  compact={true}
                  onClick={handleWorkflowSelect}
                />
              ))}
            </div>
          )
        )}
      </div>
      
      {/* Info footer */}
      <div className="px-4 py-2 border-t border-base-300 text-xs text-base-content/60">
        <p>
          💡 Tap any workflow for details • {workflows.length} workflows shown
        </p>
      </div>
    </div>
  );
}

export default SceneVisualizerModePanel;
