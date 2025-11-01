'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, X, Info } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import WorkflowCard from '@/components/workflows/WorkflowCard';
import {
  getAllWorkflows,
  getCharacterConsistencyWorkflows,
  getWorkflowsByInputType,
  getWorkflowsByLevel,
  searchWorkflows,
} from '@/lib/workflowMetadata';
import {
  trackWorkflowDiscovery,
  trackWorkflowSelection,
  trackWorkflowFilter,
  trackWorkflowSearch,
} from '@/lib/workflowAnalytics';

/**
 * Desktop Workflows Browse Page
 * 
 * Features:
 * - Full filtering system (input type, action, experience level)
 * - Category tabs including Character Consistency tab (32 workflows)
 * - Subtabs for Optional (18) vs Required (14)
 * - Search functionality
 * - Desktop-optimized grid layout
 */
export default function WorkflowsPage() {
  const { user } = useUser();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [characterConsistencyType, setCharacterConsistencyType] = useState('all'); // 'all', 'optional', 'required'
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    inputType: null,
    experienceLevel: null,
    action: null,
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Track page view on mount
  useEffect(() => {
    trackWorkflowDiscovery({
      source: 'navigation',
      workflowCount: 51,
      category: 'all',
      userId: user?.id,
    });
  }, [user]);

  // Load workflows on mount and when filters change
  useEffect(() => {
    loadWorkflows();
  }, [activeCategory, characterConsistencyType, allWorkflowsType, filters, searchQuery]);

  function loadWorkflows() {
    setLoading(true);
    let result = [];

    // Handle Character Consistency category
    if (activeCategory === 'character-consistency') {
      result = getCharacterConsistencyWorkflows(characterConsistencyType);
    } else if (activeCategory === 'all') {
      // Handle All Workflows subcategories
      if (allWorkflowsType === 'all-all') {
        result = getAllWorkflows();
      } else {
        // Filter by category based on categoryOrder
        const categoryMap = {
          'photorealistic': 1,
          'animated': 2,
          'fantasy-vfx': 4,
          'animals': 5,
          'budget-speed': 6,
          'production-tools': 7,
          'performance-capture': 8,
          'video-enhancement': 9,
        };
        const categoryOrder = categoryMap[allWorkflowsType];
        if (categoryOrder) {
          result = getAllWorkflows().filter(w => w.categoryOrder === categoryOrder);
        } else {
          result = getAllWorkflows();
        }
      }
    } else if (activeCategory === 'text-only') {
      result = getWorkflowsByInputType('text-only');
    } else if (activeCategory === 'text-with-images') {
      result = getWorkflowsByInputType('text-with-images');
    } else if (activeCategory === 'video-transform') {
      result = getWorkflowsByInputType('video-transform');
    }

    // Sort by subcategoryOrder (most viral/sellable first)
    result = result.sort((a, b) => (a.subcategoryOrder || 999) - (b.subcategoryOrder || 999));

    // Apply additional filters
    if (filters.experienceLevel) {
      result = result.filter(w => w.experienceLevel === filters.experienceLevel);
    }
    
    if (filters.action) {
      result = result.filter(w => w.action === filters.action);
    }

    // Apply search
    if (searchQuery.trim()) {
      const searched = searchWorkflows(searchQuery);
      result = result.filter(w => searched.some(s => s.id === w.id));
      
      // Track search
      trackWorkflowSearch({
        query: searchQuery,
        resultCount: result.length,
        userId: user?.id,
      });
    }

    setWorkflows(result);
    setLoading(false);
  }
  
  function handleCategoryChange(categoryId) {
    setActiveCategory(categoryId);
    if (categoryId !== 'character-consistency') {
      setCharacterConsistencyType('all');
    }
    if (categoryId !== 'all') {
      setAllWorkflowsType('all-all');
    }
    
    // Track filter change
    trackWorkflowFilter({
      filterType: 'category',
      value: categoryId,
      resultCount: workflows.length,
      userId: user?.id,
    });
  }
  
  function handleFilterChange(filterType, value) {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? null : value,
    }));
    
    // Track filter change
    trackWorkflowFilter({
      filterType,
      value: value || 'cleared',
      resultCount: workflows.length,
      userId: user?.id,
    });
  }
  
  function handleWorkflowClick(workflow) {
    trackWorkflowSelection(workflow, {
      source: 'desktop',
      userId: user?.id,
    });
    
    // Start workflow execution
    executeWorkflow(workflow);
  }
  
  const executeWorkflow = async (workflow) => {
    try {
      toast.loading(`Starting ${workflow.name}...`);
      
      const response = await api.workflows.execute({
        workflowId: workflow.id,
        userId: user?.id,
      });
      
      toast.dismiss();
      toast.success(`${workflow.name} started!`);
      
      // Redirect to appropriate page based on workflow type
      if (workflow.inputType === 'text-only') {
        window.location.href = '/production';
      } else if (workflow.inputType === 'text-with-images') {
        window.location.href = '/production?mode=image-start';
      } else if (workflow.inputType === 'video-transform') {
        window.location.href = '/composition';
      }
    } catch (error) {
      console.error('Workflow execution failed:', error);
      toast.dismiss();
      toast.error('Failed to start workflow');
    }
  };

  function clearFilters() {
    setFilters({
      inputType: null,
      experienceLevel: null,
      action: null,
    });
    setSearchQuery('');
    setActiveCategory('all');
    setCharacterConsistencyType('all');
    setAllWorkflowsType('all-all');
  }

  const categories = [
    { id: 'all', name: 'All Workflows', icon: '🎬', count: 51 },
    { id: 'character-consistency', name: 'Character Consistency', icon: '🎭', count: 32 },
    { id: 'text-only', name: 'Text Only', icon: '✍️', count: 18 },
    { id: 'text-with-images', name: 'Text + Images', icon: '🖼️', count: 14 },
    { id: 'video-transform', name: 'Video Transform', icon: '🎥', count: 13 },
  ];

  // All Workflows subcategories - organized by workflow type
  const allWorkflowsSubcategories = [
    { id: 'all-all', name: 'All', count: 51 },
    { id: 'photorealistic', name: 'Photorealistic', count: 6, icon: '🎥' },
    { id: 'animated', name: 'Animated Styles', count: 3, icon: '🎨' },
    { id: 'fantasy-vfx', name: 'Fantasy & VFX', count: 2, icon: '✨' },
    { id: 'animals', name: 'Animals & Creatures', count: 2, icon: '🦁' },
    { id: 'budget-speed', name: 'Budget & Speed', count: 6, icon: '⚡' },
    { id: 'production-tools', name: 'Production Tools', count: 9, icon: '🎬' },
    { id: 'performance-capture', name: 'Performance Capture', count: 12, icon: '🎭' },
    { id: 'video-enhancement', name: 'Video Enhancement', count: 5, icon: '✨' },
  ];

  const [allWorkflowsType, setAllWorkflowsType] = useState('all-all');

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-base-100 border-b border-base-300">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                AI Workflows
              </h1>
              <p className="text-lg opacity-70">
                58 professional workflows organized by what you have, what you want, and where you are
              </p>
            </div>
            <Link href="/help/workflows" className="btn btn-outline gap-2">
              <Info className="w-4 h-4" />
              Learn More
            </Link>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-base-100 border-b border-base-300 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 py-4 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`btn btn-sm whitespace-nowrap ${
                  activeCategory === cat.id ? 'btn-primary' : 'btn-ghost'
                }`}
              >
                {cat.icon} {cat.name} ({cat.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* All Workflows Subtabs */}
      {activeCategory === 'all' && (
        <div className="bg-base-200 border-b border-base-300">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex gap-2 flex-wrap">
              {allWorkflowsSubcategories.map(subcat => (
                <button
                  key={subcat.id}
                  onClick={() => setAllWorkflowsType(subcat.id)}
                  className={`btn btn-sm ${allWorkflowsType === subcat.id ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {subcat.icon && `${subcat.icon} `}{subcat.name} ({subcat.count})
                </button>
              ))}
            </div>
            
            {/* Explanation Box */}
            <div className="alert alert-info mt-3">
              <Info className="w-5 h-5" />
              <div className="text-sm">
                {allWorkflowsType === 'all-all' && (
                  <p><strong>58 professional workflows</strong> organized by category: Photorealistic (6), Animated (3), Fantasy/VFX (2), Animals (2), Budget/Speed (6), Production Tools (9), Performance Capture (8), Video Enhancement (5), Post-Production HDR (7), Hybrid/Audio (10).</p>
                )}
                {allWorkflowsType === 'photorealistic' && (
                  <p><strong>Photorealistic / Live-Action (6):</strong> Hollywood-grade video production. From budget-friendly to cinema-quality, these workflows create ultra-realistic characters and scenes.</p>
                )}
                {allWorkflowsType === 'animated' && (
                  <p><strong>Animated Styles (3):</strong> Anime, Western cartoon, and Pixar-quality 3D animation. Perfect for animation creators and storytellers.</p>
                )}
                {allWorkflowsType === 'fantasy-vfx' && (
                  <p><strong>Fantasy & VFX (2):</strong> Magical worlds, mythical creatures, and superhero transformations. Create immersive fantasy content with VFX-level quality.</p>
                )}
                {allWorkflowsType === 'animals' && (
                  <p><strong>Animals & Creatures (2):</strong> Realistic wildlife and anthropomorphic characters. From documentary-quality animals to talking animal characters.</p>
                )}
                {allWorkflowsType === 'budget-speed' && (
                  <p><strong>Budget & Speed (6):</strong> Ultra-fast generation and perfect loops optimized for social media. Create high-volume content without breaking the bank.</p>
                )}
                {allWorkflowsType === 'production-tools' && (
                  <p><strong>Production Tools (9):</strong> Professional coverage, B-roll packages, multi-angle shots, and complete production workflows. Industry-standard tools for serious creators.</p>
                )}
                {allWorkflowsType === 'performance-capture' && (
                  <p><strong>Performance Capture (12):</strong> 🔥 NEW! AI Avatar (voice cloning), Image to Speech (make any image talk), Podcast to Video (audio → YouTube), Multilingual Dubbing (speak every language) + &quot;Be the Character&quot; performance capture workflows. Upload performances, clone voices, animate photos, and transform yourself into any style!</p>
                )}
                {allWorkflowsType === 'video-enhancement' && (
                  <p><strong>Video Enhancement (5):</strong> Transform existing footage with VFX, style changes, element removal, product reshoots, and photo animation. Hollywood effects for your footage.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Character Consistency Subtabs */}
      {activeCategory === 'character-consistency' && (
        <div className="bg-base-200 border-b border-base-300">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setCharacterConsistencyType('all')}
                className={`btn btn-sm ${characterConsistencyType === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              >
                All (32)
              </button>
              <button
                onClick={() => setCharacterConsistencyType('optional')}
                className={`btn btn-sm ${characterConsistencyType === 'optional' ? 'btn-primary' : 'btn-ghost'}`}
              >
                💡 Optional (18)
              </button>
              <button
                onClick={() => setCharacterConsistencyType('required')}
                className={`btn btn-sm ${characterConsistencyType === 'required' ? 'btn-primary' : 'btn-ghost'}`}
              >
                ⚠️ Required (14)
              </button>
            </div>
            
            {/* Explanation Box */}
            <div className="alert alert-info mt-3">
              <Info className="w-5 h-5" />
              <div className="text-sm">
                {characterConsistencyType === 'all' && (
                  <p><strong>32 workflows support Character Consistency:</strong> 18 work from text alone (add Character Bank later) + 14 require Character Bank images from the start.</p>
                )}
                {characterConsistencyType === 'optional' && (
                  <p><strong>Optional Character Bank (18):</strong> These work from text descriptions only. Add 1-2 Character Bank images anytime for consistent characters across multiple generations.</p>
                )}
                {characterConsistencyType === 'required' && (
                  <p><strong>Required Character Bank (14):</strong> These require 1-2 character images (or 3 for advanced) before you start. Perfect for series with consistent characters.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-32">
              <div className="card bg-base-100 border border-base-300">
                <div className="card-body">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filters
                  </h3>

                  {/* Search */}
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text font-semibold">Search</span>
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 opacity-50" />
                      <input
                        type="text"
                        placeholder="Search workflows..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input input-bordered w-full pl-10"
                      />
                    </div>
                  </div>

                  {/* Experience Level */}
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text font-semibold">Experience Level</span>
                    </label>
                    <div className="space-y-2">
                      {['beginner', 'intermediate', 'advanced'].map(level => (
                        <label key={level} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="level"
                            checked={filters.experienceLevel === level}
                            onChange={() => handleFilterChange('experienceLevel', level)}
                            className="radio radio-sm radio-primary"
                          />
                          <span className="text-sm capitalize">
                            {level === 'beginner' && '🟢'} 
                            {level === 'intermediate' && '🟡'} 
                            {level === 'advanced' && '🔴'} 
                            {' '}{level}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Action Type */}
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text font-semibold">Action</span>
                    </label>
                    <div className="space-y-2">
                      {['create', 'multi-output', 'extend', 'transform'].map(action => (
                        <label key={action} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="action"
                            checked={filters.action === action}
                            onChange={() => handleFilterChange('action', action)}
                            className="radio radio-sm radio-primary"
                          />
                          <span className="text-sm capitalize">{action}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Clear Filters */}
                  {(filters.experienceLevel || filters.action || searchQuery) && (
                    <button
                      onClick={clearFilters}
                      className="btn btn-ghost btn-sm w-full gap-2"
                    >
                      <X className="w-4 h-4" />
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {/* Info Card */}
              <div className="card bg-base-100 border border-base-300 mt-4">
                <div className="card-body">
                  <h3 className="font-bold text-sm mb-2">💡 Quick Tip</h3>
                  <p className="text-xs opacity-70">
                    Start with <strong>Beginner</strong> workflows if you&apos;re new. They require minimal setup and deliver great results!
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Workflows Grid */}
          <div className="lg:col-span-3">
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 opacity-50" />
                <input
                  type="text"
                  placeholder="Search workflows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input input-bordered w-full pl-10"
                />
              </div>
              <button
                onClick={() => setShowMobileFilters(true)}
                className="btn btn-outline gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>

            {/* Results Count */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm opacity-70">
                Showing <strong>{workflows.length}</strong> workflows
              </p>
              {(filters.experienceLevel || filters.action || searchQuery) && (
                <button
                  onClick={clearFilters}
                  className="btn btn-ghost btn-xs gap-2"
                >
                  <X className="w-3 h-3" />
                  Clear Filters
                </button>
              )}
            </div>

            {/* Workflows Grid */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            ) : workflows.length === 0 ? (
              <div className="card bg-base-100 border border-base-300">
                <div className="card-body text-center py-12">
                  <Search className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-xl font-bold mb-2">No workflows found</h3>
                  <p className="opacity-70 mb-4">Try adjusting your filters or search terms</p>
                  <button onClick={clearFilters} className="btn btn-primary btn-sm">
                    Clear All Filters
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workflows.map(workflow => (
                  <WorkflowCard
                    key={workflow.id}
                    workflow={workflow}
                    helpLink="/help/workflows"
                    onClick={() => handleWorkflowClick(workflow)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setShowMobileFilters(false)}>
          <div
            className="absolute inset-x-0 bottom-0 bg-base-100 rounded-t-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-base-100 border-b border-base-300 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                <h3 className="font-bold">Filters</h3>
              </div>
              <button onClick={() => setShowMobileFilters(false)} className="btn btn-ghost btn-sm btn-circle">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Options */}
            <div className="p-4 space-y-4">
              {/* Experience Level */}
              <div>
                <label className="text-sm font-bold mb-2 block">Experience Level</label>
                <div className="space-y-2">
                  {['beginner', 'intermediate', 'advanced'].map(level => (
                    <label key={level} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="mobile-level"
                        checked={filters.experienceLevel === level}
                        onChange={() => setFilters({ ...filters, experienceLevel: level })}
                        className="radio radio-sm"
                      />
                      <span className="capitalize">
                        {level === 'beginner' && '🟢'} 
                        {level === 'intermediate' && '🟡'} 
                        {level === 'advanced' && '🔴'} 
                        {' '}{level}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Type */}
              <div>
                <label className="text-sm font-bold mb-2 block">Action</label>
                <div className="space-y-2">
                  {['create', 'multi-output', 'extend', 'transform'].map(action => (
                    <label key={action} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="mobile-action"
                        checked={filters.action === action}
                        onChange={() => setFilters({ ...filters, action })}
                        className="radio radio-sm"
                      />
                      <span className="capitalize">{action}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-base-100 border-t border-base-300 p-4 flex gap-2">
              <button
                onClick={() => {
                  clearFilters();
                  setShowMobileFilters(false);
                }}
                className="btn btn-ghost flex-1"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="btn btn-primary flex-1"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

