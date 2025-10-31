/**
 * Animation Selector - Choose animated composition templates
 * Visual representation of motion graphics patterns
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Check } from 'lucide-react';

interface AnimationOption {
  id: string;
  name: string;
  description: string;
  duration: number;
  complexity: 'simple' | 'moderate' | 'complex';
  best_for: string[];
  example_use_case: string;
}

interface AnimationSelectorProps {
  selectedAnimation: string | null;
  onSelectAnimation: (animationId: string) => void;
}

export function AnimationSelector({ selectedAnimation, onSelectAnimation }: AnimationSelectorProps) {
  const [animations, setAnimations] = useState<AnimationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchAnimations();
  }, []);

  const fetchAnimations = async () => {
    try {
      const response = await fetch('/api/composition/animations');
      const data = await response.json();
      setAnimations(data.animations || []);
    } catch (error) {
      console.error('Failed to fetch animations:', error);
    } finally {
      setLoading(false);
    }
  };

  const complexityLevels = [
    { id: 'all', label: 'All Animations', emoji: '✨' },
    { id: 'simple', label: 'Simple', emoji: '🟢' },
    { id: 'moderate', label: 'Moderate', emoji: '🟡' },
    { id: 'complex', label: 'Complex', emoji: '🔴' },
  ];

  const filteredAnimations = animations.filter(animation => {
    if (filter === 'all') return true;
    return animation.complexity === filter;
  });

  const renderAnimationPreview = (animation: AnimationOption) => {
    // Simplified animation preview
    return (
      <div className="w-full h-24 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-12 h-12 text-yellow-600 dark:text-yellow-400 opacity-30 animate-pulse" />
        </div>
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 z-10">
          {animation.duration}s animation
        </span>
      </div>
    );
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
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          Choose Animation Style
        </CardTitle>
        <CardDescription>Select a motion graphics template</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Complexity Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {complexityLevels.map((level) => (
            <Button
              key={level.id}
              variant="outline"
              size="sm"
              className={`border-2 transition-all ${
                filter === level.id 
                  ? 'bg-yellow-400 text-black border-yellow-500 hover:bg-yellow-500' 
                  : 'border-slate-200 dark:border-slate-700 hover:border-yellow-400'
              }`}
              onClick={() => setFilter(level.id)}
            >
              <span className="mr-1.5">{level.emoji}</span>
              {level.label}
            </Button>
          ))}
        </div>

        {/* Animation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAnimations.map((animation) => {
            const isSelected = selectedAnimation === animation.id;

            return (
              <div
                key={animation.id}
                className="relative group cursor-pointer transition-all"
                onClick={() => onSelectAnimation(animation.id)}
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
                        ? 'bg-yellow-100 dark:bg-yellow-900/20' 
                        : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                    }`}>
                      {renderAnimationPreview(animation)}
                    </div>

                    {/* Info */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{animation.name}</h3>
                        {isSelected && (
                          <div className="flex-shrink-0 p-1 bg-yellow-400 rounded-full">
                            <Check className="w-3 h-3 text-black" />
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{animation.description}</p>
                      
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-700 dark:text-yellow-400">
                          {animation.duration}s
                        </Badge>
                        <Badge variant="secondary" className="text-xs bg-slate-200 dark:bg-slate-700">
                          {animation.complexity}
                        </Badge>
                        {animation.best_for.slice(0, 1).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs bg-slate-200 dark:bg-slate-700">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {filteredAnimations.length === 0 && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            No animations found for this complexity level
          </div>
        )}
      </CardContent>
    </Card>
  );
}

