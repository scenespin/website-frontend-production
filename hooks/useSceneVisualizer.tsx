/**
 * useSceneVisualizer Hook
 * 
 * Manages state and API calls for the Scene Visualizer feature
 */

import { useState, useCallback } from 'react';

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

export interface SceneVisualizerSettings {
    segmentDuration: 3 | 5 | 10 | 30 | 60;
    resolution: '720p' | '1080p' | '4K';
    quality: 'low' | 'medium' | 'high' | 'ultra';
    modelId: string;
}

interface GeneratePromptsResult {
    success: boolean;
    prompts: ScenePrompt[];
    totalSegments: number;
    totalDuration: number;
    creditsUsed: number;
    modelUsed: string;
}

interface GenerateVideoResult {
    success: boolean;
    videoUrl: string;
    videoKey: string;
    durationSeconds: number;
    creditsUsed: number;
    provider: 'sora-2' | 'sora-2-pro' | 'veo-3';
    resolution: string;
    status: 'processing' | 'completed';
}

export function useSceneVisualizer() {
    const [prompts, setPrompts] = useState<ScenePrompt[]>([]);
    const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [settings, setSettings] = useState<SceneVisualizerSettings>({
        segmentDuration: 5,
        resolution: '1080p',
        quality: 'high',
        modelId: 'gemini-2.0-flash-001',
    });

    /**
     * Generate visual prompts from Fountain text (Stage 1)
     */
    const generatePrompts = useCallback(async (fountainText: string): Promise<GeneratePromptsResult | null> => {
        setIsGeneratingPrompts(true);
        setError(null);

        try {
            const token = localStorage.getItem('jwt_token');
            if (!token) {
                throw new Error('Authentication required');
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
            
            const response = await fetch(`${apiUrl}/api/scene/to-prompts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fountainText,
                    segmentDuration: settings.segmentDuration,
                    desiredModelId: settings.modelId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data: GeneratePromptsResult = await response.json();
            
            if (data.success && data.prompts) {
                setPrompts(data.prompts);
                return data;
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to generate prompts';
            setError(errorMessage);
            console.error('[useSceneVisualizer] Generate prompts error:', err);
            return null;
        } finally {
            setIsGeneratingPrompts(false);
        }
    }, [settings.segmentDuration, settings.modelId]);

    /**
     * Generate video from prompts (Stage 2)
     */
    const generateVideo = useCallback(async (
        prompts: ScenePrompt[],
        provider: 'sora-2' | 'sora-2-pro' | 'veo-3' = 'sora-2',
        sceneId: string,
        sceneName: string
    ): Promise<GenerateVideoResult | null> => {
        setIsGeneratingVideo(true);
        setError(null);

        try {
            const token = localStorage.getItem('jwt_token');
            if (!token) {
                throw new Error('Authentication required');
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

            const response = await fetch(`${apiUrl}/api/video/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    prompts,
                    provider,
                    resolution: settings.resolution,
                    sceneId,
                    sceneName
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data: GenerateVideoResult = await response.json();
            
            if (data.success) {
                return data;
            } else {
                throw new Error('Video generation failed');
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to generate video';
            setError(errorMessage);
            console.error('[useSceneVisualizer] Generate video error:', err);
            return null;
        } finally {
            setIsGeneratingVideo(false);
        }
    }, [settings.resolution]);

    /**
     * Update a specific prompt
     */
    const updatePrompt = useCallback((index: number, updates: Partial<ScenePrompt>) => {
        setPrompts(prev => {
            const newPrompts = [...prev];
            newPrompts[index] = { ...newPrompts[index], ...updates };
            return newPrompts;
        });
    }, []);

    /**
     * Export prompts as JSON
     */
    const exportJSON = useCallback((includeSettings: boolean = true) => {
        const exportData: any = {
            prompts: prompts.map(p => ({
                segmentIndex: p.segmentIndex,
                startTime: p.startTime,
                endTime: p.endTime,
                duration: p.duration,
                prompt: p.prompt,
                negative_prompt: p.negative_prompt,
                width: p.width,
                height: p.height,
                aspect_ratio: p.aspect_ratio,
                quality: p.quality,
            })),
            totalSegments: prompts.length,
            totalDuration: prompts.length > 0 ? prompts[prompts.length - 1].endTime : 0,
        };

        if (includeSettings) {
            exportData.settings = settings;
        }

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scene-prompts-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [prompts, settings]);

    /**
     * Calculate estimated cost
     */
    const estimateCost = useCallback((includeVideoGeneration: boolean = false): number => {
        // Stage 1: Prompt generation (~100-150 credits per scene)
        const promptGenerationCost = 150;

        if (!includeVideoGeneration) {
            return promptGenerationCost;
        }

        // Stage 2: Video generation cost varies by provider
        const totalDuration = prompts.length > 0 ? prompts[prompts.length - 1].endTime : 0;
        
        // Sora 2 pricing: 10 credits/sec (720p), 30 credits/sec (720p Pro), 50 credits/sec (1080p Pro)
        let creditsPerSecond = 10; // Default sora-2 @ 720p
        
        if (settings.resolution === '1080p') {
            creditsPerSecond = 50; // sora-2-pro @ 1080p
        } else if (settings.resolution === '4K') {
            creditsPerSecond = 100; // Estimated for 4K
        }

        const videoGenerationCost = Math.ceil(totalDuration * creditsPerSecond);

        return promptGenerationCost + videoGenerationCost;
    }, [prompts, settings.resolution]);

    /**
     * Clear all prompts
     */
    const clearPrompts = useCallback(() => {
        setPrompts([]);
        setError(null);
    }, []);

    /**
     * Update settings
     */
    const updateSettings = useCallback((newSettings: Partial<SceneVisualizerSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    }, []);

    return {
        // State
        prompts,
        isGeneratingPrompts,
        isGeneratingVideo,
        error,
        settings,
        
        // Actions
        generatePrompts,
        generateVideo,
        updatePrompt,
        exportJSON,
        estimateCost,
        clearPrompts,
        updateSettings,
        setPrompts,
    };
}

