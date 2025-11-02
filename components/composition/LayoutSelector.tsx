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

// Default layouts fallback when API is unavailable
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
    name: '2x2 Grid',
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

  useEffect(() => {
    fetchLayouts();
  }, []);

  const fetchLayouts = async () => {
    try {
      const response = await fetch('/api/composition/layouts');
      if (!response.ok) throw new Error('API not available');
      const data = await response.json();
      setLayouts(data.layouts || []);
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

  // NEW: Feature 0068 - Mobile-allowed layouts
  const MOBILE_ALLOWED_LAYOUTS = ['2x2-grid', 'picture-in-picture', 'side-by-side'];

  const filteredLayouts = layouts.filter(layout => {
    // First apply category filter
    if (filter !== 'all' && !layout.best_for.some(tag => tag.includes(filter))) {
      return false;
    }
    
    // Then apply mobile filter if needed (Feature 0068)
    if (isMobile && !MOBILE_ALLOWED_LAYOUTS.includes(layout.id)) {
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
      <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
      <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
          <div className="p-1.5 bg-yellow-400 rounded">
            <Layout className="w-4 h-4 text-black" />
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
                  ? 'bg-yellow-400 text-black border-yellow-500 hover:bg-yellow-500' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-yellow-400'
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
                    ? 'border-yellow-500 shadow-lg shadow-yellow-500/20 bg-yellow-50 dark:bg-yellow-900/10' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-yellow-400 bg-slate-50 dark:bg-slate-900'
                }`}>
                  <CardContent className="p-4">
                    {/* Preview */}
                    <div className={`rounded-lg p-4 mb-3 transition-colors ${
                      isSelected 
                        ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                    }`}>
                      {renderLayoutPreview(layout)}
                    </div>

                    {/* Info */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{layout.name}</h3>
                        {isSelected && (
                          <div className="flex-shrink-0 p-1 bg-yellow-400 rounded-full">
                            <Check className="w-3 h-3 text-black" />
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
        
        {/* Mobile restriction message - Feature 0068 */}
        {isMobile && filteredLayouts.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-500 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              💻 <strong>Desktop Only:</strong> Advanced layouts available on desktop (9 more)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

