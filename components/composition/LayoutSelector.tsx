/**
 * Layout Selector - Visual grid of cinematic layouts
 * Shows preview cards with interactive hover effects
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layout, Check, Lock } from 'lucide-react';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';

interface LayoutOption {
  id: string;
  name: string;
  description: string;
  num_regions: number;
  canvas: { width: number; height: number };
  best_for: string[];
  example_use_case: string;
  recommended_aspect_ratios: string[];
  thumbnail?: string;
  unlockLevel?: number;
}

// Default layouts fallback when API is unavailable - EXPANDED SET
const DEFAULT_LAYOUTS: LayoutOption[] = [
  {
    id: 'side-by-side',
    name: 'Side by Side',
    description: 'Two videos side-by-side',
    num_regions: 2,
    canvas: { width: 1920, height: 1080 },
    best_for: ['split-screen', 'comparison'],
    example_use_case: 'Compare two perspectives',
    recommended_aspect_ratios: ['16:9']
  },
  {
    id: 'picture-in-picture',
    name: 'Picture-in-Picture',
    description: 'Small video overlaid on main video',
    num_regions: 2,
    canvas: { width: 1920, height: 1080 },
    best_for: ['pip', 'reactions'],
    example_use_case: 'Reaction videos',
    recommended_aspect_ratios: ['16:9']
  },
  {
    id: '2x2-grid',
    name: '2×2 Grid',
    description: 'Four videos in a grid',
    num_regions: 4,
    canvas: { width: 1920, height: 1080 },
    best_for: ['grid', 'phone-call'],
    example_use_case: 'Video conference call',
    recommended_aspect_ratios: ['16:9']
  },
  {
    id: 'phone-call-3way',
    name: '3-Way Call',
    description: 'Three vertical videos',
    num_regions: 3,
    canvas: { width: 1920, height: 1080 },
    best_for: ['phone-call', 'mobile'],
    example_use_case: 'Mobile phone conversation',
    recommended_aspect_ratios: ['16:9', '9:16']
  },
  {
    id: 'top-bottom-split',
    name: 'Top/Bottom Split',
    description: 'Two videos stacked vertically',
    num_regions: 2,
    canvas: { width: 1920, height: 1080 },
    best_for: ['comparison', 'split-screen'],
    example_use_case: 'Before and after comparison',
    recommended_aspect_ratios: ['16:9']
  },
  {
    id: '3x3-grid',
    name: '3×3 Grid',
    description: 'Nine videos in a grid',
    num_regions: 9,
    canvas: { width: 1920, height: 1080 },
    best_for: ['grid', 'mosaic'],
    example_use_case: 'Large group call or mosaic',
    recommended_aspect_ratios: ['16:9']
  },
  {
    id: 'triple-vertical',
    name: 'Triple Vertical',
    description: 'Three videos in vertical layout',
    num_regions: 3,
    canvas: { width: 1080, height: 1920 },
    best_for: ['social-media', 'mobile'],
    example_use_case: 'TikTok-style layout',
    recommended_aspect_ratios: ['9:16']
  },
  {
    id: 'quad-split',
    name: 'Quad Split',
    description: 'Four videos, one in each corner',
    num_regions: 4,
    canvas: { width: 1920, height: 1080 },
    best_for: ['surveillance', 'multi-angle'],
    example_use_case: 'Security camera view',
    recommended_aspect_ratios: ['16:9']
  },
  {
    id: 'l-shape',
    name: 'L-Shape Layout',
    description: 'Large video with sidebar',
    num_regions: 4,
    canvas: { width: 1920, height: 1080 },
    best_for: ['presentation', 'gaming'],
    example_use_case: 'Main content with sidebar',
    recommended_aspect_ratios: ['16:9']
  },
  {
    id: 'picture-in-picture-corner',
    name: 'Corner PiP',
    description: 'Small video in any corner',
    num_regions: 2,
    canvas: { width: 1920, height: 1080 },
    best_for: ['reaction', 'commentary'],
    example_use_case: 'Streamer reaction overlay',
    recommended_aspect_ratios: ['16:9']
  },
  {
    id: 'horizontal-strip',
    name: 'Horizontal Strip',
    description: 'Three videos in a row',
    num_regions: 3,
    canvas: { width: 1920, height: 1080 },
    best_for: ['timeline', 'sequence'],
    example_use_case: 'Step-by-step tutorial',
    recommended_aspect_ratios: ['16:9']
  },
  {
    id: 'vertical-strip',
    name: 'Vertical Strip',
    description: 'Three videos stacked',
    num_regions: 3,
    canvas: { width: 1920, height: 1080 },
    best_for: ['comparison', 'progression'],
    example_use_case: 'Timeline progression',
    recommended_aspect_ratios: ['16:9']
  },
  {
    id: 'spotlight-grid',
    name: 'Spotlight Grid',
    description: 'Large main video with thumbnail grid',
    num_regions: 7,
    canvas: { width: 1920, height: 1080 },
    best_for: ['presentation', 'meeting'],
    example_use_case: 'Video conference with speaker focus',
    recommended_aspect_ratios: ['16:9']
  },
  {
    id: 'dual-pip',
    name: 'Dual Picture-in-Picture',
    description: 'Two small videos over main video',
    num_regions: 3,
    canvas: { width: 1920, height: 1080 },
    best_for: ['reaction', 'commentary'],
    example_use_case: 'Two commentators reacting',
    recommended_aspect_ratios: ['16:9']
  }
];

interface LayoutSelectorProps {
  selectedLayout: string | null;
  onSelectLayout: (layoutId: string) => void;
  userLevel?: number;
  isMobile?: boolean; // NEW: Feature 0068
}

export function LayoutSelector({ selectedLayout, onSelectLayout, userLevel = 1, isMobile = false }: LayoutSelectorProps) {
  const [layouts, setLayouts] = useState<LayoutOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const authFetch = useAuthenticatedFetch();

  // Wait for auth to be ready before fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLayouts();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const fetchLayouts = async () => {
    try {
      const response = await authFetch('/api/composition/layouts');
      if (!response.ok) throw new Error('API not available');
      const data = await response.json();
      // Backend sendSuccess wraps data: { success: true, data: { layouts: [...] } }
      setLayouts(data.data?.layouts || data.layouts || []);
    } catch (error) {
      console.error('Failed to fetch layouts, using defaults:', error);
      // Fallback to default layouts
      setLayouts(DEFAULT_LAYOUTS);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Layouts', icon: '🎬' },
    { id: 'phone-call', label: 'Phone Calls', icon: '📱' },
    { id: 'split-screen', label: 'Split Screen', icon: '⚡' },
    { id: 'pip', label: 'Picture-in-Picture', icon: '📺' },
    { id: 'grid', label: 'Grids', icon: '⬜' },
  ];

  // Feature 0068 - Mobile gets ALL layouts now (removed restriction for mobile testing)
  // Mobile users should have access to all 65+ compositions including music video, podcast, etc.
  const filteredLayouts = layouts.filter(layout => {
    // Apply category filter only
    if (filter !== 'all' && !layout.best_for.some(tag => tag.includes(filter))) {
      return false;
    }
    
    return true;
  });

  const renderLayoutPreview = (layout: LayoutOption) => {
    // Simple SVG representation of the layout
    const regions = layout.num_regions;
    
    if (layout.id.includes('phone-call-3way')) {
      return (
        <svg viewBox="0 0 192 108" className="w-full h-24">
          <rect x="2" y="2" width="60" height="104" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1"/>
          <rect x="66" y="2" width="60" height="104" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1"/>
          <rect x="130" y="2" width="60" height="104" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1"/>
        </svg>
      );
    } else if (layout.id.includes('split-screen')) {
      return (
        <svg viewBox="0 0 192 108" className="w-full h-24">
          <rect x="2" y="2" width="92" height="104" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1"/>
          <rect x="98" y="2" width="92" height="104" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1"/>
        </svg>
      );
    } else if (layout.id.includes('pip')) {
      return (
        <svg viewBox="0 0 192 108" className="w-full h-24">
          <rect x="2" y="2" width="188" height="104" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1"/>
          <rect x="130" y="70" width="58" height="34" fill="currentColor" opacity="0.5" stroke="currentColor" strokeWidth="2"/>
        </svg>
      );
    } else if (layout.id.includes('grid')) {
      return (
        <svg viewBox="0 0 192 108" className="w-full h-24">
          <rect x="2" y="2" width="92" height="50" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1"/>
          <rect x="98" y="2" width="92" height="50" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1"/>
          <rect x="2" y="56" width="92" height="50" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1"/>
          <rect x="98" y="56" width="92" height="50" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1"/>
        </svg>
      );
    } else {
      return (
        <svg viewBox="0 0 192 108" className="w-full h-24">
          <rect x="2" y="2" width="188" height="104" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1"/>
        </svg>
      );
    }
  };

  const isLayoutLocked = (layout: LayoutOption) => {
    return layout.unlockLevel && layout.unlockLevel > userLevel;
  };

  if (loading) {
    return (
      <Card className="bg-[#141414] border border-slate-700 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DC143C]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // MOBILE: Compact dropdown selector
  if (isMobile) {
    const selectedLayoutData = layouts.find(l => l.id === selectedLayout);
    
    return (
      <Card className="bg-[#141414] border border-slate-700 shadow-lg">
        <CardHeader className="border-b border-slate-700 bg-[#1F1F1F] py-3">
          <CardTitle className="flex items-center gap-2 text-base text-slate-200">
            <div className="p-1 bg-[#DC143C] rounded">
              <Layout className="w-3 h-3 text-white" />
            </div>
            Choose Layout
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 pb-4">
          {/* Compact Layout Dropdown */}
          <div className="space-y-3">
            <select
              value={selectedLayout || ''}
              onChange={(e) => onSelectLayout(e.target.value)}
              className="w-full px-3 py-2 text-sm border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-base-content focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-colors"
            >
              <option value="">Select a layout...</option>
              {filteredLayouts.map((layout) => {
                const isLocked = isLayoutLocked(layout);
                return (
                  <option 
                    key={layout.id} 
                    value={layout.id}
                    disabled={isLocked}
                  >
                    {layout.name} ({layout.num_regions} videos) {isLocked ? '🔒' : ''}
                  </option>
                );
              })}
            </select>

            {/* Selected Layout Preview */}
            {selectedLayoutData && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 border-2 border-yellow-400 rounded-lg">
                <div className="flex items-start gap-3">
                  {/* Small Preview */}
                  <div className="flex-shrink-0 w-16 h-12 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded p-1">
                    {renderLayoutPreview(selectedLayoutData)}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-1">
                      <Check className="w-3 h-3 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                      <h4 className="font-semibold text-xs text-slate-900 dark:text-base-content">
                        {selectedLayoutData.name}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {selectedLayoutData.description}
                    </p>
                    <div className="flex gap-1 mt-1.5">
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-yellow-400 text-yellow-700 dark:text-yellow-400">
                        {selectedLayoutData.num_regions} videos
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Category Quick Filters (Mobile-friendly) */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`px-2 py-1 text-xs rounded-full whitespace-nowrap border transition-colors flex-shrink-0 ${
                    filter === category.id 
                    ? 'bg-[#DC143C] text-white border-[#DC143C]' 
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                  onClick={() => setFilter(category.id)}
                >
                  {category.icon} {category.label}
                </button>
              ))}
            </div>

            {/* Mobile Info Message */}
            <div className="p-2.5 bg-[#DC143C]/10 border border-[#DC143C]/30 rounded-lg">
              <p className="text-xs text-[#DC143C]">
                💻 Desktop has {layouts.length - filteredLayouts.length} more advanced layouts
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // DESKTOP: Full grid layout selector
  return (
    <Card className="bg-[#141414] border border-slate-700 shadow-lg">
      <CardHeader className="border-b border-slate-700 bg-[#1F1F1F]">
        <CardTitle className="flex items-center gap-2 text-slate-200">
          <div className="p-1.5 bg-[#DC143C] rounded">
            <Layout className="w-4 h-4 text-white" />
          </div>
          Choose Your Layout
        </CardTitle>
        <CardDescription>Select a cinematic composition style</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant="outline"
              size="sm"
              className={`border-2 transition-all ${
                filter === category.id 
                  ? 'bg-[#DC143C] text-white border-[#DC143C] hover:bg-[#B91238]' 
                  : 'border-slate-700 hover:border-[#DC143C]'
              }`}
              onClick={() => setFilter(category.id)}
            >
              <span className="mr-1.5">{category.icon}</span>
              {category.label}
            </Button>
          ))}
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLayouts.map((layout) => {
            const isLocked = isLayoutLocked(layout);
            const isSelected = selectedLayout === layout.id;

            return (
              <div
                key={layout.id}
                className={`relative group cursor-pointer transition-all ${
                  isLocked ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => !isLocked && onSelectLayout(layout.id)}
              >
                <Card className={`transition-all border-2 ${
                  isSelected 
                    ? 'border-[#DC143C] shadow-lg shadow-[#DC143C]/20 bg-[#1F1F1F]' 
                    : 'border-slate-700 hover:border-[#DC143C] bg-[#141414] hover:bg-[#1A1A1A]'
                }`}>
                  <CardContent className="p-4">
                    {/* Preview */}
                    <div className={`rounded-lg p-4 mb-3 transition-colors ${
                      isSelected 
                        ? 'bg-[#DC143C]/20 text-[#DC143C]' 
                        : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                    }`}>
                      {renderLayoutPreview(layout)}
                    </div>

                    {/* Info */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-slate-200">{layout.name}</h3>
                        {isSelected && (
                          <div className="flex-shrink-0 p-1 bg-[#DC143C] rounded-full">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {isLocked && (
                          <Lock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        )}
                      </div>
                      
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{layout.description}</p>
                      
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-700 dark:text-yellow-400">
                          {layout.num_regions} videos
                        </Badge>
                        {layout.best_for.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs bg-slate-200 dark:bg-slate-700">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {isLocked && (
                        <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                          <Lock className="w-3 h-3" />
                          Unlock at Level {layout.unlockLevel}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {filteredLayouts.length === 0 && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            No layouts found for this category
          </div>
        )}
      </CardContent>
    </Card>
  );
}

