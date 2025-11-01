'use client';

/**
 * Production Page Layout - Feature 0042 + Feature 0084
 * 
 * Tabbed interface for Production:
 * - Tab 1: Workflows (guided, workflow-based) - 90% of users
 * - Tab 2: Scene Builder (advanced, script-based) - power users
 * - Tab 3: Characters (character management) - full screen
 * - Tab 4: Jobs (workflow history & recovery)
 * 
 * Mobile: Workflows primary, optional Advanced tab for Scene Builder
 * Desktop: Full 4-tab interface
 */

import React, { useState, useEffect } from 'react';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEditorContext } from '@/lib/contextStore';
import { toast } from 'sonner';
import { useVideoGeneration } from '@/hooks/useVideoGeneration';
import type { StoryBeat, Character } from '@/types/screenplay';
import { shouldSimplifyComposition } from '@/utils/deviceDetection';
import { MobileProductionBanner } from './MobileProductionBanner';
import { MobileWorkflowSelector } from './MobileWorkflowSelector';
import { ProductionTabBar, type ProductionTab } from './ProductionTabBar';
import { SceneBuilderPanel } from './SceneBuilderPanel';
import { MobileSceneBuilderPanel } from './MobileSceneBuilderPanel';

// Sub-components
import { StoryBeatsPanel } from './StoryBeatsPanel';
import { ClipGenerationPanel } from './ClipGenerationPanel';
import { CharacterBankPanel } from './CharacterBankPanel';
import { ProductionJobsPanel } from './ProductionJobsPanel';
import { LocationBankPanel } from './LocationBankPanel';

// Types for production state
export interface ClipAssignment {
  clipIndex: number;
  source: 'ai-generate' | 'upload';
  
  // AI generation fields
  characterId?: string;
  characterName?: string;
  referenceId?: string;
  referenceUrl?: string;
  prompt?: string;
  
  // Upload fields
  uploadedFile?: File;
  uploadedS3Key?: string;
  uploadedUrl?: string;
  
  // Enhancement options (for uploaded clips)
  enhanceStyle?: boolean;
  reframe?: boolean;
  
  // Generation state
  status: 'pending' | 'uploading' | 'generating' | 'enhancing' | 'completed' | 'error';
  resultUrl?: string;
  resultS3Key?: string;
  creditsUsed: number;
  estimatedCost?: number;
  errorMessage?: string;
}

export interface AISuggestion {
  templateId: string;
  templateName: string;
  reasoning: string;
  clipCount: number;
  estimatedCost: number;
  clipRequirements: ClipRequirement[];
}

export interface ClipRequirement {
  clipIndex: number;
  description: string;
  suggestedCharacter?: string;
  suggestedCameraAngle: string;
  suggestedVisibility: 'face-visible' | 'body-only' | 'hands' | 'vfx' | 'establishing';
  estimatedCredits: number;
}

export interface CharacterProfile {
  id: string;
  name: string;
  type: 'lead' | 'supporting' | 'minor';
  baseReference?: {
    imageUrl: string;
    s3Key?: string;
  };
  references: CharacterReference[];
  referenceCount: number;
  
  // Performance settings for character animation
  performanceSettings?: {
    facialPerformance: number;      // 0-2 range: 0=subtle, 1=natural (default), 2=dramatic
    animationStyle: 'full-body' | 'face-only';
  };
}

export interface CharacterReference {
  id: string;
  imageUrl: string;
  s3Key: string;
  label: string;
  referenceType: 'base' | 'angle' | 'expression' | 'action';
}

export interface ProductionPageLayoutProps {
  projectId: string;
}

export function ProductionPageLayout({ projectId }: ProductionPageLayoutProps) {
  // Screenplay context
  const screenplay = useScreenplay();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get context from editor (scene, character, etc.)
  const editorContext = useEditorContext();
  
  // Tab navigation state
  const [activeTab, setActiveTab] = useState<ProductionTab>('workflows'); // Default to workflows
  
  // Selected beat state
  const [selectedBeatId, setSelectedBeatId] = useState<string | null>(null);
  const [selectedBeat, setSelectedBeat] = useState<StoryBeat | null>(null);
  
  // Contextual scene pre-loading
  const [contextualScene, setContextualScene] = useState<string | null>(null);
  
  // AI suggestion state
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  
  // Clip assignments state
  const [clipAssignments, setClipAssignments] = useState<ClipAssignment[]>([]);
  
  // Character bank state
  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<Record<number, number>>({});
  const [currentClipIndex, setCurrentClipIndex] = useState<number>(-1);
  
  // Current wizard step (1=Analysis, 2=Assignment, 3=Generation)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  
  // Video generation hook (for real polling)
  const videoGeneration = useVideoGeneration();
  
  // Device detection (Feature 0069)
  const [isMobileView, setIsMobileView] = useState(false);
  
  // Load contextual scene/character from editor
  useEffect(() => {
    if (editorContext.currentSceneName) {
      setContextualScene(editorContext.currentSceneName);
      
      // Show toast to inform user
      toast.success(`Scene loaded: ${editorContext.currentSceneName}`, {
        description: 'Ready to generate from your current scene',
        duration: 3000
      });
    }
    
    // If character is active, could pre-select in Character Bank
    if (editorContext.activeCharacterId && activeTab === 'characters') {
      // Character bank will handle highlighting
      console.log('[Production] Active character:', editorContext.activeCharacterName);
    }
  }, [editorContext.currentSceneName, editorContext.activeCharacterId, activeTab]);
  
  useEffect(() => {
    setIsMobileView(shouldSimplifyComposition());
    
    const handleResize = () => {
      setIsMobileView(shouldSimplifyComposition());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load characters from Character Bank on mount
  useEffect(() => {
    loadCharacters();
  }, [projectId]);
  
  // Watch video generation progress (real polling)
  useEffect(() => {
    if (currentClipIndex >= 0 && videoGeneration.isPolling) {
      // Update progress from real polling
      setGenerationProgress(prev => ({ 
        ...prev, 
        [currentClipIndex]: videoGeneration.progress 
      }));
    }
  }, [videoGeneration.progress, videoGeneration.isPolling, currentClipIndex]);
  
  // Watch for video generation completion
  useEffect(() => {
    if (currentClipIndex >= 0 && videoGeneration.status === 'completed' && videoGeneration.videos.length > 0) {
      const video = videoGeneration.videos[0];
      
      console.log(`[ProductionPage] Clip ${currentClipIndex} completed:`, video);
      
      // Update clip assignment with completed video
      updateClipAssignment(currentClipIndex, {
        status: 'completed',
        resultUrl: video.videoUrl,
        resultS3Key: video.s3Key,
        creditsUsed: video.creditsUsed || 45
      });
      
      // Reset video generation for next clip
      videoGeneration.reset();
      setCurrentClipIndex(-1);
      
      // Continue with next clip if still generating
      if (isGenerating) {
        continueGeneration();
      }
    } else if (currentClipIndex >= 0 && videoGeneration.status === 'failed') {
      console.error(`[ProductionPage] Clip ${currentClipIndex} failed:`, videoGeneration.error);
      
      updateClipAssignment(currentClipIndex, {
        status: 'error',
        errorMessage: videoGeneration.error || 'Generation failed'
      });
      
      videoGeneration.reset();
      setCurrentClipIndex(-1);
      
      // Continue with next clip if still generating
      if (isGenerating) {
        continueGeneration();
      }
    }
  }, [videoGeneration.status, videoGeneration.videos, videoGeneration.error, currentClipIndex, isGenerating]);

  // When beat selected, auto-move to step 1 and get AI suggestion
  useEffect(() => {
    if (selectedBeatId) {
      const beat = screenplay.beats.find(b => b.id === selectedBeatId);
      if (beat) {
        setSelectedBeat(beat);
        setCurrentStep(1);
        loadAISuggestion(beat);
      }
    }
  }, [selectedBeatId, screenplay.beats]);

  /**
   * Load characters from Character Bank
   */
  async function loadCharacters() {
    setIsLoadingCharacters(true);
    try {
      const response = await fetch(`/api/character-bank/list?projectId=${projectId}`);
      const data = await response.json();
      
      if (data.success) {
        setCharacters(data.characters || []);
      }
    } catch (error) {
      console.error('[ProductionPage] Failed to load characters:', error);
    } finally {
      setIsLoadingCharacters(false);
    }
  }

  /**
   * Load AI suggestion for selected beat
   */
  async function loadAISuggestion(beat: StoryBeat) {
    setIsLoadingSuggestion(true);
    try {
      const response = await fetch('/api/composition/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beat: {
            title: beat.title,
            description: beat.description,
            scenes: beat.scenes
          },
          characters: screenplay.characters.map(c => c.name)
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Convert API response to AISuggestion format
        const suggestion: AISuggestion = {
          templateId: data.template_id,
          templateName: data.template.name,
          reasoning: data.reasoning,
          clipCount: data.template.clipCount,
          estimatedCost: data.estimated_savings?.total_cost || data.template.clipCount * 45,
          clipRequirements: (data.clip_requirements || []).map((req: any, idx: number) => ({
            clipIndex: idx,
            description: req.description || `Clip ${idx + 1}`,
            suggestedCharacter: req.suggestedCharacter,
            suggestedCameraAngle: req.suggestedCameraAngle || 'medium-shot',
            suggestedVisibility: req.suggestedVisibility || 'face-visible',
            estimatedCredits: req.estimatedCredits || 45
          }))
        };
        
        setAiSuggestion(suggestion);
        
        // Initialize clip assignments
        const initialAssignments: ClipAssignment[] = suggestion.clipRequirements.map(req => ({
          clipIndex: req.clipIndex,
          source: 'ai-generate',
          status: 'pending',
          creditsUsed: 0,
          prompt: `${beat.description} - ${req.description}`
        }));
        
        setClipAssignments(initialAssignments);
      }
    } catch (error) {
      console.error('[ProductionPage] Failed to load AI suggestion:', error);
    } finally {
      setIsLoadingSuggestion(false);
    }
  }

  /**
   * Handle beat selection from left panel
   */
  function handleBeatSelect(beatId: string) {
    setSelectedBeatId(beatId);
  }

  /**
   * Handle clip assignment changes
   */
  function updateClipAssignment(clipIndex: number, updates: Partial<ClipAssignment>) {
    setClipAssignments(prev => 
      prev.map((assignment, idx) => 
        idx === clipIndex ? { ...assignment, ...updates } : assignment
      )
    );
  }

  /**
   * Calculate total cost
   */
  function calculateTotalCost(): number {
    return clipAssignments.reduce((total, clip) => {
      if (clip.source === 'ai-generate') {
        return total + (clip.characterId ? 45 : 15);
      } else if (clip.source === 'upload') {
        let cost = 0;
        if (clip.enhanceStyle) cost += 12;
        if (clip.reframe) cost += 10;
        return total + cost;
      }
      return total;
    }, 0);
  }

  /**
   * Calculate savings vs all-AI
   */
  function calculateSavings(): number {
    const allAICost = clipAssignments.length * 45;
    return allAICost - calculateTotalCost();
  }

  /**
   * Handle video generation (starts the process)
   */
  async function handleGenerate() {
    if (!selectedBeat || !aiSuggestion) return;
    
    setIsGenerating(true);
    setCurrentStep(3);
    
    // Start with the first clip
    continueGeneration();
  }
  
  /**
   * Continue generation with next clip (sequential for rate limiting)
   */
  async function continueGeneration() {
    try {
      // Find next clip to generate
      const nextClip = clipAssignments.find(clip => clip.status === 'pending');
      
      if (!nextClip) {
        // All clips done - mark beat as completed
        console.log('[ProductionPage] All clips completed!');
        
        if (selectedBeat) {
          await screenplay.updateBeat(selectedBeat.id, {
            production: {
              ...selectedBeat.production,
              status: 'ready',
              clipCount: clipAssignments.length,
              creditsUsed: clipAssignments.reduce((sum, c) => sum + c.creditsUsed, 0),
              lastGeneratedAt: new Date().toISOString()
            }
          });
        }
        
        setIsGenerating(false);
        return;
      }
      
      // Generate or upload next clip (sequential to avoid rate limiting)
      if (nextClip.source === 'ai-generate') {
        await generateClipWithAI(nextClip);
      } else if (nextClip.source === 'upload') {
        await uploadClip(nextClip);
        // For uploads, continue immediately since they don't need polling
        continueGeneration();
      }
      
    } catch (error) {
      console.error('[ProductionPage] Generation failed:', error);
      setIsGenerating(false);
    }
  }

  /**
   * Generate clip using AI (with real polling)
   */
  async function generateClipWithAI(clip: ClipAssignment) {
    updateClipAssignment(clip.clipIndex, { status: 'generating' });
    setCurrentClipIndex(clip.clipIndex);
    
    try {
      console.log(`[ProductionPage] Starting AI generation for clip ${clip.clipIndex}`);
      
      // Use the real video generation hook with polling
      await videoGeneration.startGeneration({
        prompts: [{ 
          text: clip.prompt || '', 
          segmentIndex: clip.clipIndex 
        }],
        qualityTier: 'professional',
        resolution: '1080p',
        aspectRatio: '16:9',
        duration: '5s',
        sceneId: selectedBeat?.id || `production-clip-${clip.clipIndex}`,
        sceneName: selectedBeat?.title || `Production Clip ${clip.clipIndex + 1}`,
        referenceImageUrls: clip.referenceUrl ? [clip.referenceUrl] : undefined
      });
      
      // The hook handles polling automatically
      // Completion is handled by useEffect watching videoGeneration.status
      
    } catch (error) {
      console.error(`[ProductionPage] Failed to generate clip ${clip.clipIndex}:`, error);
      updateClipAssignment(clip.clipIndex, {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Generation failed'
      });
      setCurrentClipIndex(-1);
    }
  }

  /**
   * Upload user's video clip
   */
  async function uploadClip(clip: ClipAssignment) {
    if (!clip.uploadedFile) return;
    
    updateClipAssignment(clip.clipIndex, { status: 'uploading' });
    
    try {
      // Upload to S3
      const formData = new FormData();
      formData.append('video', clip.uploadedFile);
      formData.append('projectId', projectId);
      
      const response = await fetch('/api/video/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        let s3Key = data.s3Key;
        let videoUrl = data.url;
        
        // Apply enhancements if requested
        if (clip.enhanceStyle) {
          const enhanceRes = await fetch('/api/video/enhance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              videoS3Key: s3Key,
              enhancement: 'cinematic-style'
            })
          });
          const enhanceData = await enhanceRes.json();
          s3Key = enhanceData.s3Key;
          videoUrl = enhanceData.url;
        }
        
        if (clip.reframe) {
          const reframeRes = await fetch('/api/video/reframe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              videoS3Key: s3Key,
              targetAspectRatio: '16:9'
            })
          });
          const reframeData = await reframeRes.json();
          s3Key = reframeData.s3Key;
          videoUrl = reframeData.url;
        }
        
        updateClipAssignment(clip.clipIndex, {
          status: 'completed',
          resultUrl: videoUrl,
          resultS3Key: s3Key,
          creditsUsed: (clip.enhanceStyle ? 12 : 0) + (clip.reframe ? 10 : 0)
        });
      }
    } catch (error) {
      console.error(`[ProductionPage] Failed to upload clip ${clip.clipIndex}:`, error);
      updateClipAssignment(clip.clipIndex, {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Upload failed'
      });
    }
  }

  /**
   * Save all completed clips to MediaGallery
   */
  function handleSaveToGallery() {
    const completedClips = clipAssignments.filter(c => c.status === 'completed' && c.resultUrl);
    
    if (completedClips.length === 0) {
      toast.error('No completed clips to save');
      return;
    }

    try {
      // Load existing media
      const existingMedia = JSON.parse(localStorage.getItem('mediaGallery') || '[]');
      
      // Create new media items
      const newItems = completedClips.map(clip => ({
        id: `production-${Date.now()}-${clip.clipIndex}`,
        type: 'video' as const,
        url: clip.resultUrl!,
        name: `beat_${selectedBeat?.id || 'unknown'}_clip_${clip.clipIndex}.mp4`,
        size: 0,
        createdAt: new Date().toISOString(),
        s3Key: clip.resultS3Key,
        metadata: {
          source: 'production',
          beatId: selectedBeat?.id,
          beatTitle: selectedBeat?.title,
          characterId: clip.characterId,
          characterName: clip.characterName,
          creditsUsed: clip.creditsUsed,
          generationType: clip.source
        }
      }));
      
      // Save to localStorage
      localStorage.setItem('mediaGallery', JSON.stringify([...existingMedia, ...newItems]));
      
      toast.success(`Saved ${completedClips.length} clip(s) to Media Gallery!`, {
        description: 'You can find them in Cloud Storage → Media Gallery'
      });
    } catch (error) {
      console.error('[Production] Failed to save to gallery:', error);
      toast.error('Failed to save clips to gallery');
    }
  }

  /**
   * Send all completed clips to Timeline
   */
  function handleSendToTimeline() {
    const completedClips = clipAssignments.filter(c => c.status === 'completed' && c.resultUrl);
    
    if (completedClips.length === 0) {
      toast.error('No completed clips to send');
      return;
    }

    // Create clips data array
    const clipsData = completedClips.map((clip, index) => ({
      url: clip.resultUrl!,
      type: 'video',
      name: `clip_${index + 1}_${clip.characterName || 'scene'}.mp4`
    }));
    
    // Encode as JSON in URL
    const encoded = encodeURIComponent(JSON.stringify(clipsData));
    router.push(`/app/timeline?preloadClips=${encoded}`);
    
    toast.success(`Sending ${completedClips.length} clip(s) to Timeline...`);
  }

  /**
   * Send all completed clips to Composition
   */
  function handleSendToComposition() {
    const completedClips = clipAssignments.filter(c => c.status === 'completed' && c.resultUrl);
    
    if (completedClips.length === 0) {
      toast.error('No completed clips to send');
      return;
    }

    // Create clips data array
    const clipsData = completedClips.map((clip, index) => ({
      url: clip.resultUrl!,
      type: 'video',
      name: `clip_${index + 1}_${clip.characterName || 'scene'}.mp4`
    }));
    
    // Encode as JSON in URL
    const encoded = encodeURIComponent(JSON.stringify(clipsData));
    router.push(`/app/composition?preloadClips=${encoded}`);
    
    toast.success(`Sending ${completedClips.length} clip(s) to Composition...`);
  }

  return (
    <>
      {/* Mobile View: Workflows + Optional Advanced Tab */}
      {isMobileView ? (
        <div className="flex flex-col h-[calc(100vh-120px)] bg-[#0A0A0A]">
          {/* Mobile Banner */}
          <MobileProductionBanner />
          
          {/* Mobile Tab Bar (Workflows | Advanced) */}
          <ProductionTabBar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isMobile={true}
          />
          
            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'workflows' ? (
                <MobileWorkflowSelector
                  projectId={projectId}
                />
              ) : (
                // Advanced = Mobile Scene Builder (vertical stacking)
                <MobileSceneBuilderPanel
                  projectId={projectId}
                />
              )}
            </div>
        </div>
      ) : (
        /* Desktop View: Full 4-Tab Interface */
        <div className="flex flex-col h-[calc(100vh-120px)] bg-[#0A0A0A]">
          {/* Desktop Tab Bar */}
          <ProductionTabBar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isMobile={false}
          />
          
          {/* Tab Content */}
          {activeTab === 'workflows' && (
            <div className="flex-1 overflow-hidden">
              <MobileWorkflowSelector
                projectId={projectId}
              />
            </div>
          )}
          
          {activeTab === 'scene-builder' && (
            <div className="flex h-full">
              {/* Left Panel: Story Beats (25%) */}
              <div className="w-1/4 min-w-[300px] border-r border-white/10 bg-[#141414]">
                <StoryBeatsPanel
                  beats={screenplay.beats}
                  selectedBeatId={selectedBeatId}
                  onBeatSelect={handleBeatSelect}
                />
              </div>

              {/* Center Panel: Clip Generation (50%) */}
              <div className="flex-1 min-w-[600px] overflow-auto">
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

              {/* Right Panel: Character Bank (25%) */}
              <div className="w-1/4 min-w-[300px] border-l border-white/10 bg-[#141414]">
                <CharacterBankPanel
                  characters={characters}
                  isLoading={isLoadingCharacters}
                  projectId={projectId}
                  onCharactersUpdate={loadCharacters}
                />
              </div>
            </div>
          )}
          
          {activeTab === 'characters' && (
            <div className="flex-1 overflow-auto">
              <CharacterBankPanel
                characters={characters}
                isLoading={isLoadingCharacters}
                projectId={projectId}
                onCharactersUpdate={loadCharacters}
              />
            </div>
          )}
          
          {activeTab === 'jobs' && (
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-6xl mx-auto">
                <ProductionJobsPanel projectId={projectId} />
              </div>
            </div>
          )}
          
          {activeTab === 'locations' && (
            <div className="flex-1 overflow-auto">
              <LocationBankPanel
                projectId={projectId}
                className="h-full"
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}

