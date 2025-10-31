/**
 * Pacing Selector - Choose emotional rhythm for your composition
 * Visual representation of clip duration patterns
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Check } from 'lucide-react';

interface PacingOption {
  id: string;
  name: string;
  description: string;
  clip_pattern: number[];
  psychological_effect: string;
  intensity_level: 'low' | 'medium' | 'high' | 'extreme';
  best_for: string[];
  example_use_case: string;
}

interface PacingSelectorProps {
  selectedPacing: string | null;
  onSelectPacing: (pacingId: string) => void;
}

export function PacingSelector({ selectedPacing, onSelectPacing }: PacingSelectorProps) {
  const [pacingOptions, setPacingOptions] = useState<PacingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterIntensity, setFilterIntensity] = useState<string>('all');

  useEffect(() => {
    fetchPacingOptions();
  }, []);

  const fetchPacingOptions = async () => {
    try {
      const response = await fetch('/api/composition/pacing');
      const data = await response.json();
      setPacingOptions(data.pacing_templates || []);
    } catch (error) {
      console.error('Failed to fetch pacing options:', error);
    } finally {
      setLoading(false);
    }
  };

  const intensityLevels = [
    { id: 'all', label: 'All', color: 'bg-slate-600' },
    { id: 'low', label: 'Slow', color: 'bg-blue-600', emoji: '🐢' },
    { id: 'medium', label: 'Medium', color: 'bg-green-600', emoji: '🚶' },
    { id: 'high', label: 'Fast', color: 'bg-amber-600', emoji: '🏃' },
    { id: 'extreme', label: 'Extreme', color: 'bg-red-600', emoji: '⚡' },
  ];

  const filteredPacing = pacingOptions.filter(pacing => {
    if (filterIntensity === 'all') return true;
    return pacing.intensity_level === filterIntensity;
  });

  const renderPacingVisual = (pattern: number[]) => {
    const maxDuration = Math.max(...pattern);
    
    return (
      <div className="flex items-end gap-1 h-20">
        {pattern.slice(0, 8).map((duration, index) => {
          const height = (duration / maxDuration) * 100;
          const color = duration <= 3 ? 'bg-red-500' : 
                       duration <= 5 ? 'bg-amber-500' : 
                       duration <= 7 ? 'bg-green-500' : 'bg-blue-500';
          
          return (
            <div
              key={index}
              className={`flex-1 ${color} rounded-t transition-all group-hover:opacity-80`}
              style={{ height: `${height}%` }}
              title={`${duration}s`}
            />
          );
        })}
      </div>
    );
  };

  const getIntensityBadge = (intensity: string) => {
    const config = intensityLevels.find(level => level.id === intensity);
    return config ? { color: config.color, emoji: config.emoji } : { color: 'bg-slate-600', emoji: '' };
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
            <Zap className="w-4 h-4 text-black" />
          </div>
          Emotional Pacing
        </CardTitle>
        <CardDescription>Set the rhythm and psychological impact</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Intensity Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {intensityLevels.map((level) => (
            <button
              key={level.id}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 border-2 ${
                filterIntensity === level.id 
                  ? 'bg-yellow-400 text-black border-yellow-500' 
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-yellow-400'
              }`}
              onClick={() => setFilterIntensity(level.id)}
            >
              {level.emoji && <span>{level.emoji}</span>}
              {level.label}
            </button>
          ))}
        </div>

        {/* Pacing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPacing.map((pacing) => {
            const isSelected = selectedPacing === pacing.id;
            const intensityBadge = getIntensityBadge(pacing.intensity_level);

            return (
              <div
                key={pacing.id}
                className={`relative group cursor-pointer transition-all`}
                onClick={() => onSelectPacing(pacing.id)}
              >
                <Card className={`transition-all border-2 ${
                  isSelected 
                    ? 'border-yellow-500 shadow-lg shadow-yellow-500/20 bg-yellow-50 dark:bg-yellow-900/10' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-yellow-400 bg-slate-50 dark:bg-slate-900'
                }`}>
                  <CardContent className="p-4">
                    {/* Visual Pattern */}
                    <div className={`rounded-lg p-4 mb-3 transition-colors ${
                      isSelected 
                        ? 'bg-yellow-100 dark:bg-yellow-900/20' 
                        : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                    }`}>
                      {renderPacingVisual(pacing.clip_pattern)}
                    </div>

                    {/* Info */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {pacing.name}
                            </h3>
                            {isSelected && (
                              <div className="flex-shrink-0 p-1 bg-yellow-400 rounded-full">
                                <Check className="w-3 h-3 text-black" />
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1.5 flex-wrap">
                            <Badge className="text-xs bg-yellow-400 text-black hover:bg-yellow-500">
                              {intensityBadge.emoji} {pacing.intensity_level}
                            </Badge>
                            <Badge variant="outline" className="text-xs border-slate-300 dark:border-slate-600">
                              {pacing.clip_pattern.length} clips
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {pacing.psychological_effect}
                      </p>
                      
                      <div className="text-xs text-slate-500 dark:text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 rounded px-2 py-1">
                        {pacing.clip_pattern.join('s, ')}s
                      </div>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {pacing.best_for.slice(0, 2).map((tag) => (
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

        {filteredPacing.length === 0 && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            No pacing options found for this intensity
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-3">
            Clip Duration Guide:
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded shadow-sm"></div>
              <span className="text-slate-700 dark:text-slate-300">≤3s (Fast)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-500 rounded shadow-sm"></div>
              <span className="text-slate-700 dark:text-slate-300">4-5s (Medium)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded shadow-sm"></div>
              <span className="text-slate-700 dark:text-slate-300">6-7s (Slow)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded shadow-sm"></div>
              <span className="text-slate-700 dark:text-slate-300">8s+ (Very Slow)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

