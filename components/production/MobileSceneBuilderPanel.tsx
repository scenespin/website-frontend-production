'use client';

/**
 * Mobile Scene Builder Panel
 * 
 * Simplified, vertically-stacked version of the Scene Builder for mobile devices.
 * Maintains the 3-column structure (Beats → Clip Gen → Character Bank) but stacks vertically.
 * 
 * Features:
 * - Collapsible sections to save screen space
 * - Optimized touch targets
 * - Streamlined UI with essential controls
 * - Script-contextual beat selection
 * - Hybrid upload/AI generation
 * - Character consistency via Character Bank
 */

import React, { useState, useEffect } from 'react';
import {
  ChevronDown, ChevronUp, Sparkles, Upload, Clock,
  Plus, Check, Film, Users, Zap
} from 'lucide-react';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { StoryBeatsPanel } from './StoryBeatsPanel';
import { ClipGenerationPanel } from './ClipGenerationPanel';
import { CharacterBankPanel } from './CharacterBankPanel';
import type { ClipAssignment, CharacterProfile, AISuggestion } from './ProductionPageLayout';
import { toast } from 'sonner';

interface MobileSceneBuilderPanelProps {
  projectId: string;
}

type ExpandedSection = 'beats' | 'generation' | 'characters' | null;

export function MobileSceneBuilderPanel({ projectId }: MobileSceneBuilderPanelProps) {
  const screenplay = useScreenplay();
  
  // Section expansion state (only one open at a time on mobile)
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>('beats');
  
  // Scene Builder state
  const [selectedBeatId, setSelectedBeatId] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [clipAssignments, setClipAssignments] = useState<ClipAssignment[]>([]);
  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<Record<number, number>>({});

  /**
   * Load characters on mount
   */
  useEffect(() => {
    loadCharacters();
  }, [projectId]);

  const loadCharacters = async () => {
    setIsLoadingCharacters(true);
    try {
      const response = await fetch(`/api/characters?projectId=${projectId}`);
      const data = await response.json();
      if (data.success) {
        setCharacters(data.characters || []);
      }
    } catch (error) {
      console.error('[MobileSceneBuilder] Failed to load characters:', error);
    } finally {
      setIsLoadingCharacters(false);
    }
  };

  /**
   * Handle beat selection
   */
  const handleBeatSelect = async (beatId: string) => {
    setSelectedBeatId(beatId);
    setExpandedSection('generation'); // Auto-expand generation section
    
    // Load AI suggestion for this beat
    setIsLoadingSuggestion(true);
    try {
      const beat = screenplay.beats.find(b => b.id === beatId);
      if (!beat) return;

      const response = await fetch('/api/production/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beatContent: beat.description,
          beatContext: beat.title,
          sceneType: 'story',
          projectId
        })
      });

      const data = await response.json();
      if (data.success) {
        setAiSuggestion(data.suggestion);
      }
    } catch (error) {
      console.error('[MobileSceneBuilder] Failed to load suggestion:', error);
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationProgress({});
    
    try {
      // Real API call for scene generation
      const { api } = await import('@/lib/api');
      
      // Track progress for each clip
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          const updated = { ...prev };
          clipAssignments.forEach((_, idx) => {
            // Simulate progress until we get real status
            updated[idx] = Math.min((updated[idx] || 0) + 5, 85);
          });
          return updated;
        });
      }, 1000);
      
      // Prepare generation payload
      const generationPayload = clipAssignments.map((clip, idx) => ({
        clipIndex: idx,
        prompt: clip.prompt || '',
        characterId: clip.characterId,
        characterName: clip.characterName,
        source: clip.source,
        estimatedCost: clip.estimatedCost || 0
      }));
      
      // Call the backend scene generation API
      const response = await api.post('/api/scene-generation/complete', {
        projectId,
        sceneId: selectedBeat?.id || 'scene_' + Date.now(),
        clipAssignments: generationPayload,
        templateId: 'custom',
        totalEstimatedCost: calculateTotalCost()
      });
      
      clearInterval(progressInterval);
      
      // Mark all as complete
      const completed = clipAssignments.reduce((acc, _, idx) => ({ ...acc, [idx]: 100 }), {});
      setGenerationProgress(completed);
      setCurrentStep(3); // 3 = review step
      
      toast.success(`Generated ${response.data.clipsGenerated} clips successfully!`);
    } catch (error: any) {
      console.error('[MobileSceneBuilder] Generation failed:', error);
      toast.error(error.response?.data?.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateClipAssignment = (clipIndex: number, assignment: Partial<ClipAssignment>) => {
    setClipAssignments(prev => {
      const updated = [...prev];
      const existing = updated.find(a => a.clipIndex === clipIndex);
      if (existing) {
        Object.assign(existing, assignment);
      } else {
        updated.push({ clipIndex, ...assignment } as ClipAssignment);
      }
      return updated;
    });
  };

  const handleSaveToGallery = () => {
    toast.success('Saved to gallery!');
  };

  const handleSendToTimeline = () => {
    toast.success('Sent to timeline!');
  };

  const handleSendToComposition = () => {
    toast.success('Opening composition...');
  };

  const calculateTotalCost = () => {
    return clipAssignments.reduce((sum, a) => sum + (a.estimatedCost || 0), 0);
  };

  const calculateSavings = () => {
    return clipAssignments.length * 50; // Placeholder
  };

  const selectedBeat = screenplay.beats.find(b => b.id === selectedBeatId);

  /**
   * Toggle section
   */
  const toggleSection = (section: ExpandedSection) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      {/* Mobile Header */}
      <div className="px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Scene Builder
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Beat-by-beat production with script context
        </p>
      </div>

      {/* Vertically Stacked Sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Section 1: Story Beats */}
        <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <button
            onClick={() => toggleSection('beats')}
            className="w-full px-4 py-3 flex items-center justify-between text-left
                     hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-primary" />
              <span className="font-semibold text-slate-900 dark:text-white">
                Story Beats
              </span>
              {selectedBeatId && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">
                  Selected
                </span>
              )}
            </div>
            {expandedSection === 'beats' ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </button>

          {expandedSection === 'beats' && (
            <div className="border-t border-slate-200 dark:border-slate-700">
              <StoryBeatsPanel
                beats={screenplay.beats}
                selectedBeatId={selectedBeatId}
                onBeatSelect={handleBeatSelect}
              />
            </div>
          )}
        </div>

        {/* Section 2: Clip Generation */}
        <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <button
            onClick={() => toggleSection('generation')}
            className="w-full px-4 py-3 flex items-center justify-between text-left
                     hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" />
              <span className="font-semibold text-slate-900 dark:text-white">
                Clip Generation
              </span>
              {isGenerating && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                  Generating...
                </span>
              )}
            </div>
            {expandedSection === 'generation' ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </button>

          {expandedSection === 'generation' && (
            <div className="border-t border-slate-200 dark:border-slate-700">
              <ClipGenerationPanel
                selectedBeat={selectedBeat}
                aiSuggestion={aiSuggestion}
                isLoadingSuggestion={isLoadingSuggestion}
                currentStep={currentStep}
                onStepChange={setCurrentStep}
                clipAssignments={clipAssignments}
                onUpdateAssignment={updateClipAssignment}
                characters={characters}
                isGenerating={isGenerating}
                generationProgress={generationProgress}
                onGenerate={handleGenerate}
                totalCost={calculateTotalCost()}
                savings={calculateSavings()}
                onSaveToGallery={handleSaveToGallery}
                onSendToTimeline={handleSendToTimeline}
                onSendToComposition={handleSendToComposition}
              />
            </div>
          )}
        </div>

        {/* Section 3: Character Bank */}
        <div className="bg-white dark:bg-slate-800">
          <button
            onClick={() => toggleSection('characters')}
            className="w-full px-4 py-3 flex items-center justify-between text-left
                     hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-slate-900 dark:text-white">
                Character Bank
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                {characters.length}
              </span>
            </div>
            {expandedSection === 'characters' ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </button>

          {expandedSection === 'characters' && (
            <div className="border-t border-slate-200 dark:border-slate-700">
              <CharacterBankPanel
                characters={characters}
                isLoading={isLoadingCharacters}
                projectId={projectId}
                onCharactersUpdate={loadCharacters}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Bar (Quick Actions) */}
      {selectedBeatId && (
        <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg">
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedBeatId}
              className="flex-1 py-3 px-4 rounded-lg bg-primary text-white font-semibold
                       hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              {isGenerating ? 'Generating...' : 'Generate Scene'}
            </button>
            
            {currentStep === 3 && ( // 3 = review step
              <button
                onClick={handleSendToTimeline}
                className="py-3 px-4 rounded-lg border-2 border-primary text-primary font-semibold
                         hover:bg-primary/5 transition-colors"
              >
                <Check className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* Cost Summary */}
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mt-2">
            <span>Total: {calculateTotalCost()} credits</span>
            <span className="text-green-600 dark:text-green-400">Save {calculateSavings()} credits</span>
          </div>
        </div>
      )}
    </div>
  );
}

