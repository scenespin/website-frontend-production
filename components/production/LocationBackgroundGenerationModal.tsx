'use client';
/**
 * Location Background Generation Modal
 * 
 * Complete workflow for generating location background packages
 * Backgrounds are close-up views of specific areas within a location
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle2, AlertCircle, Image } from 'lucide-react';
import LocationBackgroundPackageSelector from './LocationBackgroundPackageSelector';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

interface LocationBackgroundGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
  locationName: string;
  projectId: string;
  locationProfile: any; // LocationProfile type
  location?: any; // Full location object with angleVariations
  onComplete?: (result: any) => void;
}

type GenerationStep = 'package' | 'generating' | 'complete' | 'error';

// Model information helper
const getModelStrengths = (modelId: string): string => {
  const strengths: Record<string, string> = {
    'runway-gen4-image': 'Fast generation, good consistency, 1080p quality',
    'nano-banana-pro': 'Excellent detail quality, 4K resolution, best for textures and fine details',
    'nano-banana-pro-2k': 'Good detail quality, 2K resolution, balanced performance',
    'flux2-max-4k-16:9': 'Great architectural details, supports grounding search, 4K quality',
    'flux2-pro-4k': 'High quality architectural rendering, 4K resolution',
    'flux2-pro-2k': 'Good quality, 2K resolution, faster generation'
  };
  return strengths[modelId] || 'Standard quality generation';
};

const isRecommendedForBackgrounds = (modelId: string): boolean => {
  // Models particularly good for close-up detail work
  return [
    'nano-banana-pro',
    'nano-banana-pro-2k',
    'flux2-max-4k-16:9',
    'flux2-pro-4k'
  ].includes(modelId);
};

export default function LocationBackgroundGenerationModal({
  isOpen,
  onClose,
  locationId,
  locationName,
  projectId,
  locationProfile,
  location,
  onComplete
}: LocationBackgroundGenerationModalProps) {
  const { getToken } = useAuth();
  
  const [step, setStep] = useState<GenerationStep>('package');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('standard');
  const [selectedBackgroundType, setSelectedBackgroundType] = useState<string>('window'); // 🔥 Feature 0190: Single background type selection
  const [providerId, setProviderId] = useState<string>('');
  const [sourceType, setSourceType] = useState<'reference-images' | 'angle-variations'>('reference-images');
  const [selectedAngleId, setSelectedAngleId] = useState<string>('');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night' | ''>('');
  const [weather, setWeather] = useState<'sunny' | 'cloudy' | 'rainy' | 'snowy' | ''>('');
  const [additionalPrompt, setAdditionalPrompt] = useState<string>('');
  const [models, setModels] = useState<Array<{ id: string; name: string; referenceLimit: number; quality: '1080p' | '4K'; credits: number; enabled: boolean }>>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [jobId, setJobId] = useState<string | null>(null);
  
  // Load unified model list (single dropdown)
  useEffect(() => {
    if (!isOpen) return;
    async function loadModels() {
      setIsLoadingModels(true);
      try {
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) {
          toast.error('Authentication required');
          return;
        }
        const response = await fetch('/api/model-selection/locations', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to load models');
        const data = await response.json();
        const availableModels = data.data?.models || data.models || [];
        const enabledModels = availableModels.filter((m: any) => m.enabled);
        setModels(enabledModels);
        if (enabledModels.length > 0) {
          setProviderId(enabledModels[0].id);
        } else {
          setProviderId('');
        }
      } catch (error: any) {
        console.error('[LocationBackgroundGenerationModal] Failed to load models:', error);
        toast.error('Failed to load available models');
      } finally {
        setIsLoadingModels(false);
      }
    }
    loadModels();
  }, [isOpen, getToken]);

  // Get available angles for source selection
  const availableAngles = location?.angleVariations || [];
  
  // Calculate total credits
  const backgroundCounts: Record<string, number> = {
    single: 1, // 🔥 Feature 0190: Single background
    basic: 3,
    standard: 6,
    premium: 9
  };
  const backgroundCount = backgroundCounts[selectedPackageId] || 6;
  const selectedModel = models.find(m => m.id === providerId);
  const creditsPerImage = selectedModel?.credits || 20;
  const totalCredits = backgroundCount * creditsPerImage;
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    setJobId(null);
    
    try {
      const token = await getToken({ template: 'wryda-backend' });
      
      if (!token) {
        throw new Error('Failed to get backend token. Please try refreshing the page.');
      }
      
      if (!providerId || providerId.trim() === '') {
        throw new Error('Please select a model before generating backgrounds.');
      }
      
      // Default values
      const defaultTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = timeOfDay && timeOfDay.trim() !== '' 
        ? (timeOfDay.trim() as 'morning' | 'afternoon' | 'evening' | 'night')
        : 'afternoon';
      
      const defaultWeather: 'sunny' | 'cloudy' | 'rainy' | 'snowy' = weather && weather.trim() !== ''
        ? (weather.trim() as 'sunny' | 'cloudy' | 'rainy' | 'snowy')
        : 'sunny';

      const apiUrl = `/api/location-bank/${locationId}/generate-backgrounds`;
      const derivedQuality = selectedModel?.quality === '4K' ? 'high-quality' : 'standard';
      const requestBody: any = {
        packageId: selectedPackageId,
        quality: derivedQuality,
        providerId: providerId,
        sourceType: sourceType,
        selectedAngleId: sourceType === 'angle-variations' && selectedAngleId ? selectedAngleId : undefined,
        additionalPrompt: additionalPrompt.trim() || undefined,
        timeOfDay: defaultTimeOfDay,
        weather: defaultWeather,
        projectId: projectId,
        screenplayId: projectId
      };
      
      // Add selectedBackgroundType for single mode
      if (selectedPackageId === 'single') {
        requestBody.selectedBackgroundType = selectedBackgroundType;
      }
      
      console.log('[LocationBackgroundGeneration] Request body:', requestBody);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to start generation' }));
        throw new Error(errorData.error?.message || errorData.error || 'Failed to start background generation');
      }
      
      const result = await response.json();
      
      // Store jobId and close modal immediately (async pattern)
      if (result.jobId) {
        setJobId(result.jobId);
        console.log('[LocationBackgroundGeneration] Job started:', result.jobId);
        
        // Close modal immediately - job runs in background
        handleReset();
        onClose();
        
        // Show success toast with link to Jobs tab
        toast.success('Background generation started!', {
          description: 'View in Jobs tab to track progress.',
          action: {
            label: 'View Jobs',
            onClick: () => {
              window.location.href = `/production?tab=jobs&projectId=${projectId}`;
            }
          },
          duration: 5000
        });
        
        // Call onComplete with jobId
        if (onComplete) {
          onComplete({ jobId: result.jobId, backgrounds: [] });
        }
      } else {
        throw new Error('No job ID returned from server');
      }
      
    } catch (err: any) {
      console.error('[LocationBackgroundGeneration] Error:', err);
      setError(err.message || 'An error occurred during generation');
      setStep('error');
      
      toast.error('Failed to start background generation!', {
        description: err.message || 'Please try again.',
        duration: 5000
      });
      setIsGenerating(false);
    }
  };
  
  const handleReset = () => {
    setStep('package');
    setSelectedPackageId('standard');
    setSelectedBackgroundType('window'); // 🔥 Feature 0190: Reset single background type selection
    setSourceType('reference-images');
    setSelectedAngleId('');
    setTimeOfDay('');
    setWeather('');
    setAdditionalPrompt('');
    setGenerationResult(null);
    setError('');
    setIsGenerating(false);
    setJobId(null);
  };
  
  const handleClose = () => {
    if (isGenerating) {
      return;
    }
    handleReset();
    onClose();
  };
  
  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-base-200 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-base-content/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-base-200 border-b border-base-content/20 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-base-content">Generate Background Package</h2>
                <p className="text-base-content/60 mt-1">Create close-up backgrounds for {locationName}</p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-base-300 rounded-lg transition-colors"
                disabled={isGenerating}
              >
                <X className="w-6 h-6 text-base-content/60" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6">
              
              {/* Step 1: Package Selection */}
              {step === 'package' && (
                <div className="space-y-6">
                  {/* Model Selection (unified dropdown) */}
                  <div className="bg-base-300 rounded-lg p-4 border border-base-content/10">
                    <h3 className="text-sm font-semibold text-base-content mb-4">
                      Step 1: Select Model
                    </h3>
                    {isLoadingModels ? (
                      <div className="px-4 py-3 bg-base-200 border border-base-content/20 rounded-lg text-base-content/60 text-sm">
                        Loading models...
                      </div>
                    ) : models.length === 0 ? (
                      <div className="px-4 py-3 bg-base-200 border border-base-content/20 rounded-lg text-base-content/60 text-sm">
                        No models available
                      </div>
                    ) : (
                      <>
                        <select
                          value={providerId}
                          onChange={(e) => setProviderId(e.target.value)}
                          className="w-full px-4 py-2.5 bg-base-200 border border-base-content/20 rounded-lg text-base-content text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 focus:border-[#8B5CF6]"
                        >
                          {models.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.name} ({model.credits} credits)
                            </option>
                          ))}
                        </select>
                        {selectedModel && (
                          <div className="mt-3 p-3 bg-base-200 border border-base-content/20 rounded-lg space-y-2">
                            <div>
                              <p className="text-xs font-medium text-base-content/70 mb-1">Best for:</p>
                              <p className="text-xs text-base-content/60">
                                {getModelStrengths(selectedModel.id)}
                              </p>
                            </div>
                            {isRecommendedForBackgrounds(selectedModel.id) && (
                              <div className="p-2 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-400">
                                ✓ Recommended for close-up detail work
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Source Selection */}
                  <div className="bg-base-300 rounded-lg p-4 border border-base-content/10">
                    <h3 className="text-sm font-semibold text-base-content mb-4">
                      Step 3: Generate From
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="source"
                          value="reference-images"
                          checked={sourceType === 'reference-images'}
                          onChange={(e) => setSourceType(e.target.value as 'reference-images')}
                          className="w-4 h-4 text-[#8B5CF6]"
                        />
                        <div>
                          <span className="text-sm text-base-content font-medium">Reference Images (Original)</span>
                          <p className="text-xs text-base-content/60 mt-1">
                            Uses original location uploads - most consistent with base location
                          </p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="source"
                          value="angle-variations"
                          checked={sourceType === 'angle-variations'}
                          onChange={(e) => setSourceType(e.target.value as 'angle-variations')}
                          className="w-4 h-4 text-[#8B5CF6]"
                          disabled={availableAngles.length === 0}
                        />
                        <div className="flex-1">
                          <span className="text-sm text-base-content font-medium">Angle Variations</span>
                          <p className="text-xs text-base-content/60 mt-1">
                            Uses generated angles - matches lighting/weather of selected angle
                          </p>
                          {sourceType === 'angle-variations' && availableAngles.length > 0 && (
                            <select
                              value={selectedAngleId}
                              onChange={(e) => setSelectedAngleId(e.target.value)}
                              className="mt-2 w-full px-3 py-2 bg-base-200 border border-base-content/20 rounded-lg text-base-content text-sm"
                            >
                              <option value="">All angles (default)</option>
                              {availableAngles.map((angle: any) => (
                                <option key={angle.id} value={angle.id}>
                                  {angle.angle} {angle.timeOfDay ? `(${angle.timeOfDay})` : ''}
                                </option>
                              ))}
                            </select>
                          )}
                          {availableAngles.length === 0 && (
                            <p className="text-xs text-orange-400 mt-1">
                              No angle variations available. Generate angles first or use reference images.
                            </p>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  {/* Package Selection */}
                  <div>
                    <h3 className="text-sm font-semibold text-base-content mb-4">
                      Step 4: Select Package
                    </h3>
                    <LocationBackgroundPackageSelector
                      locationName={locationName}
                      onSelectPackage={(packageId) => {
                        setSelectedPackageId(packageId);
                      }}
                      selectedPackageId={selectedPackageId}
                      creditsPerImage={creditsPerImage}
                      // 🔥 Feature 0190: Single background type selection
                      selectedBackgroundType={selectedBackgroundType}
                      onSelectedBackgroundTypeChange={setSelectedBackgroundType}
                    />
                  </div>
                  
                  {/* Time of Day and Weather Selection */}
                  <div className="bg-base-300 rounded-lg p-4 border border-base-content/10">
                    <h3 className="text-sm font-semibold text-base-content mb-4">
                      Step 5: Optional - Lighting & Atmosphere
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-base-content/60 mb-2 block">Time of Day (Optional)</label>
                        <select
                          value={timeOfDay}
                          onChange={(e) => setTimeOfDay(e.target.value as any)}
                          className="w-full px-3 py-2 bg-base-200 border border-base-content/20 rounded-lg text-base-content text-sm focus:outline-none focus:border-[#DC143C]"
                        >
                          <option value="">None</option>
                          <option value="morning">Morning</option>
                          <option value="afternoon">Afternoon</option>
                          <option value="evening">Evening</option>
                          <option value="night">Night</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-base-content/60 mb-2 block">Weather (Optional)</label>
                        <select
                          value={weather}
                          onChange={(e) => setWeather(e.target.value as any)}
                          className="w-full px-3 py-2 bg-base-200 border border-base-content/20 rounded-lg text-base-content text-sm focus:outline-none focus:border-[#DC143C]"
                        >
                          <option value="">None</option>
                          <option value="sunny">Sunny</option>
                          <option value="cloudy">Cloudy</option>
                          <option value="rainy">Rainy</option>
                          <option value="snowy">Snowy</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Prompt */}
                  <div className="bg-base-300 rounded-lg p-4 border border-base-content/10">
                    <h3 className="text-sm font-semibold text-base-content mb-4">
                      Step 6: Additional Prompt (Optional)
                    </h3>
                    <textarea
                      value={additionalPrompt}
                      onChange={(e) => setAdditionalPrompt(e.target.value)}
                      placeholder="Add any specific details, color codes, or grounding search keywords..."
                      rows={3}
                      className="w-full px-3 py-2 bg-base-200 border border-base-content/20 rounded-lg text-base-content text-sm focus:outline-none focus:border-[#DC143C] resize-none"
                    />
                    <p className="text-xs text-base-content/50 mt-2">
                      Supports color hex codes (e.g., #FF0000) and grounding search keywords
                    </p>
                  </div>
                  
                  {/* Credits Summary */}
                  <div className="bg-base-300 rounded-lg p-4 border border-base-content/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-base-content/60">Total Cost</div>
                        <div className="text-2xl font-bold text-base-content">{totalCredits} credits</div>
                        <div className="text-xs text-base-content/50 mt-1">
                          {backgroundCount} backgrounds × {creditsPerImage} credits
                        </div>
                      </div>
                      <Image className="w-8 h-8 text-base-content/40" />
                    </div>
                  </div>
                  
                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !providerId || !selectedPackageId || (selectedPackageId === 'single' && !selectedBackgroundType)}
                    className="w-full py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:bg-base-content/20 disabled:text-base-content/40 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : selectedPackageId === 'single' ? (
                      'Generate Single Background'
                    ) : (
                      'Generate Backgrounds'
                    )}
                  </button>
                </div>
              )}
              
              {/* Error State */}
              {step === 'error' && (
                <div className="text-center py-8">
                  <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-base-content mb-2">Generation Failed</h3>
                  <p className="text-base-content/60 mb-6">{error}</p>
                  <button
                    onClick={() => setStep('package')}
                    className="px-6 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}

