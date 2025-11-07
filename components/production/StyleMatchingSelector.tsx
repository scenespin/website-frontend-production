'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { 
  Sparkles, 
  Image as ImageIcon, 
  FileText, 
  Sliders, 
  Eye,
  Check,
  X,
  Lightbulb,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface StyleProfile {
  profileId: string;
  projectId: string;
  sceneId?: string;
  videoUrl: string;
  extractedFrames: string[];
  lighting: {
    type: string;
    direction: string;
    quality: string;
  };
  color: {
    palette: string[];
    saturation: string;
    temperature: string;
    grading: string;
  };
  composition: {
    framing: string;
    angleHeight: string;
    depth: string;
  };
  cameraStyle: {
    movement: string;
    stability: string;
  };
  texture: {
    grain: string;
    sharpness: string;
  };
  mood: string;
  stylePromptAdditions: string[];
  negativePrompt: string;
  createdAt: string;
  confidence: number;
}

type MatchingMode = 'none' | 'profile' | 'reference' | 'custom';

interface StyleMatchingConfig {
  mode: MatchingMode;
  profileId?: string;
  referenceImageUrl?: string;
  customPromptAdditions?: string;
  intensity: number; // 0-100
  negativePrompt?: string;
}

interface StyleMatchingSelectorProps {
  projectId: string;
  initialConfig?: StyleMatchingConfig;
  onChange?: (config: StyleMatchingConfig) => void;
  onApply?: (config: StyleMatchingConfig) => void;
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function StyleMatchingSelector({
  projectId,
  initialConfig,
  onChange,
  onApply,
  className = '',
}: StyleMatchingSelectorProps) {
  const { getToken } = useAuth();

  // State
  const [config, setConfig] = useState<StyleMatchingConfig>(
    initialConfig || {
      mode: 'none',
      intensity: 75,
    }
  );
  const [profiles, setProfiles] = useState<StyleProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<StyleProfile | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showProfileBrowser, setShowProfileBrowser] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (config.mode === 'profile') {
      loadProfiles();
    }
  }, [config.mode, projectId]);

  useEffect(() => {
    if (config.profileId && profiles.length > 0) {
      const profile = profiles.find(p => p.profileId === config.profileId);
      setSelectedProfile(profile || null);
    }
  }, [config.profileId, profiles]);

  useEffect(() => {
    if (onChange) {
      onChange(config);
    }
  }, [config]);

  // ============================================================================
  // API CALLS
  // ============================================================================

  const loadProfiles = async () => {
    setIsLoadingProfiles(true);

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) return;

      const response = await fetch(`/api/style/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfiles(data.profiles || []);
      }
    } catch (error) {
      console.error('[StyleMatchingSelector] Load error:', error);
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleModeChange = (mode: MatchingMode) => {
    setConfig({
      ...config,
      mode,
      profileId: mode === 'profile' ? config.profileId : undefined,
      referenceImageUrl: mode === 'reference' ? config.referenceImageUrl : undefined,
      customPromptAdditions: mode === 'custom' ? config.customPromptAdditions : undefined,
    });
  };

  const handleProfileSelect = (profile: StyleProfile) => {
    setConfig({
      ...config,
      profileId: profile.profileId,
    });
    setSelectedProfile(profile);
    setShowProfileBrowser(false);
  };

  const handleIntensityChange = (value: number) => {
    setConfig({
      ...config,
      intensity: value,
    });
  };

  const handleCustomPromptChange = (value: string) => {
    setConfig({
      ...config,
      customPromptAdditions: value,
    });
  };

  const handleApply = () => {
    if (onApply) {
      onApply(config);
    }
  };

  const handleReset = () => {
    setConfig({
      mode: 'none',
      intensity: 75,
    });
    setSelectedProfile(null);
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const generateFinalPrompt = (): string => {
    let basePrompt = '[Your scene description here]';
    let additions: string[] = [];

    if (config.mode === 'profile' && selectedProfile) {
      additions = selectedProfile.stylePromptAdditions.map(prompt => {
        const scaledPrompt = applyIntensity(prompt, config.intensity);
        return scaledPrompt;
      });
    } else if (config.mode === 'custom' && config.customPromptAdditions) {
      additions = [config.customPromptAdditions];
    } else if (config.mode === 'reference') {
      additions = ['match visual style from reference image'];
    }

    if (additions.length === 0) {
      return basePrompt;
    }

    return `${basePrompt}, ${additions.join(', ')}`;
  };

  const applyIntensity = (prompt: string, intensity: number): string => {
    if (intensity >= 90) return `((${prompt}))`;
    if (intensity >= 75) return `(${prompt})`;
    if (intensity >= 50) return prompt;
    if (intensity >= 25) return `[${prompt}:0.8]`;
    return `[${prompt}:0.5]`;
  };

  const getIntensityLabel = (intensity: number): string => {
    if (intensity >= 90) return 'Very Strong';
    if (intensity >= 75) return 'Strong';
    if (intensity >= 50) return 'Medium';
    if (intensity >= 25) return 'Subtle';
    return 'Very Subtle';
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Style Matching
          </h2>
        </div>

        {config.mode !== 'none' && (
          <button
            onClick={handleReset}
            className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Reset
          </button>
        )}
      </div>

      {/* Mode Selection */}
      <div className="space-y-3 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Matching Mode
        </label>

        {/* None */}
        <button
          onClick={() => handleModeChange('none')}
          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
            config.mode === 'none'
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded ${config.mode === 'none' ? 'bg-purple-100 dark:bg-purple-900/40' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <X className={`w-5 h-5 ${config.mode === 'none' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">No Style Matching</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Use default AI generation without style constraints
                </p>
              </div>
            </div>
            {config.mode === 'none' && (
              <Check className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            )}
          </div>
        </button>

        {/* Profile */}
        <button
          onClick={() => handleModeChange('profile')}
          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
            config.mode === 'profile'
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded ${config.mode === 'profile' ? 'bg-purple-100 dark:bg-purple-900/40' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <Sparkles className={`w-5 h-5 ${config.mode === 'profile' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Match Style Profile</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Use a saved style profile from analyzed footage
                </p>
              </div>
            </div>
            {config.mode === 'profile' && (
              <Check className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            )}
          </div>
        </button>

        {/* Reference Image */}
        <button
          onClick={() => handleModeChange('reference')}
          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
            config.mode === 'reference'
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded ${config.mode === 'reference' ? 'bg-purple-100 dark:bg-purple-900/40' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <ImageIcon className={`w-5 h-5 ${config.mode === 'reference' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Reference Image</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Upload a reference image to match its style
                </p>
              </div>
            </div>
            {config.mode === 'reference' && (
              <Check className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            )}
          </div>
        </button>

        {/* Custom */}
        <button
          onClick={() => handleModeChange('custom')}
          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
            config.mode === 'custom'
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded ${config.mode === 'custom' ? 'bg-purple-100 dark:bg-purple-900/40' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <FileText className={`w-5 h-5 ${config.mode === 'custom' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Custom Prompt</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Write your own style instructions
                </p>
              </div>
            </div>
            {config.mode === 'custom' && (
              <Check className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            )}
          </div>
        </button>
      </div>

      {/* Profile Selection */}
      {config.mode === 'profile' && (
        <div className="mb-6">
          {selectedProfile ? (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {selectedProfile.sceneId || 'Default Style'}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedProfile.confidence}% confident • {selectedProfile.mood}
                  </p>
                </div>
                <button
                  onClick={() => setShowProfileBrowser(!showProfileBrowser)}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Change
                </button>
              </div>
              
              {selectedProfile.extractedFrames[0] && (
                <img
                  src={selectedProfile.extractedFrames[0]}
                  alt="Style preview"
                  className="w-full h-32 object-cover rounded"
                />
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowProfileBrowser(!showProfileBrowser)}
              className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400"
            >
              <Sparkles className="w-5 h-5" />
              Select Style Profile
            </button>
          )}

          {/* Profile Browser */}
          {showProfileBrowser && (
            <div className="mt-3 max-h-64 overflow-y-auto space-y-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {isLoadingProfiles ? (
                <p className="text-center text-gray-500 py-4">Loading profiles...</p>
              ) : profiles.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No style profiles found</p>
              ) : (
                profiles.map(profile => (
                  <button
                    key={profile.profileId}
                    onClick={() => handleProfileSelect(profile)}
                    className="w-full p-3 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {profile.extractedFrames[0] && (
                        <img
                          src={profile.extractedFrames[0]}
                          alt="Profile preview"
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-gray-900 dark:text-white truncate">
                          {profile.sceneId || 'Default Style'}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {profile.mood} • {profile.confidence}%
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Custom Prompt Input */}
      {config.mode === 'custom' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Style Instructions
          </label>
          <textarea
            value={config.customPromptAdditions || ''}
            onChange={(e) => handleCustomPromptChange(e.target.value)}
            placeholder="E.g., cinematic lighting, warm tones, shallow depth of field..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      )}

      {/* Intensity Slider */}
      {config.mode !== 'none' && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              Style Intensity
            </label>
            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
              {getIntensityLabel(config.intensity)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={config.intensity}
            onChange={(e) => handleIntensityChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>Subtle</span>
            <span>Strong</span>
          </div>
        </div>
      )}

      {/* Prompt Preview */}
      <div className="mb-6">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center justify-between w-full mb-2"
        >
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Final Prompt Preview
          </span>
          {showPreview ? (
            <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        {showPreview && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <code className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
              {generateFinalPrompt()}
            </code>
            
            {config.mode !== 'none' && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>
                    Style instructions are added to your prompt with intensity weighting.
                    Adjust the slider to control how strongly the style is applied.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Apply Button */}
      {onApply && (
        <button
          onClick={handleApply}
          disabled={config.mode === 'profile' && !selectedProfile}
          className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          Apply Style Matching
        </button>
      )}
    </div>
  );
}

