'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { 
  Upload, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  Edit2, 
  Save, 
  X,
  Sparkles,
  Film,
  Palette,
  Camera,
  Lightbulb
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface StyleProfile {
  profileId: string;
  projectId: string;
  videoUrl: string;
  sceneId?: string;
  createdAt: string;
  updatedAt: string;
  attributes: {
    lighting: {
      type: string;
      intensity: string;
      colorTemperature: string;
      direction: string;
    };
    color: {
      palette: string[];
      saturation: string;
      contrast: string;
      mood: string;
    };
    composition: {
      framingStyle: string;
      depthOfField: string;
      symmetry: string;
      ruleOfThirds: boolean;
    };
    cameraStyle: {
      movement: string;
      anglePreference: string;
      stabilization: string;
      lens: string;
    };
    texture: {
      grainLevel: string;
      sharpness: string;
      filmicQuality: string;
    };
  };
  suggestedPromptAdditions: string[];
  confidence: number;
}

interface StyleAnalyzerProps {
  projectId: string;
  videoUrl?: string;
  sceneId?: string;
  onAnalysisComplete?: (profile: StyleProfile) => void;
  className?: string;
  autoStart?: boolean; // Auto-start analysis when videoUrl is provided
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function StyleAnalyzer({
  projectId,
  videoUrl: initialVideoUrl,
  sceneId,
  onAnalysisComplete,
  className = '',
  autoStart = false,
}: StyleAnalyzerProps) {
  const { getToken } = useAuth();

  // State
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [profile, setProfile] = useState<StyleProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<StyleProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (initialVideoUrl) {
      setVideoUrl(initialVideoUrl);
    }
  }, [initialVideoUrl]);

  // ============================================================================
  // API CALLS
  // ============================================================================

  const analyzeVideo = async () => {
    if (!videoUrl) {
      setError('Please provide a video URL');
      return;
    }

    // Check credits before starting (15 credits required)
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const creditCheckResponse = await fetch('/api/credits/check', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: 15 }),
      });

      if (creditCheckResponse.ok) {
        const creditData = await creditCheckResponse.json();
        if (!creditData.sufficient) {
          setError(`Insufficient credits. You need 15 credits to analyze a video. You have ${creditData.currentBalance || 0} credits.`);
          return;
        }
      }
    } catch (creditError: any) {
      console.warn('[StyleAnalyzer] Credit check failed:', creditError);
      // Continue anyway - backend will handle credit check
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisProgress(0);

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      console.log('[StyleAnalyzer] Starting analysis for:', videoUrl);

      // Simulate progress updates (in production, use WebSocket or polling)
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 10, 90));
      }, 1000);

      const response = await fetch('/api/style/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          videoUrl,
          sceneId,
        }),
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Analysis failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('[StyleAnalyzer] Analysis complete:', data);

      setProfile(data.profile);
      setEditedProfile(data.profile);

      if (onAnalysisComplete) {
        onAnalysisComplete(data.profile);
      }

    } catch (err) {
      console.error('[StyleAnalyzer] Error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-start analysis when videoUrl is set and autoStart is true
  useEffect(() => {
    if (autoStart && videoUrl && !profile && !isAnalyzing && !hasAutoStarted) {
      setHasAutoStarted(true);
      // Delay to ensure component is fully mounted and analyzeVideo is available
      const timer = setTimeout(() => {
        analyzeVideo();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, videoUrl, profile, isAnalyzing, hasAutoStarted]);

  const saveChanges = async () => {
    if (!editedProfile) return;

    setIsSaving(true);
    setError(null);

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/style/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editedProfile),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Save failed: ${response.status}`);
      }

      const data = await response.json();
      setProfile(data.profile);
      setEditedProfile(data.profile);
      setIsEditing(false);

      console.log('[StyleAnalyzer] Profile saved successfully');

    } catch (err) {
      console.error('[StyleAnalyzer] Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEditing = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderAttribute = (
    category: string,
    key: string,
    value: any,
    icon: React.ReactNode
  ) => {
    const isEditMode = isEditing && editedProfile;

    if (Array.isArray(value)) {
      return (
        <div key={key} className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            {icon}
            <span className="font-medium capitalize">{key}:</span>
          </div>
          <div className="flex flex-wrap gap-2 ml-6">
            {value.map((item, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-[#0A0A0A] border border-[#3F3F46] text-[#00D9FF] rounded-full text-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      );
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <div key={key} className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            {icon}
            <span className="font-semibold capitalize text-lg">{key}</span>
          </div>
          <div className="ml-6 space-y-2">
            {Object.entries(value).map(([subKey, subValue]) => (
              <div key={subKey} className="flex items-center gap-2">
                <span className="text-[#B3B3B3] capitalize min-w-[150px]">
                  {subKey.replace(/([A-Z])/g, ' $1').trim()}:
                </span>
                {isEditMode ? (
                  <input
                    type="text"
                    value={String(subValue)}
                    onChange={(e) => {
                      const newProfile = { ...editedProfile };
                      (newProfile.attributes as any)[category][key][subKey] = e.target.value;
                      setEditedProfile(newProfile);
                    }}
                    className="flex-1 px-3 py-1 border border-[#3F3F46] rounded bg-[#0A0A0A] text-[#FFFFFF]"
                  />
                ) : (
                  <span className="font-medium text-[#FFFFFF]">{String(subValue)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div key={key} className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[#B3B3B3] capitalize">
          {key.replace(/([A-Z])/g, ' $1').trim()}:
        </span>
        {isEditMode ? (
          <input
            type="text"
            value={String(value)}
            onChange={(e) => {
              const newProfile = { ...editedProfile };
              (newProfile.attributes as any)[category][key] = e.target.value;
              setEditedProfile(newProfile);
            }}
            className="flex-1 px-3 py-1 border border-[#3F3F46] rounded bg-[#0A0A0A] text-[#FFFFFF]"
          />
        ) : (
          <span className="font-medium text-[#FFFFFF]">{String(value)}</span>
        )}
      </div>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`bg-[#141414] border border-[#3F3F46] rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-[#DC143C]" />
          <h2 className="text-2xl font-bold text-[#FFFFFF]">
            Style Analyzer
          </h2>
        </div>
        
        {profile && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={saveChanges}
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#DC143C] text-white rounded-lg hover:bg-[#B91238] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save
                </button>
                <button
                  onClick={cancelEditing}
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#1F1F1F] text-[#FFFFFF] rounded-lg hover:bg-[#2A2A2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-[#DC143C] text-white rounded-lg hover:bg-[#B91238] transition-colors flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-[#DC143C]/20 border border-[#DC143C] rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#DC143C] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-[#FFFFFF]">Analysis Error</p>
            <p className="text-sm text-[#B3B3B3]">{error}</p>
          </div>
        </div>
      )}

      {/* Video URL Input */}
      {!profile && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#FFFFFF] mb-2">
            Video URL
          </label>
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://example.com/video.mp4"
            disabled={isAnalyzing}
            className="w-full px-4 py-2 border border-[#3F3F46] rounded-lg bg-[#0A0A0A] text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#DC143C] disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      )}

      {/* Analyze Button */}
      {!profile && (
        <button
          onClick={analyzeVideo}
          disabled={isAnalyzing || !videoUrl}
          className="w-full px-6 py-3 bg-[#DC143C] text-white rounded-lg hover:bg-[#B91238] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg font-medium"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing... {analysisProgress}%
            </>
          ) : (
            <>
              <Eye className="w-5 h-5" />
              Analyze Video Style
            </>
          )}
        </button>
      )}

      {/* Analysis Progress */}
      {isAnalyzing && (
        <div className="mt-4">
          <div className="w-full bg-[#1F1F1F] rounded-full h-3 overflow-hidden">
            <div
              className="bg-[#DC143C] h-full transition-all duration-300"
              style={{ width: `${analysisProgress}%` }}
            />
          </div>
          <p className="text-sm text-[#B3B3B3] mt-2 text-center">
            Extracting frames and analyzing visual style...
          </p>
        </div>
      )}

      {/* Style Profile Display */}
      {profile && (
        <div className="space-y-6">
          {/* Success Banner */}
          <div className="p-4 bg-[#00D9FF]/20 border border-[#00D9FF] rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#00D9FF]" />
            <div>
              <p className="font-medium text-[#FFFFFF]">
                Style Analysis Complete
              </p>
              <p className="text-sm text-[#B3B3B3]">
                Confidence: {Math.round(profile.confidence * 100)}%
              </p>
            </div>
          </div>

          {/* Video Info */}
          <div className="p-4 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Film className="w-5 h-5 text-[#808080]" />
              <span className="font-medium text-[#FFFFFF]">Video Source</span>
            </div>
            <p className="text-sm text-[#B3B3B3] break-all ml-7">
              {profile.videoUrl}
            </p>
          </div>

          {/* Lighting */}
          <div className="border-t border-[#3F3F46] pt-4">
            {renderAttribute('lighting', 'lighting', profile.attributes.lighting, 
              <Lightbulb className="w-5 h-5 text-[#FFD700]" />
            )}
          </div>

          {/* Color */}
          <div className="border-t border-[#3F3F46] pt-4">
            {renderAttribute('color', 'color', profile.attributes.color,
              <Palette className="w-5 h-5 text-[#DC143C]" />
            )}
          </div>

          {/* Composition */}
          <div className="border-t border-[#3F3F46] pt-4">
            {renderAttribute('composition', 'composition', profile.attributes.composition,
              <Camera className="w-5 h-5 text-[#00D9FF]" />
            )}
          </div>

          {/* Camera Style */}
          <div className="border-t border-[#3F3F46] pt-4">
            {renderAttribute('cameraStyle', 'cameraStyle', profile.attributes.cameraStyle,
              <Film className="w-5 h-5 text-[#DC143C]" />
            )}
          </div>

          {/* Texture */}
          <div className="border-t border-[#3F3F46] pt-4">
            {renderAttribute('texture', 'texture', profile.attributes.texture,
              <Sparkles className="w-5 h-5 text-[#00D9FF]" />
            )}
          </div>

          {/* Suggested Prompt Additions */}
          <div className="border-t border-[#3F3F46] pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-[#DC143C]" />
              <span className="font-semibold text-lg text-[#FFFFFF]">
                Suggested Prompt Additions
              </span>
            </div>
            <div className="ml-7 space-y-2">
              {profile.suggestedPromptAdditions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg text-sm"
                >
                  <code className="text-[#00D9FF]">{suggestion}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Re-analyze Button */}
          <div className="border-t border-[#3F3F46] pt-4">
            <button
              onClick={() => {
                setProfile(null);
                setEditedProfile(null);
                setIsEditing(false);
                setAnalysisProgress(0);
              }}
              className="w-full px-4 py-2 bg-[#1F1F1F] text-[#FFFFFF] rounded-lg hover:bg-[#2A2A2A] transition-colors flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Analyze Different Video
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

