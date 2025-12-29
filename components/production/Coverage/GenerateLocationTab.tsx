'use client';

/**
 * GenerateLocationTab - Generate Location Packages tab for Location Detail Modal
 * 
 * Similar to GenerateWardrobeTab, but for location angles and backgrounds
 * Steps:
 * Step 1: Quality & Model Selection
 * Step 2: Source Selection (for backgrounds - reference images vs angle variations)
 * Step 3: Package Selection (Angles vs Backgrounds)
 * Step 4: Optional - Lighting & Atmosphere (time of day, weather)
 * Step 5: Optional - Additional Prompt
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import LocationAnglePackageSelector from '../LocationAnglePackageSelector';
import LocationBackgroundPackageSelector from '../LocationBackgroundPackageSelector';

interface GenerateLocationTabProps {
  locationId: string;
  locationName: string;
  screenplayId: string;
  locationProfile: any;
  location?: any; // Full location object with angleVariations
  onClose: () => void;
  onComplete?: (result: any) => void;
}

type PackageType = 'angles' | 'backgrounds';

export function GenerateLocationTab({
  locationId,
  locationName,
  screenplayId,
  locationProfile,
  location,
  onClose,
  onComplete
}: GenerateLocationTabProps) {
  const { getToken } = useAuth();
  
  // Step 1: Quality/Model
  const [quality, setQuality] = useState<'standard' | 'high-quality'>('standard');
  const [providerId, setProviderId] = useState<string>('');
  const [models, setModels] = useState<Array<{ id: string; name: string; referenceLimit: number; quality: '1080p' | '4K'; credits: number; enabled: boolean }>>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  
  // Step 2: Package Type Selection
  const [packageType, setPackageType] = useState<PackageType>('angles');
  
  // Step 3: Package Selection
  const [selectedAnglePackageId, setSelectedAnglePackageId] = useState<string>('standard');
  const [selectedBackgroundPackageId, setSelectedBackgroundPackageId] = useState<string>('standard');
  
  // Step 2b: Background Source Selection (only for backgrounds)
  const [sourceType, setSourceType] = useState<'reference-images' | 'angle-variations'>('reference-images');
  const [selectedAngleId, setSelectedAngleId] = useState<string>('');
  
  // Step 4: Optional - Lighting & Atmosphere
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night' | ''>('');
  const [weather, setWeather] = useState<'sunny' | 'cloudy' | 'rainy' | 'snowy' | ''>('');
  
  // Step 5: Optional - Additional Prompt
  const [additionalPrompt, setAdditionalPrompt] = useState<string>('');
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Get available angles for source selection
  const availableAngles = location?.angleVariations || [];
  
  // Get selected model
  const selectedModel = useMemo(() => {
    return models.find(m => m.id === providerId);
  }, [models, providerId]);
  
  const creditsPerImage = selectedModel?.credits || 20;
  
  // Reset providerId when quality changes
  useEffect(() => {
    setProviderId('');
  }, [quality]);
  
  // Load models when quality changes
  useEffect(() => {
    async function loadModels() {
      setIsLoadingModels(true);
      try {
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) {
          toast.error('Authentication required');
          return;
        }

        const response = await fetch(`/api/model-selection/locations/${quality}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load models');
        }

        const data = await response.json();
        const availableModels = data.data?.models || data.models || [];
        const enabledModels = availableModels.filter((m: any) => m.enabled);
        setModels(enabledModels);
        
        // Auto-select first model when models load
        if (enabledModels.length > 0 && !providerId) {
          setProviderId(enabledModels[0].id);
        }
      } catch (error: any) {
        console.error('[GenerateLocationTab] Failed to load models:', error);
        toast.error('Failed to load available models');
      } finally {
        setIsLoadingModels(false);
      }
    }

    loadModels();
  }, [quality, getToken]);
  
  // Auto-select first model when models are loaded
  useEffect(() => {
    if (models.length > 0 && !providerId && !isLoadingModels) {
      setProviderId(models[0].id);
    }
  }, [models, providerId, isLoadingModels]);
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      const token = await getToken({ template: 'wryda-backend' });
      
      if (!token) {
        throw new Error('Failed to get backend token. Please try refreshing the page.');
      }
      
      if (!providerId || providerId.trim() === '') {
        throw new Error('Please select a model before generating.');
      }
      
      // Default values
      const defaultTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = timeOfDay && timeOfDay.trim() !== '' 
        ? (timeOfDay.trim() as 'morning' | 'afternoon' | 'evening' | 'night')
        : 'afternoon';
      
      const defaultWeather: 'sunny' | 'cloudy' | 'rainy' | 'snowy' = weather && weather.trim() !== ''
        ? (weather.trim() as 'sunny' | 'cloudy' | 'rainy' | 'snowy')
        : 'sunny';
      
      if (packageType === 'angles') {
        // Generate angles
        const apiUrl = `/api/location-bank/generate-angles`;
        
        const packageToAngles: Record<string, Array<{ angle: string }>> = {
          basic: [{ angle: 'front' }, { angle: 'corner' }, { angle: 'wide' }],
          standard: [{ angle: 'front' }, { angle: 'corner' }, { angle: 'wide' }, { angle: 'low-angle' }, { angle: 'entrance' }, { angle: 'foreground-framing' }],
          premium: [{ angle: 'front' }, { angle: 'corner' }, { angle: 'wide' }, { angle: 'low-angle' }, { angle: 'entrance' }, { angle: 'foreground-framing' }, { angle: 'aerial' }, { angle: 'pov' }, { angle: 'detail' }, { angle: 'atmospheric' }, { angle: 'golden-hour' }]
        };
        
        const requestBody = {
          locationProfile: locationProfile,
          packageId: selectedAnglePackageId,
          quality: quality,
          providerId: providerId,
          additionalPrompt: additionalPrompt.trim() || undefined,
          angles: packageToAngles[selectedAnglePackageId].map(angle => ({
            angle: angle.angle,
            timeOfDay: defaultTimeOfDay,
            weather: defaultWeather
          }))
        };
        
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
          throw new Error(errorData.error?.message || errorData.error || 'Failed to start angle generation');
        }
        
        const result = await response.json();
        
        if (result.jobId) {
          toast.success('Angle generation started!', {
            description: 'View in Jobs tab to track progress.',
            duration: 5000
          });
          
          if (onComplete) {
            onComplete({ jobId: result.jobId, type: 'angles' });
          }
          onClose();
        } else {
          throw new Error('No job ID returned from server');
        }
      } else {
        // Generate backgrounds
        const apiUrl = `/api/location-bank/${locationId}/generate-backgrounds`;
        
        const requestBody = {
          packageId: selectedBackgroundPackageId,
          quality: quality,
          providerId: providerId,
          sourceType: sourceType,
          selectedAngleId: sourceType === 'angle-variations' && selectedAngleId ? selectedAngleId : undefined,
          additionalPrompt: additionalPrompt.trim() || undefined,
          timeOfDay: defaultTimeOfDay,
          weather: defaultWeather,
          projectId: screenplayId,
          screenplayId: screenplayId
        };
        
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
        
        if (result.jobId) {
          toast.success('Background generation started!', {
            description: 'View in Jobs tab to track progress.',
            duration: 5000
          });
          
          if (onComplete) {
            onComplete({ jobId: result.jobId, type: 'backgrounds' });
          }
          onClose();
        } else {
          throw new Error('No job ID returned from server');
        }
      }
      
    } catch (err: any) {
      console.error('[GenerateLocationTab] Error:', err);
      setError(err.message || 'An error occurred during generation');
      toast.error(`Failed to start ${packageType} generation!`, {
        description: err.message || 'Please try again.',
        duration: 5000
      });
      setIsGenerating(false);
    }
  };
  
  // Calculate total credits
  const angleCounts: Record<string, number> = {
    basic: 3,
    standard: 6,
    premium: 11
  };
  const backgroundCounts: Record<string, number> = {
    basic: 3,
    standard: 6,
    premium: 9
  };
  
  const selectedPackageId = packageType === 'angles' ? selectedAnglePackageId : selectedBackgroundPackageId;
  const itemCount = packageType === 'angles' 
    ? angleCounts[selectedPackageId] || 6
    : backgroundCounts[selectedPackageId] || 6;
  const totalCredits = itemCount * creditsPerImage;
  
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Step 1: Quality & Model Selection */}
      <div className="bg-[#1F1F1F] border border-[#3F3F46] rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Step 1: Quality & Model Selection</h3>
        
        <div className="space-y-3">
          {/* Quality Selection */}
          <div>
            <label className="block text-xs text-[#808080] mb-2">Quality</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="quality"
                  checked={quality === 'standard'}
                  onChange={() => setQuality('standard')}
                  className="w-4 h-4 text-[#DC143C] focus:ring-[#DC143C] focus:ring-2"
                />
                <span className="text-sm text-white">Standard (1080p) - {creditsPerImage} credits</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="quality"
                  checked={quality === 'high-quality'}
                  onChange={() => setQuality('high-quality')}
                  className="w-4 h-4 text-[#DC143C] focus:ring-[#DC143C] focus:ring-2"
                />
                <span className="text-sm text-white">High Quality (4K) - {creditsPerImage} credits</span>
              </label>
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-xs text-[#808080] mb-2">Model</label>
            {isLoadingModels ? (
              <div className="px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded text-[#808080] text-sm">
                Loading models...
              </div>
            ) : models.length === 0 ? (
              <div className="px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded text-[#808080] text-sm">
                No models available for this quality tier
              </div>
            ) : (
              <select
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0A0A0A] border border-[#3F3F46] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#DC143C]"
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.credits} credits)
                  </option>
                ))}
              </select>
            )}
            {selectedModel && (
              <p className="mt-1 text-xs text-[#808080]">
                {selectedModel.credits} credits per image
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Step 2: Package Type Selection */}
      <div className="bg-[#1F1F1F] border border-[#3F3F46] rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Step 2: Select Package Type</h3>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="packageType"
              checked={packageType === 'angles'}
              onChange={() => setPackageType('angles')}
              className="w-4 h-4 text-[#DC143C] focus:ring-[#DC143C] focus:ring-2"
            />
            <span className="text-sm text-white">Angle Packages</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="packageType"
              checked={packageType === 'backgrounds'}
              onChange={() => setPackageType('backgrounds')}
              className="w-4 h-4 text-[#DC143C] focus:ring-[#DC143C] focus:ring-2"
            />
            <span className="text-sm text-white">Background Packages</span>
          </label>
        </div>
      </div>

      {/* Step 2b: Background Source Selection (only for backgrounds) */}
      {packageType === 'backgrounds' && (
        <div className="bg-[#1F1F1F] border border-[#3F3F46] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Step 2b: Generate From</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="source"
                value="reference-images"
                checked={sourceType === 'reference-images'}
                onChange={(e) => setSourceType(e.target.value as 'reference-images')}
                className="w-4 h-4 text-[#DC143C]"
              />
              <div>
                <span className="text-sm text-white font-medium">Reference Images (Original)</span>
                <p className="text-xs text-[#808080] mt-1">
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
                className="w-4 h-4 text-[#DC143C]"
                disabled={availableAngles.length === 0}
              />
              <div className="flex-1">
                <span className="text-sm text-white font-medium">Angle Variations</span>
                <p className="text-xs text-[#808080] mt-1">
                  Uses generated angles - matches lighting/weather of selected angle
                </p>
                {sourceType === 'angle-variations' && availableAngles.length > 0 && (
                  <select
                    value={selectedAngleId}
                    onChange={(e) => setSelectedAngleId(e.target.value)}
                    className="mt-2 w-full px-3 py-1.5 bg-[#0A0A0A] border border-[#3F3F46] rounded text-sm text-white"
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
      )}

      {/* Step 3: Package Selection */}
      <div className="bg-[#1F1F1F] border border-[#3F3F46] rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-4">
          Step 3: {packageType === 'angles' ? 'Angle' : 'Background'} Package Selection
        </h3>
        {packageType === 'angles' ? (
          <LocationAnglePackageSelector
            locationName={locationName}
            onSelectPackage={setSelectedAnglePackageId}
            selectedPackageId={selectedAnglePackageId}
            creditsPerImage={creditsPerImage}
          />
        ) : (
          <LocationBackgroundPackageSelector
            locationName={locationName}
            onSelectPackage={setSelectedBackgroundPackageId}
            selectedPackageId={selectedBackgroundPackageId}
            creditsPerImage={creditsPerImage}
          />
        )}
      </div>

      {/* Step 4: Optional - Lighting & Atmosphere */}
      <div className="bg-[#1F1F1F] border border-[#3F3F46] rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Step 4: Optional - Lighting & Atmosphere</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#808080] mb-2">Time of Day (Optional)</label>
            <select
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-[#0A0A0A] border border-[#3F3F46] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#DC143C]"
            >
              <option value="">None</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#808080] mb-2">Weather (Optional)</label>
            <select
              value={weather}
              onChange={(e) => setWeather(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-[#0A0A0A] border border-[#3F3F46] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#DC143C]"
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

      {/* Step 5: Optional - Additional Prompt */}
      <div className="bg-[#1F1F1F] border border-[#3F3F46] rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Step 5: Additional Prompt (Optional)</h3>
        <textarea
          value={additionalPrompt}
          onChange={(e) => setAdditionalPrompt(e.target.value)}
          placeholder="Add any specific details, color codes, or grounding search keywords..."
          rows={3}
          className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded text-sm text-white placeholder-[#808080] focus:outline-none focus:ring-1 focus:ring-[#DC143C] resize-none"
        />
        <p className="mt-2 text-xs text-[#808080]">
          Supports color hex codes (e.g., #FF0000) and grounding search keywords
        </p>
      </div>

      {/* Credits Summary */}
      <div className="bg-[#1F1F1F] border border-[#3F3F46] rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-[#808080]">Total Cost</div>
            <div className="text-2xl font-bold text-white">{totalCredits} credits</div>
            <div className="text-xs text-[#808080] mt-1">
              {itemCount} {packageType === 'angles' ? 'angles' : 'backgrounds'} × {creditsPerImage} credits
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Generate Button */}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-3 bg-[#1F1F1F] border border-[#3F3F46] hover:bg-[#2A2A2A] text-white rounded-lg transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !providerId || !selectedPackageId}
          className="flex-1 px-4 py-3 bg-[#DC143C] hover:bg-[#B91C1C] disabled:bg-[#3F3F46] disabled:text-[#808080] text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            `Generate ${packageType === 'angles' ? 'Angles' : 'Backgrounds'}`
          )}
        </button>
      </div>
    </div>
  );
}

