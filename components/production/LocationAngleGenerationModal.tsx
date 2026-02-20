'use client';
/**
 * Location Angle Generation Modal
 * 
 * Complete workflow for generating location angle packages
 * Part of Feature 0098: Complete Character & Location Consistency System
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle2, AlertCircle, MapPin } from 'lucide-react';
import LocationAnglePackageSelector from './LocationAnglePackageSelector';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { hasLocationReference, showReferenceRequired } from '@/utils/referenceImageValidation';
import { extractCreditError, getCreditErrorDisplayMessage, syncCreditsFromError } from '@/utils/creditGuard';
// Safety errors are handled in job result monitoring (async pattern)

interface LocationAngleGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
  locationName: string;
  projectId: string;
  locationProfile: any; // LocationProfile type
  onComplete?: (result: any) => void;
}

type GenerationStep = 'package' | 'generating' | 'complete' | 'error';

export default function LocationAngleGenerationModal({
  isOpen,
  onClose,
  locationId,
  locationName,
  projectId,
  locationProfile,
  onComplete
}: LocationAngleGenerationModalProps) {
  const { getToken } = useAuth();
  
  const [step, setStep] = useState<GenerationStep>('package');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('standard');
  const [selectedAngle, setSelectedAngle] = useState<string>('front'); // 🔥 Feature 0190: Single angle selection
  const [providerId, setProviderId] = useState<string>('');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night' | ''>(''); // 🔥 NEW: Time of day
  const [weather, setWeather] = useState<'sunny' | 'cloudy' | 'rainy' | 'snowy' | ''>(''); // 🔥 NEW: Weather
  const [additionalPrompt, setAdditionalPrompt] = useState<string>(''); // 🔥 NEW: Additional prompt for grounding search, color codes, etc.
  const [models, setModels] = useState<Array<{ id: string; name: string; referenceLimit: number; quality: '1080p' | '4K'; credits: number; enabled: boolean }>>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [jobId, setJobId] = useState<string | null>(null);
  
  // Note: Safety errors are now handled in job results (async pattern)
  // Frontend will check job status and show dialog when job completes with safety errors

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
        console.error('[LocationAngleGenerationModal] Failed to load models:', error);
        toast.error('Failed to load available models');
      } finally {
        setIsLoadingModels(false);
      }
    }
    loadModels();
  }, [isOpen, getToken]);
  
  // Map package IDs to angle arrays
  const packageToAngles: Record<string, Array<{ angle: string }>> = {
    basic: [
      { angle: 'front' },
      { angle: 'corner' },
      { angle: 'wide' }
    ],
    standard: [
      { angle: 'front' },
      { angle: 'corner' },
      { angle: 'wide' },
      { angle: 'low-angle' },
      { angle: 'entrance' },
      { angle: 'foreground-framing' }
    ],
    premium: [
      { angle: 'front' },
      { angle: 'corner' },
      { angle: 'wide' },
      { angle: 'low-angle' },
      { angle: 'entrance' },
      { angle: 'foreground-framing' },
      { angle: 'aerial' },
      { angle: 'pov' },
      { angle: 'detail' },
      { angle: 'atmospheric' },
      { angle: 'golden-hour' }
    ]
  };
  
  const handleGenerate = async () => {
    if (!hasLocationReference(locationProfile)) {
      showReferenceRequired(toast, setError);
      return;
    }
    setIsGenerating(true);
    setError('');
    setJobId(null);
    
    try {
      // Call backend API to generate angle package (async job pattern)
      const token = await getToken({ template: 'wryda-backend' });
      
      if (!token) {
        throw new Error('Failed to get backend token. Please try refreshing the page.');
      }
      
      const apiUrl = `/api/location-bank/generate-angles`;
      
      // 🔥 FIX: Require providerId - no fallbacks (backend requires explicit providerId)
      if (!providerId || providerId.trim() === '') {
        throw new Error('Please select a model before generating angles.');
      }
      
      // 🔥 DEFAULT VALUES: Use "afternoon" and "sunny" if user didn't select anything
      const defaultTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = timeOfDay && timeOfDay.trim() !== '' 
        ? (timeOfDay.trim() as 'morning' | 'afternoon' | 'evening' | 'night')
        : 'afternoon'; // Default to afternoon (daytime)
      
      const defaultWeather: 'sunny' | 'cloudy' | 'rainy' | 'snowy' = weather && weather.trim() !== ''
        ? (weather.trim() as 'sunny' | 'cloudy' | 'rainy' | 'snowy')
        : 'sunny'; // Default to sunny (clear)

      const selectedModel = models.find(m => m.id === providerId);
      const derivedQuality = selectedModel?.quality === '4K' ? 'high-quality' : 'standard';
      const requestBody: any = {
        locationProfile: locationProfile,
        packageId: selectedPackageId,
        quality: derivedQuality,
        providerId: providerId,
        additionalPrompt: additionalPrompt.trim() || undefined, // 🔥 NEW: Additional prompt for grounding search, color codes, etc.
        timeOfDay: defaultTimeOfDay,
        weather: defaultWeather,
        projectId: projectId, // 🔥 FIX: Include projectId for job creation (matches location background and asset angle generation pattern)
        screenplayId: projectId // Legacy support
      };
      
      // Add selectedAngle for single mode, or angles array for package mode
      if (selectedPackageId === 'single') {
        requestBody.selectedAngle = selectedAngle;
      } else {
        // Apply timeOfDay and weather to all angles in the package (with defaults)
        requestBody.angles = packageToAngles[selectedPackageId].map(angle => ({
          angle: angle.angle,
          timeOfDay: defaultTimeOfDay,
          weather: defaultWeather
        }));
      }
      
      console.log('[LocationAngleGeneration] Request body:', {
        quality: derivedQuality,
        providerId: providerId,
        hasProviderId: !!providerId,
        selectedPackageId,
        selectedAngle: selectedAngle, // 🔥 DEBUG: Log selected angle
        requestBodyAngle: selectedPackageId === 'single' ? selectedAngle : 'N/A (package mode)'
      });
      
      console.log('[LocationAngleGeneration] Calling API:', apiUrl);
      
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
        throw {
          response: { status: response.status, data: errorData },
          message: errorData.error?.message || errorData.error || errorData.message || 'Failed to start angle generation',
        };
      }
      
      const result = await response.json();
      
      // Store jobId and close modal immediately (async pattern - matches character poses)
      if (result.jobId) {
        setJobId(result.jobId);
        console.log('[LocationAngleGeneration] Job started:', result.jobId);
        // Close modal immediately - job runs in background
        handleReset();
        onClose();
        
        // Show success toast with link to Jobs tab
        toast.success('Angle generation started!', {
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
          onComplete({ jobId: result.jobId, angleVariations: [] });
        }
      } else {
        throw new Error('No job ID returned from server');
      }
      
    } catch (err: any) {
      console.error('[LocationAngleGeneration] Error:', err);
      const creditError = extractCreditError(err);
      const displayMessage = creditError.isInsufficientCredits
        ? getCreditErrorDisplayMessage(creditError)
        : (err?.message || 'An error occurred during generation');
      if (creditError.isInsufficientCredits) {
        syncCreditsFromError(creditError);
      }
      setError(displayMessage);
      setStep('error');
      
      toast.error('Failed to start angle generation!', {
        description: displayMessage,
        duration: 5000
      });
      setIsGenerating(false);
    }
  };
  
  // Safety error handling moved to job result monitoring (async pattern)
  
  const handleReset = () => {
    setStep('package');
    setSelectedPackageId('standard');
    setSelectedAngle('front'); // 🔥 Feature 0190: Reset single angle selection
    setTimeOfDay(''); // Reset timeOfDay
    setWeather(''); // Reset weather
    setAdditionalPrompt(''); // 🔥 NEW: Reset additional prompt
    setGenerationResult(null);
    setError('');
    setIsGenerating(false);
    setJobId(null);
  };
  
  const handleClose = () => {
    if (isGenerating) {
      // Don't allow closing during generation
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
                <h2 className="text-2xl font-bold text-base-content">Generate Angle Package</h2>
                <p className="text-base-content/60 mt-1">Create consistent location references for {locationName}</p>
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
                    )}
                    {models.find(m => m.id === providerId) && (
                      <p className="mt-2 text-xs text-base-content/50">
                        {models.find(m => m.id === providerId)?.credits} credits per image
                      </p>
                    )}
                  </div>
                  
                  {/* Package Selection */}
                  <div>
                    <h3 className="text-sm font-semibold text-base-content mb-4">
                      Step 3: Select Package
                    </h3>
                    <LocationAnglePackageSelector
                      locationName={locationName}
                      onSelectPackage={(packageId) => {
                        setSelectedPackageId(packageId);
                      }}
                      selectedPackageId={selectedPackageId}
                      creditsPerImage={models.find(m => m.id === providerId)?.credits || 20} // 🔥 NEW: Pass selected model's credits
                      // 🔥 Feature 0190: Single angle selection
                      selectedAngle={selectedAngle}
                      onSelectedAngleChange={setSelectedAngle}
                    />
                  </div>
                  
                  {/* Time of Day and Weather Selection */}
                  <div className="bg-base-300 rounded-lg p-4 border border-base-content/10">
                    <h3 className="text-sm font-semibold text-base-content mb-4">
                      Step 4: Optional - Lighting & Atmosphere
                    </h3>
                    <p className="text-xs text-[#808080] mb-4 italic">
                      Note: These settings will affect the generated images in Production Hub
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Time of Day */}
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
                      {/* Weather */}
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
                      Step 5: Additional Prompt (Optional)
                    </h3>
                    <textarea
                      value={additionalPrompt}
                      onChange={(e) => setAdditionalPrompt(e.target.value)}
                      placeholder="Add special instructions, color codes (#FF0000), or time-sensitive keywords for real-time search. Nano Banana Pro and FLUX.2 [max] support grounding search. FLUX.2 [max] supports explicit hex codes."
                      className="w-full h-24 bg-base-200 border border-base-content/20 rounded-lg p-3 text-base-content placeholder-base-content/50 focus:outline-none focus:border-[#DC143C] resize-none"
                    />
                    <p className="text-xs text-base-content/50 mt-2">
                      Example: "Current weather in Freiburg, Germany, brand colors #00704A"
                    </p>
                  </div>
                  
                  {/* Generate Button */}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || !selectedPackageId || !providerId || (selectedPackageId === 'single' && !selectedAngle)}
                      className="px-6 py-3 bg-primary text-primary-content rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? 'Generating...' : selectedPackageId === 'single' ? 'Generate Single Angle' : 'Generate Angle Package'}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Step 2: Generating */}
              {step === 'generating' && (
                <div className="text-center py-12">
                  <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
                  <h3 className="text-xl font-bold text-gray-100 mb-2">
                    {selectedPackageId === 'single' ? 'Generating Single Angle...' : 'Generating Angle Variations...'}
                  </h3>
                  <p className="text-base-content/60">
                    {selectedPackageId === 'single' 
                      ? `Creating ${selectedAngle} angle for ${locationName}`
                      : `Creating ${packageToAngles[selectedPackageId]?.length || 0} angle variations for ${locationName}`
                    }
                  </p>
                  {jobId && (
                    <p className="text-sm text-base-content/50 mt-4">
                      Job ID: {jobId}
                    </p>
                  )}
                </div>
              )}
              
              {/* Step 3: Complete */}
              {step === 'complete' && generationResult && (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-100 mb-2">
                    Angle Package Generated!
                  </h3>
                  <p className="text-base-content/60 mb-6">
                    Created {generationResult.angleVariations?.length || 0} angle variations for {locationName}
                  </p>
                  <div className="bg-base-300 rounded-lg p-6 max-w-md mx-auto mb-6">
                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div>
                        <div className="text-base-content/60 text-sm">Package</div>
                        <div className="text-base-content font-semibold capitalize">{selectedPackageId}</div>
                      </div>
                      <div>
                        <div className="text-base-content/60 text-sm">Angles</div>
                        <div className="text-base-content font-semibold">{generationResult.angleVariations?.length || 0}</div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="px-6 py-3 bg-[#DC143C] hover:bg-blue-700 text-base-content rounded-lg font-semibold transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
              
              {/* Step 4: Error */}
              {step === 'error' && (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-100 mb-2">
                    Generation Failed
                  </h3>
                  <p className="text-base-content/60 mb-6">
                    {error}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setStep('package')}
                      className="px-6 py-3 bg-base-300 hover:bg-base-content/20 text-base-content rounded-lg font-semibold transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={handleClose}
                      className="px-6 py-3 bg-[#DC143C] hover:bg-blue-700 text-base-content rounded-lg font-semibold transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
              
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    
    {/* Safety errors are handled in job result monitoring - see ProductionJobsPanel */}
    
  </>
  );
}

