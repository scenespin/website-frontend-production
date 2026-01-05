/**
 * Scene to Video Panel
 * 
 * Allows users to generate JSON prompts directly from screenplay text
 * and optionally generate videos from those prompts
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
} from '@/components/ui/select';
import {
  Film,
  Download,
  Sparkles,
  Play,
  FileJson,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// 🆕 Feature 0105: Visual Annotations (OPTIONAL - won't break if import fails)
let VisualAnnotationPanel: any = null;
try {
  VisualAnnotationPanel = require('./VisualAnnotationPanel').VisualAnnotationPanel;
} catch (err) {
  console.warn('[SceneToVideoPanel] Visual annotations not available:', err);
}

interface Scene {
  id: string;
  number: number;
  heading: string;
  synopsis: string;
  fountainText: string;
  estimatedDuration?: number;
  hasPrompts?: boolean;
  hasVideos?: boolean;
}

interface SceneToVideoPanelProps {
  projectId: string;
  scenes?: Scene[];
  sceneId?: string;
  initialSceneText?: string;
  onPromptsGenerated?: (prompts: any[]) => void;
  onVideosGenerated?: (videos: any[]) => void;
}

export function SceneToVideoPanel({
  projectId,
  scenes = [],
  sceneId: initialSceneId = `scene_${Date.now()}`,
  initialSceneText = '',
  onPromptsGenerated,
  onVideosGenerated
}: SceneToVideoPanelProps) {
  const [selectedSceneId, setSelectedSceneId] = useState(initialSceneId);
  const [sceneText, setSceneText] = useState(initialSceneText);
  const [segmentDuration, setSegmentDuration] = useState('5');
  const [resolution, setResolution] = useState('1080p');
  const [provider, setProvider] = useState('premium');
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [isGeneratingVideos, setIsGeneratingVideos] = useState(false);
  const [generatedPrompts, setGeneratedPrompts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  
  // 🆕 Feature 0105: Visual Annotations (OPTIONAL, won't break existing flow)
  const [visualAnnotations, setVisualAnnotations] = useState<any>(null);

  // Get selected scene
  const selectedScene = scenes.find(s => s.id === selectedSceneId);

  // Update scene text when scene changes
  useEffect(() => {
    if (selectedScene) {
      setSceneText(selectedScene.fountainText || '');
      setGeneratedPrompts([]); // Clear prompts when switching scenes
      setError(null);
      setSuccess(null);
    }
  }, [selectedSceneId, selectedScene]);

  // Generate JSON prompts from scene text
  const handleGeneratePrompts = async () => {
    if (!sceneText.trim()) {
      setError('Please enter scene text first');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsGeneratingPrompts(true);

    try {
      const response = await fetch('/api/scene/to-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneText,
          segmentDuration: parseInt(segmentDuration),
          modelId: 'claude-sonnet-4',
          sceneId: selectedSceneId,
          sceneName: selectedScene?.heading || `Scene from ${projectId}`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate prompts');
      }

      const data = await response.json();
      setGeneratedPrompts(data.prompts || []);
      setSuccess(`Generated ${data.prompts?.length || 0} video prompts!`);
      
      if (onPromptsGenerated) {
        onPromptsGenerated(data.prompts);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate prompts');
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  // Generate videos from prompts
  const handleGenerateVideos = async () => {
    if (generatedPrompts.length === 0) {
      setError('Generate prompts first');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsGeneratingVideos(true);

    try {
      // SAFETY: Build request body with optional visualAnnotations
      const requestBody: any = {
        prompts: generatedPrompts,
        provider,
        resolution,
        sceneId: selectedSceneId,
        sceneName: selectedScene?.heading || `Scene from ${projectId}`,
        useVideoExtension: false
      };
      
      // 🆕 Feature 0105: Add visual annotations if present (OPTIONAL)
      if (visualAnnotations) {
        try {
          requestBody.visualAnnotations = visualAnnotations;
          console.log('[SceneToVideoPanel] Including visual annotations in request');
        } catch (err) {
          console.error('[SceneToVideoPanel] Failed to add annotations, continuing without them:', err);
          // Continue without annotations - doesn't break flow
        }
      }
      
      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate videos');
      }

      const data = await response.json();
      setSuccess(`Generated ${data.videos?.length || 0} videos!`);
      
      if (onVideosGenerated) {
        onVideosGenerated(data.videos);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate videos');
    } finally {
      setIsGeneratingVideos(false);
    }
  };

  // Download JSON prompts
  const handleDownloadJSON = () => {
    if (generatedPrompts.length === 0) {
      setError('No prompts to download. Generate prompts first.');
      return;
    }

    const dataStr = JSON.stringify(generatedPrompts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scene-prompts-${selectedSceneId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setSuccess('JSON file downloaded!');
  };

  return (
    <div className="space-y-4">
      {/* Horizontal Scene Navigator */}
      {scenes.length > 0 && (
        <Card className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 dark:text-base-content flex items-center gap-2">
              <Film className="w-5 h-5 text-indigo-500" />
              Select Scene
            </h3>
            <Badge variant="secondary">
              {scenes.length} scene{scenes.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 pb-4">
              {scenes.map((scene, index) => (
                <button
                  key={scene.id}
                  onClick={() => setSelectedSceneId(scene.id)}
                  className={`
                    flex-shrink-0 w-48 p-4 rounded-lg border-2 transition-all text-left
                    ${selectedSceneId === scene.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg scale-105'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md'
                    }
                  `}
                >
                  {/* Scene Number */}
                  <div className="flex items-center justify-between mb-2">
                    <Badge 
                      variant={selectedSceneId === scene.id ? 'default' : 'outline'}
                      className={selectedSceneId === scene.id ? 'bg-indigo-500' : ''}
                    >
                      Scene {scene.number}
                    </Badge>
                    {scene.hasVideos && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    {scene.hasPrompts && !scene.hasVideos && (
                      <FileJson className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  
                  {/* Scene Heading */}
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-base-content mb-1 truncate">
                    {scene.heading}
                  </h4>
                  
                  {/* Scene Synopsis */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {scene.synopsis || 'No synopsis'}
                  </p>
                  
                  {/* Duration */}
                  {scene.estimatedDuration && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Clock className="w-3 h-3" />
                      ~{scene.estimatedDuration}s
                    </div>
                  )}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Navigation Hint */}
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
            Click a scene to generate prompts and videos
          </div>
        </Card>
      )}

      {/* Main Generator Panel */}
      <Card className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
            <Sparkles className="w-5 h-5 text-base-content" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-base-content">
              {selectedScene ? selectedScene.heading : 'Scene-to-Video Generator'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {selectedScene 
                ? 'Generate AI video prompts and videos for this scene'
                : 'Convert screenplay text into video prompts and generate AI videos'
              }
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
            </div>
          )}

          {/* Scene Input */}
          <div className="space-y-2">
            <Label htmlFor="scene-text" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Scene Text (Fountain Format)
            </Label>
            <Textarea
              id="scene-text"
              value={sceneText}
              onChange={(e) => setSceneText(e.target.value)}
              placeholder={`INT. COFFEE SHOP - DAY

SARAH, 28, enters nervously. She spots JAMES at a corner table.

SARAH
We need to talk about what happened.

James looks up, surprised.

JAMES
I didn't expect you to actually come.`}
              className="min-h-[200px] font-mono text-sm bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
              disabled={isGeneratingPrompts || isGeneratingVideos}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paste your screenplay scene in Fountain format. The AI will analyze it and create video prompts.
            </p>
          </div>

          {/* Settings Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Segment Duration */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Segment Length
              </Label>
              <select 
                value={segmentDuration} 
                onChange={(e) => setSegmentDuration(e.target.value)}
                disabled={isGeneratingPrompts || isGeneratingVideos}
                className="select select-bordered w-full bg-[#0A0A0A] border-[#3F3F46] text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="3" className="bg-[#1A1A1A] text-[#FFFFFF]">3 seconds</option>
                <option value="5" className="bg-[#1A1A1A] text-[#FFFFFF]">5 seconds</option>
                <option value="8" className="bg-[#1A1A1A] text-[#FFFFFF]">8 seconds</option>
                <option value="10" className="bg-[#1A1A1A] text-[#FFFFFF]">10 seconds</option>
              </select>
            </div>

            {/* Resolution */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Resolution
              </Label>
              <select 
                value={resolution} 
                onChange={(e) => setResolution(e.target.value)}
                disabled={isGeneratingPrompts || isGeneratingVideos}
                className="select select-bordered w-full bg-[#0A0A0A] border-[#3F3F46] text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="720p" className="bg-[#1A1A1A] text-[#FFFFFF]">720p</option>
                <option value="1080p" className="bg-[#1A1A1A] text-[#FFFFFF]">1080p (HD)</option>
              </select>
            </div>

            {/* Provider */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                AI Provider
              </Label>
              <select 
                value={provider} 
                onChange={(e) => setProvider(e.target.value)}
                disabled={isGeneratingPrompts || isGeneratingVideos}
                className="select select-bordered w-full bg-[#0A0A0A] border-[#3F3F46] text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="premium" className="bg-[#1A1A1A] text-[#FFFFFF]">Premium 4K (Best)</option>
                <option value="professional" className="bg-[#1A1A1A] text-[#FFFFFF]">Professional 1080p</option>
                <option value="cinema" className="bg-[#1A1A1A] text-[#FFFFFF]">Cinematic</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Generate Prompts Button */}
            <Button
              onClick={handleGeneratePrompts}
              disabled={isGeneratingPrompts || isGeneratingVideos || !sceneText.trim()}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-base-content shadow-lg"
            >
              {isGeneratingPrompts ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Scene...
                </>
              ) : (
                <>
                  <FileJson className="w-4 h-4 mr-2" />
                  Generate Prompts
                </>
              )}
            </Button>

            {/* Download JSON Button */}
            {generatedPrompts.length > 0 && (
              <Button
                onClick={handleDownloadJSON}
                variant="outline"
                className="border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Download className="w-4 h-4 mr-2" />
                Download JSON
              </Button>
            )}
          </div>

          {/* 🆕 Feature 0105: Visual Annotations (OPTIONAL - only shows if component loaded and prompts exist) */}
          {VisualAnnotationPanel && generatedPrompts.length > 0 && generatedPrompts[0]?.imageUrl && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <VisualAnnotationPanel
                imageUrl={generatedPrompts[0].imageUrl}
                onAnnotationsComplete={(annotations: any) => {
                  try {
                    setVisualAnnotations(annotations);
                  } catch (err) {
                    console.error('[SceneToVideoPanel] Error setting annotations:', err);
                    // Silent failure - doesn't break flow
                  }
                }}
                disabled={isGeneratingVideos}
                defaultExpanded={false}
              />
              <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2">
                ✨ Optional: Add motion & actions to enhance your video, or skip to generate
              </p>
            </div>
          )}

          {/* Generate Videos Button (only show if prompts exist) */}
          {generatedPrompts.length > 0 && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                onClick={handleGenerateVideos}
                disabled={isGeneratingVideos}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-base-content shadow-lg"
                size="lg"
              >
                {isGeneratingVideos ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating {generatedPrompts.length} Videos...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Generate {generatedPrompts.length} Videos
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2">
                This will generate {generatedPrompts.length} video clips using {provider}
              </p>
            </div>
          )}

          {/* Prompts Preview */}
          {generatedPrompts.length > 0 && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900 dark:text-base-content">
                  Generated Prompts ({generatedPrompts.length})
                </h4>
                <Badge variant="secondary">
                  ~{generatedPrompts.length * parseInt(segmentDuration)}s total
                </Badge>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {generatedPrompts.map((prompt, index) => (
                  <div
                    key={index}
                    className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Segment {index + 1}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {segmentDuration}s
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {prompt.visualPrompt || prompt.prompt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
    </div>
  );
}
