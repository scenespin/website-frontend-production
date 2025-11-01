'use client';

import React, { useState, useEffect } from 'react';
import { 
  Film, 
  Sparkles, 
  Download, 
  Edit3, 
  Settings, 
  Play,
  ChevronDown,
  ChevronUp,
  X,
  Copy,
  Check,
  Clapperboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ShotListPanel, Shot, ShotList } from './ShotListPanel';

export interface ScenePrompt {
  segmentIndex: number;
  startTime: number;
  endTime: number;
  duration: number;
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  aspect_ratio?: string;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  continuityNote: string;
  fountainContext: string;
}

interface SceneVisualizerPanelProps {
  prompts: ScenePrompt[];
  fountainText?: string; // NEW: Original screenplay text
  projectId?: string;    // NEW: For shot list tracking
  sceneId?: string;      // NEW: For shot list tracking
  onGenerateVideos: (prompts: ScenePrompt[], quality: string, resolution: string, useFastMode?: boolean, useVideoExtension?: boolean, preferredModel?: string) => void;
  onGenerateSingleVideo?: (prompt: ScenePrompt, index: number, quality: string, resolution: string, useFastMode?: boolean, preferredModel?: string) => void;
  onUpdatePrompt: (index: number, updatedPrompt: ScenePrompt) => void;
  isGenerating?: boolean;
  generatingSegments?: Set<number>;
}

type ResolutionOption = '1080p' | '4K';
type AspectRatioOption = '16:9' | '9:16' | '4:3' | '3:4' | '21:9' | '9:21' | '1:1';
// Internal provider routing (NOT exposed to users - wrapper strategy)
type ProviderType = 'professional' | 'premium' | 'cinema';

const RESOLUTION_PRESETS: Record<ResolutionOption, { width: number; height: number }> = {
  '1080p': { width: 1920, height: 1080 },
  '4K': { width: 3840, height: 2160 }
};

const ASPECT_RATIO_MULTIPLIERS: Record<AspectRatioOption, { width: number; height: number }> = {
  '16:9': { width: 16, height: 9 },
  '9:16': { width: 9, height: 16 },
  '4:3': { width: 4, height: 3 },
  '3:4': { width: 3, height: 4 },
  '21:9': { width: 21, height: 9 },
  '9:21': { width: 9, height: 21 },
  '1:1': { width: 1, height: 1 }
};

// Quality tier metadata (matches backend costs)
// Wrapper-safe provider metadata - NO provider names exposed to users
const PROVIDER_METADATA = {
  'professional': {
    name: 'Professional',
    description: 'High-quality 1080p generation',
    creditsPerSec: 10,
    minDuration: 5,
    maxDuration: 10,
    supportedRatios: ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9', '9:21'] as const,
    features: ['Image prompts', 'Fast generation', 'Great quality'],
    icon: '👑',
    color: 'purple',
  },
  'premium': {
    name: 'Premium',
    description: 'Best quality 4K',
    creditsPerSec: 15,
    minDuration: 4,
    maxDuration: 8,
    supportedRatios: ['16:9', '9:16', '4:3', '3:4', '1:1'] as const,
    features: ['Reference images', 'Best quality', 'Video chaining'],
    icon: '✨',
    color: 'yellow',
  },
  'cinema': {
    name: 'Cinematic',
    description: 'Fast cinematic clips',
    creditsPerSec: 10,
    minDuration: 5,
    maxDuration: 5,
    supportedRatios: ['16:9', '9:16', '4:3', '3:4', '21:9', '9:21', '1:1'] as const,
    features: ['Cinematic effects', 'Camera motions', 'Quick turnaround'],
    icon: '🌟',
    color: 'blue',
  },
};

// Video Enhancement Concepts (Cinematic Effects)
const VIDEO_CONCEPTS = [
  { key: 'dolly_zoom', label: '🎬 Dolly Zoom', description: 'Hitchcock effect' },
  { key: 'camera_orbit', label: '🔄 Camera Orbit', description: 'Rotate around subject' },
  { key: 'camera_zoom', label: '🔍 Camera Zoom', description: 'Zoom in/out' },
  { key: 'camera_pan', label: '↔️ Camera Pan', description: 'Horizontal movement' },
  { key: 'camera_tilt', label: '↕️ Camera Tilt', description: 'Vertical movement' },
  { key: 'motion_blur', label: '💨 Motion Blur', description: 'Speed effect' },
  { key: 'depth_of_field', label: '🎯 Depth of Field', description: 'Focus effect' },
  { key: 'lens_flare', label: '✨ Lens Flare', description: 'Light streaks' },
];

// Camera Motion Presets (Provider A Standard)
const CAMERA_MOTIONS = [
  { value: '', label: 'None' },
  { value: 'camera pan left', label: '← Pan Left' },
  { value: 'camera pan right', label: 'Pan Right →' },
  { value: 'camera tilt up', label: '↑ Tilt Up' },
  { value: 'camera tilt down', label: '↓ Tilt Down' },
  { value: 'camera zoom in slowly', label: '🔍 Zoom In (Slow)' },
  { value: 'camera zoom out slowly', label: '🔍 Zoom Out (Slow)' },
  { value: 'camera orbit left', label: '🔄 Orbit Left' },
  { value: 'camera orbit right', label: '🔄 Orbit Right' },
  { value: 'handheld camera shake', label: '📹 Handheld Shake' },
  { value: 'smooth tracking shot', label: '🎥 Tracking Shot' },
  { value: 'crane shot up', label: '🏗️ Crane Up' },
  { value: 'crane shot down', label: '🏗️ Crane Down' },
];

export function SceneVisualizerPanel({
  prompts,
  fountainText,
  projectId,
  sceneId,
  onGenerateVideos,
  onGenerateSingleVideo,
  onUpdatePrompt,
  isGenerating = false,
  generatingSegments = new Set()
}: SceneVisualizerPanelProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expandedPrompts, setExpandedPrompts] = useState<Set<number>>(new Set());  // All collapsed by default
  const [globalQuality, setGlobalQuality] = useState<'low' | 'medium' | 'high' | 'ultra'>('high');
  const [globalResolution, setGlobalResolution] = useState<ResolutionOption>('1080p');
  const [globalAspectRatio, setGlobalAspectRatio] = useState<AspectRatioOption>('16:9');
  const [useFastMode, setUseFastMode] = useState<boolean>(false);
  const [useVideoExtension, setUseVideoExtension] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('professional');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  // Quality tier specific options
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]); // Cinematic tier only
  const [cameraMotion, setCameraMotion] = useState<string>(''); // Cinematic tier only
  const [imagePromptUrl, setImagePromptUrl] = useState<string>(''); // Professional tier only
  const [watermarkFree, setWatermarkFree] = useState<boolean>(false); // Professional tier only

  // NEW: Shot List State
  const [showShotList, setShowShotList] = useState<boolean>(false);
  const [shotList, setShotList] = useState<ShotList | null>(null);
  const [isGeneratingShotList, setIsGeneratingShotList] = useState<boolean>(false);

  // Get provider metadata
  const providerMetadata = PROVIDER_METADATA[selectedProvider];

  // NEW: Generate Shot List from Fountain text
  const handleGenerateShotList = async () => {
    if (!fountainText) {
      alert('No screenplay text available. Please select a scene first.');
      return;
    }

    setIsGeneratingShotList(true);
    try {
      const token = localStorage.getItem('jwt_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://o31t5jk8w5.execute-api.us-east-1.amazonaws.com';
      
      const response = await fetch(`${apiUrl}/api/shotlist/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fountainText,
          projectId,
          sceneId,
          options: {
            targetDuration: 60,
            averageShotLength: 5,
            style: 'cinematic',
            pacing: 'medium',
            includeVisualPrompts: true
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate shot list');
      }

      const data = await response.json();
      setShotList(data.shotList);
      setShowShotList(true);
      
      console.log('[SceneVisualizer] Shot list generated:', data.shotList);
    } catch (error: any) {
      console.error('[SceneVisualizer] Error generating shot list:', error);
      alert(`Failed to generate shot list: ${error.message}`);
    } finally {
      setIsGeneratingShotList(false);
    }
  };

  // NEW: Handle import to timeline
  const handleImportToTimeline = (shots: Shot[]) => {
    // Store shots in sessionStorage to pass to Timeline Editor
    sessionStorage.setItem('timeline_import_shots', JSON.stringify(shots));
    
    // Navigate to timeline editor (or open timeline panel)
    alert(`📽️ ${shots.length} shots ready to import!\n\nShots saved. Open Timeline Editor to import them.`);
    
    // Close shot list panel
    setShowShotList(false);
  };

  // NEW: Generate videos from shot list
  const handleGenerateVideosFromShots = (shots: Shot[]) => {
    // Convert shots to ScenePrompts
    const scenePrompts: ScenePrompt[] = shots.map((shot, index) => ({
      segmentIndex: index,
      startTime: shot.startTime,
      endTime: shot.endTime,
      duration: shot.duration,
      prompt: shot.visualPrompt || shot.description,
      negative_prompt: shot.negativePrompt,
      width: RESOLUTION_PRESETS[globalResolution].width,
      height: RESOLUTION_PRESETS[globalResolution].height,
      aspect_ratio: globalAspectRatio,
      quality: globalQuality,
      continuityNote: shot.compositionNotes,
      fountainContext: shot.fountainContext
    }));

    // Call existing video generation
    onGenerateVideos(scenePrompts, globalQuality, globalResolution, useFastMode, useVideoExtension, selectedProvider);
    
    // Close shot list panel
    setShowShotList(false);
  };

  useEffect(() => {
    const preset = RESOLUTION_PRESETS[globalResolution];
    const aspectMultiplier = ASPECT_RATIO_MULTIPLIERS[globalAspectRatio];
    
    // Calculate dimensions based on aspect ratio
    let width = preset.width;
    let height = preset.height;
    
    // Adjust to match aspect ratio
    const currentAspect = width / height;
    const targetAspect = aspectMultiplier.width / aspectMultiplier.height;
    
    if (Math.abs(currentAspect - targetAspect) > 0.01) {
      if (currentAspect > targetAspect) {
        width = Math.round(height * targetAspect);
      } else {
        height = Math.round(width / targetAspect);
      }
    }

    prompts.forEach((prompt, index) => {
      if (prompt.quality !== globalQuality || 
          prompt.width !== width || 
          prompt.height !== height ||
          prompt.aspect_ratio !== globalAspectRatio) {
        onUpdatePrompt(index, {
          ...prompt,
          quality: globalQuality,
          width,
          height,
          aspect_ratio: globalAspectRatio
        });
      }
    });
  }, [globalQuality, globalResolution, globalAspectRatio]);

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedPrompts);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedPrompts(newExpanded);
  };

  const handleExportJSON = () => {
    const jsonData = JSON.stringify(prompts, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scene-prompts-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyPrompt = (index: number, prompt: ScenePrompt) => {
    const promptText = JSON.stringify(prompt, null, 2);
    navigator.clipboard.writeText(promptText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  const totalDuration = prompts.reduce((sum, p) => sum + p.duration, 0);

  // If showing shot list, render Shot List Panel instead
  if (showShotList) {
    return (
      <ShotListPanel
        shotList={shotList}
        onGenerateVideos={handleGenerateVideosFromShots}
        onImportToTimeline={handleImportToTimeline}
        onClose={() => setShowShotList(false)}
        isGenerating={isGenerating}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-sm rounded-lg border border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Film className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Scene Visualizer</h3>
            <p className="text-xs text-muted-foreground">
              {prompts.length} segments · {formatTime(totalDuration)} total
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExportJSON}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Export JSON
        </Button>
      </div>

      {/* Global Settings */}
      <div className="p-4 bg-accent/5 border-b border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Global Settings</span>
        </div>
        
        {/* Quality Tier Selector (Simple 2-tier) */}
        <div className="mb-4 p-3 rounded-md bg-background/50 border border-border/50">
          <label className="text-sm font-medium mb-2 block">🎬 Quality Tier</label>
          <div className="grid grid-cols-2 gap-3">
            {/* Professional Tier (1080p) - 50 credits */}
            <button
              onClick={() => setSelectedProvider('professional')}
              className={`
                flex flex-col items-start p-3 rounded border text-left transition-all
                ${selectedProvider === 'professional'
                  ? 'bg-indigo-500/10 border-indigo-500 shadow-md'
                  : 'bg-background border-border hover:border-indigo-400'
                }
              `}
            >
              <span className="text-sm font-semibold mb-1">👑 Professional (1080p)</span>
              <span className="text-xs text-muted-foreground">50 credits per 5s video</span>
              <span className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Recommended</span>
            </button>
            
            {/* Premium Tier (4K) - 75 credits */}
            <button
              onClick={() => setSelectedProvider('premium')}
              className={`
                flex flex-col items-start p-3 rounded border text-left transition-all
                ${selectedProvider === 'premium'
                  ? 'bg-purple-500/10 border-purple-500 shadow-md'
                  : 'bg-background border-border hover:border-purple-400'
                }
              `}
            >
              <span className="text-sm font-semibold mb-1">✨ Premium (4K)</span>
              <span className="text-xs text-muted-foreground">75 credits per 5s video</span>
              <span className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">✓ Best Quality</span>
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {/* Quality Selector */}
          <div className="relative">
            <label className="text-xs text-muted-foreground mb-1 block">Quality</label>
            <Select value={globalQuality} onValueChange={(v: any) => setGlobalQuality(v)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[150]" sideOffset={5}>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="ultra">Ultra</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Resolution Selector */}
            <div className="relative">
              <label className="text-xs text-muted-foreground mb-1 block">Resolution</label>
              <Select value={globalResolution} onValueChange={(v: any) => setGlobalResolution(v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[150]" sideOffset={5}>
                  <SelectItem value="1080p">1080p (Professional)</SelectItem>
                  <SelectItem value="4K">4K (Premium)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="relative">
              <label className="text-xs text-muted-foreground mb-1 block">Aspect Ratio</label>
              <Select value={globalAspectRatio} onValueChange={(v: any) => setGlobalAspectRatio(v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[150]" sideOffset={5}>
                  <SelectItem value="16:9">16:9 (Horizontal/Cinema)</SelectItem>
                  <SelectItem value="9:16">9:16 (Vertical/TikTok) 📱</SelectItem>
                  <SelectItem value="4:3">4:3 (Classic TV)</SelectItem>
                  <SelectItem value="3:4">3:4 (Vertical Portrait)</SelectItem>
                  <SelectItem value="21:9">21:9 (Ultra Wide)</SelectItem>
                  <SelectItem value="9:21">9:21 (Ultra Vertical)</SelectItem>
                  <SelectItem value="1:1">1:1 (Square/Instagram)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Professional Tier Controls */}
        {selectedProvider === 'professional' && (
          <div className="mt-3 space-y-3">
            {/* Image Prompt URL */}
            <div className="p-3 rounded-md bg-background/50 border border-border/50">
              <label className="text-sm font-medium mb-2 block">🖼️ Image Prompt (Optional)</label>
              <input
                type="text"
                value={imagePromptUrl}
                onChange={(e) => setImagePromptUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 rounded border border-border bg-background text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Provide a reference image URL to guide the video generation
              </p>
            </div>
            
            {/* Watermark Toggle */}
            <div className="flex items-center gap-2 p-2 rounded-md bg-background/50 border border-border/50">
              <input
                type="checkbox"
                id="watermark-free"
                checked={watermarkFree}
                onChange={(e) => setWatermarkFree(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
              />
              <label htmlFor="watermark-free" className="text-sm cursor-pointer select-none flex items-center gap-1">
                <span>✨ Watermark-Free</span>
                <span className="text-xs text-muted-foreground">(Cleaner output)</span>
              </label>
            </div>
          </div>
        )}
        
        {/* Cinematic Tier Controls - Camera Effects */}
        {selectedProvider === 'cinema' && (
          <div className="mt-3 space-y-3">
            {/* Cinematic Concepts */}
            <div className="p-3 rounded-md bg-background/50 border border-border/50">
              <label className="text-sm font-medium mb-2 block">🎬 Cinematic Effects</label>
              <div className="grid grid-cols-2 gap-2">
                {VIDEO_CONCEPTS.map((concept) => (
                  <button
                    key={concept.key}
                    onClick={() => {
                      setSelectedConcepts(prev =>
                        prev.includes(concept.key)
                          ? prev.filter(k => k !== concept.key)
                          : [...prev, concept.key]
                      );
                    }}
                    className={`
                      flex flex-col items-start p-2 rounded border text-left transition-all text-xs
                      ${selectedConcepts.includes(concept.key)
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-background border-border hover:border-primary/50'
                      }
                    `}
                  >
                    <span className="font-medium">{concept.label}</span>
                    <span className="text-xs text-muted-foreground">{concept.description}</span>
                  </button>
                ))}
              </div>
              {selectedConcepts.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Selected: {selectedConcepts.length} effect{selectedConcepts.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
            
            {/* Camera Motion Preset */}
            <div className="p-3 rounded-md bg-background/50 border border-border/50">
              <label className="text-sm font-medium mb-2 block">🎥 Camera Movement</label>
              <Select value={cameraMotion} onValueChange={setCameraMotion}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select camera motion..." />
                </SelectTrigger>
                <SelectContent className="z-[150]" sideOffset={5}>
                  {CAMERA_MOTIONS.map((motion) => (
                    <SelectItem key={motion.value} value={motion.value}>
                      {motion.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {cameraMotion && (
                <p className="text-xs text-muted-foreground mt-2">
                  Will add &quot;{cameraMotion}&quot; to all prompts
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Video Extension Toggle (Premium 4K tier) */}
        {selectedProvider === 'premium' && (
          <div className="mt-2 flex items-center gap-2 p-2 rounded-md bg-background/50 border border-border/50">
            <input
              type="checkbox"
              id="video-extension"
              checked={useVideoExtension}
              onChange={(e) => setUseVideoExtension(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
            />
            <label htmlFor="video-extension" className="text-sm cursor-pointer select-none flex items-center gap-1">
              <span>🔗 Chain Segments</span>
              <span className="text-xs text-muted-foreground">(Maintains visual continuity between segments)</span>
            </label>
          </div>
        )}
        {selectedProvider === 'premium' && useVideoExtension && (
          <p className="text-xs text-yellow-500 ml-2 mt-1">
            ⚠️ Video extension not supported on this tier. Will auto-switch to stable Premium 4K for chaining.
          </p>
        )}
      </div>

      {/* Prompts List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {prompts.map((prompt, index) => (
          <PromptCard
            key={index}
            prompt={prompt}
            index={index}
            isExpanded={expandedPrompts.has(index)}
            isEditing={editingIndex === index}
            isCopied={copiedIndex === index}
            isGenerating={generatingSegments.has(index)}
            globalQuality={globalQuality}
            globalResolution={globalResolution}
            onToggleExpand={() => toggleExpanded(index)}
            onEdit={() => setEditingIndex(index)}
            onSave={(updated) => {
              onUpdatePrompt(index, updated);
              setEditingIndex(null);
            }}
            onCancel={() => setEditingIndex(null)}
            onCopy={() => handleCopyPrompt(index, prompt)}
            onGenerate={onGenerateSingleVideo ? () => onGenerateSingleVideo(prompt, index, globalQuality, globalResolution, useFastMode, selectedProvider) : undefined}
          />
        ))}
      </div>

      {/* Generate Button */}
      <div className="p-4 border-t border-border/50 bg-accent/5 space-y-3">
        {/* NEW: Generate Shot List Button */}
        {fountainText && (
          <Button
            onClick={handleGenerateShotList}
            disabled={isGeneratingShotList}
            className="w-full gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-bold"
          >
            {isGeneratingShotList ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Analyzing Screenplay...
              </>
            ) : (
              <>
                <Clapperboard className="w-4 h-4" />
                🎬 Generate Professional Shot List
              </>
            )}
          </Button>
        )}

        {/* Existing Generate Videos Button */}
        <Button
          onClick={() => onGenerateVideos(prompts, globalQuality, globalResolution, useFastMode, useVideoExtension, selectedProvider)}
          disabled={isGenerating || prompts.length === 0 || generatingSegments.size > 0}
          className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          {isGenerating || generatingSegments.size > 0 ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating {generatingSegments.size > 0 ? `${generatingSegments.size} Video${generatingSegments.size > 1 ? 's' : ''}` : 'All Videos'}...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Generate All {prompts.length} Video{prompts.length !== 1 ? 's' : ''} with {providerMetadata.icon} {providerMetadata.name.split(' ')[0]}
            </>
          )}
        </Button>
        {prompts.length > 0 && (
          <p className="text-xs text-center text-muted-foreground mt-2">
            Est. cost: {Math.ceil(totalDuration * providerMetadata.creditsPerSec)} credits · {globalQuality} quality · {globalResolution}
            <span className="block mt-0.5 text-xs opacity-75">
              {providerMetadata.icon} Using {providerMetadata.name}
              {useVideoExtension && selectedProvider.startsWith('veo') && ' · 🔗 Chaining enabled'}
            </span>
            {prompts.length > 1 && (
              <span className="block mt-1">
                ⏱️ Approx. {Math.ceil((prompts.length * 80 + (prompts.length - 1) * 30) / 60)} min wait (includes 30s rate limiting)
              </span>
            )}
            {prompts.length === 1 && (
              <span className="block mt-1">
                ⏱️ Approx. 1-2 min wait
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

interface PromptCardProps {
  prompt: ScenePrompt;
  index: number;
  isExpanded: boolean;
  isEditing: boolean;
  isCopied: boolean;
  isGenerating?: boolean;
  globalQuality: string;
  globalResolution: string;
  onToggleExpand: () => void;
  onEdit: () => void;
  onSave: (updated: ScenePrompt) => void;
  onCancel: () => void;
  onCopy: () => void;
  onGenerate?: () => void;
}

function PromptCard({
  prompt,
  index,
  isExpanded,
  isEditing,
  isCopied,
  isGenerating = false,
  globalQuality,
  globalResolution,
  onToggleExpand,
  onEdit,
  onSave,
  onCancel,
  onCopy,
  onGenerate
}: PromptCardProps) {
  const [editedPrompt, setEditedPrompt] = useState(prompt.prompt);
  const [editedNegativePrompt, setEditedNegativePrompt] = useState(prompt.negative_prompt || '');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  const handleSave = () => {
    onSave({
      ...prompt,
      prompt: editedPrompt,
      negative_prompt: editedNegativePrompt
    });
  };

  return (
    <div className="bg-card border border-border/50 rounded-lg overflow-hidden hover:border-border transition-colors">
      {/* Card Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/5 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 text-sm font-semibold">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                Segment {index + 1}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatTime(prompt.startTime)} → {formatTime(prompt.endTime)}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent/50">
                {prompt.duration.toFixed(1)}s
              </span>
            </div>
            {!isExpanded && (
              <p className="text-xs text-muted-foreground truncate mt-1">
                {prompt.prompt}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            className="h-8 w-8 p-0"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-3 border-t border-border/50">
          {/* Technical Settings */}
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="p-2 bg-accent/5 rounded">
              <span className="text-muted-foreground">Quality:</span>
              <span className="ml-1 font-medium text-foreground">{prompt.quality || 'high'}</span>
            </div>
            <div className="p-2 bg-accent/5 rounded">
              <span className="text-muted-foreground">Resolution:</span>
              <span className="ml-1 font-medium text-foreground">{prompt.width}×{prompt.height}</span>
            </div>
            <div className="p-2 bg-accent/5 rounded">
              <span className="text-muted-foreground">Aspect:</span>
              <span className="ml-1 font-medium text-foreground">{prompt.aspect_ratio || '16:9'}</span>
            </div>
            <div className="p-2 bg-accent/5 rounded">
              <span className="text-muted-foreground">Duration:</span>
              <span className="ml-1 font-medium text-foreground">{prompt.duration.toFixed(1)}s</span>
            </div>
          </div>

          {/* Positive Prompt */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-foreground flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-green-500" />
                Positive Prompt (What to show)
              </label>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="h-7 gap-1 text-xs"
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </Button>
              )}
            </div>
            {isEditing ? (
              <Textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                className="min-h-[120px] text-sm font-mono bg-card"
                placeholder="Describe what you want to see..."
              />
            ) : (
              <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-md text-sm text-foreground leading-relaxed">
                {prompt.prompt}
              </div>
            )}
          </div>

          {/* Negative Prompt */}
          <div>
            <label className="text-xs font-medium text-foreground flex items-center gap-2 mb-2">
              <X className="w-3 h-3 text-red-500" />
              Negative Prompt (What to avoid)
            </label>
            {isEditing ? (
              <Textarea
                value={editedNegativePrompt}
                onChange={(e) => setEditedNegativePrompt(e.target.value)}
                className="min-h-[80px] text-sm font-mono bg-card"
                placeholder="blur, distortion, artifacts..."
              />
            ) : (
              <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-md text-sm text-muted-foreground leading-relaxed">
                {prompt.negative_prompt || 'None'}
              </div>
            )}
          </div>

          {/* Fountain Context */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Original Screenplay Text
            </label>
            <div className="p-3 bg-accent/5 rounded-md text-xs font-mono text-muted-foreground whitespace-pre-wrap">
              {prompt.fountainContext}
            </div>
          </div>

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={handleSave}
                size="sm"
                className="flex-1 gap-2"
              >
                <Check className="w-4 h-4" />
                Save Changes
              </Button>
              <Button
                onClick={onCancel}
                variant="ghost"
                size="sm"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Individual Generate Button */}
          {!isEditing && onGenerate && (
            <div className="pt-3 border-t border-border/50 mt-3">
              <Button
                onClick={onGenerate}
                disabled={isGenerating}
                size="sm"
                className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isGenerating ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating Video...
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    Generate This Segment
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-1.5">
                {globalQuality} · {globalResolution} · {prompt.duration.toFixed(1)}s · ~{Math.ceil(prompt.duration * 15)} credits
                <span className="block mt-0.5">⏱️ 1-2 min wait</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
