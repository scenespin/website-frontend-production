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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [quality, setQuality] = useState<'standard' | 'high-quality'>('high-quality');
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
  const [selectedAngleId, setSelectedAngleId] = useState<string>(''); // For backward compatibility (single select)
  const [selectedAngleIds, setSelectedAngleIds] = useState<string[]>([]); // NEW: Multi-select support
  
  // Step 2b.1: Metadata filters for angle selection (only for backgrounds with angle-variations source)
  const [filterTimeOfDay, setFilterTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night' | ''>('');
  const [filterWeather, setFilterWeather] = useState<'sunny' | 'cloudy' | 'rainy' | 'snowy' | ''>('');
  
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
  
  // Filter angles by metadata (for visual selector)
  const filteredAngles = useMemo(() => {
    if (sourceType !== 'angle-variations' || availableAngles.length === 0) {
      return [];
    }
    
    return availableAngles.filter((angle: any) => {
      const matchesTimeOfDay = !filterTimeOfDay || angle.timeOfDay === filterTimeOfDay;
      const matchesWeather = !filterWeather || angle.weather === filterWeather;
      return matchesTimeOfDay && matchesWeather;
    });
  }, [availableAngles, sourceType, filterTimeOfDay, filterWeather]);
  
  // Get selected angles with full data
  const selectedAngles = useMemo(() => {
    return availableAngles.filter((a: any) => selectedAngleIds.includes(a.id));
  }, [availableAngles, selectedAngleIds]);
  
  // Check if angle can be selected (must match existing selections' metadata)
  const canSelectAngle = (angle: any): { canSelect: boolean; reason?: string } => {
    if (selectedAngleIds.length === 0) {
      return { canSelect: true }; // First selection always allowed
    }
    
    // Get metadata of already-selected angles (only from angle packages, not reference images)
    const selectedAnglesWithMetadata = selectedAngles.filter((a: any) => 
      a.generationMethod === 'ai-generated' || a.generationMethod === 'angle-variation'
    );
    
    if (selectedAnglesWithMetadata.length === 0) {
      return { canSelect: true }; // If no metadata in selections, allow
    }
    
    const selectedTimeOfDays = selectedAnglesWithMetadata.map((a: any) => a.timeOfDay).filter(Boolean);
    const selectedWeathers = selectedAnglesWithMetadata.map((a: any) => a.weather).filter(Boolean);
    
    // Check if new angle matches selected metadata
    // Only check if angle has metadata (from angle package)
    const angleHasMetadata = (angle.generationMethod === 'ai-generated' || angle.generationMethod === 'angle-variation') &&
      (angle.timeOfDay || angle.weather);
    
    if (!angleHasMetadata) {
      // Angle without metadata can only be selected if no metadata in existing selections
      if (selectedTimeOfDays.length === 0 && selectedWeathers.length === 0) {
        return { canSelect: true };
      }
      return {
        canSelect: false,
        reason: 'Cannot mix angles with and without metadata. Please clear selections or select angles with matching metadata.'
      };
    }
    
    const timeOfDayMatch = selectedTimeOfDays.length === 0 || 
      (angle.timeOfDay && selectedTimeOfDays.includes(angle.timeOfDay));
    const weatherMatch = selectedWeathers.length === 0 ||
      (angle.weather && selectedWeathers.includes(angle.weather));
    
    if (!timeOfDayMatch || !weatherMatch) {
      return {
        canSelect: false,
        reason: 'All selected angles must have the same time of day and weather. Please clear selections or adjust filters.'
      };
    }
    
    return { canSelect: true };
  };
  
  // Toggle angle selection (multi-select) with validation
  const toggleAngleSelection = (angleId: string) => {
    const angle = availableAngles.find((a: any) => a.id === angleId);
    if (!angle) return;
    
    if (selectedAngleIds.includes(angleId)) {
      // Deselecting - always allowed
      setSelectedAngleIds(prev => prev.filter(id => id !== angleId));
      if (selectedAngleIds.length === 1) {
        setSelectedAngleId(''); // Clear single select if last one
      }
    } else {
      // Selecting - check if allowed
      const validation = canSelectAngle(angle);
      if (!validation.canSelect) {
        toast.error(validation.reason || 'Cannot select this angle');
        return;
      }
      
      setSelectedAngleIds(prev => [...prev, angleId]);
      // Also update single select for backward compatibility
      setSelectedAngleId(angleId);
    }
  };
  
  // Select all filtered angles (only if they all have same metadata)
  const selectAllFiltered = () => {
    if (filteredAngles.length === 0) return;
    
    // Check if all filtered angles have same metadata
    const timeOfDays = filteredAngles.map((a: any) => a.timeOfDay).filter(Boolean);
    const weathers = filteredAngles.map((a: any) => a.weather).filter(Boolean);
    const uniqueTimeOfDays = [...new Set(timeOfDays)];
    const uniqueWeathers = [...new Set(weathers)];
    
    if (uniqueTimeOfDays.length > 1 || uniqueWeathers.length > 1) {
      toast.error('Cannot select all: angles have different metadata. Please adjust filters.');
      return;
    }
    
    const allIds = filteredAngles.map((a: any) => a.id).filter(Boolean);
    setSelectedAngleIds(allIds);
    if (allIds.length > 0) {
      setSelectedAngleId(allIds[0]); // For backward compatibility
    }
  };
  
  // Clear all selections
  const clearAngleSelections = () => {
    setSelectedAngleIds([]);
    setSelectedAngleId('');
  };
  
  // Get metadata from selected angles (only from angle packages)
  const selectedMetadata = useMemo(() => {
    if (selectedAngles.length === 0) return null;
    
    // Only consider angles with metadata (from angle packages)
    const anglesWithMetadata = selectedAngles.filter((a: any) =>
      (a.generationMethod === 'ai-generated' || a.generationMethod === 'angle-variation') &&
      (a.timeOfDay || a.weather)
    );
    
    if (anglesWithMetadata.length === 0) return null;
    
    const timeOfDays = anglesWithMetadata.map((a: any) => a.timeOfDay).filter(Boolean);
    const weathers = anglesWithMetadata.map((a: any) => a.weather).filter(Boolean);
    
    const uniqueTimeOfDays = [...new Set(timeOfDays)];
    const uniqueWeathers = [...new Set(weathers)];
    
    return {
      timeOfDay: uniqueTimeOfDays.length === 1 ? uniqueTimeOfDays[0] : null,
      weather: uniqueWeathers.length === 1 ? uniqueWeathers[0] : null,
      isConsistent: uniqueTimeOfDays.length <= 1 && uniqueWeathers.length <= 1
    };
  }, [selectedAngles]);
  
  // Track if user has manually set Step 4 values
  const [hasManuallySetTimeOfDay, setHasManuallySetTimeOfDay] = useState(false);
  const [hasManuallySetWeather, setHasManuallySetWeather] = useState(false);
  
  // Auto-populate Step 4 from selected angles' metadata (only if not manually set)
  useEffect(() => {
    if (sourceType === 'angle-variations' && selectedMetadata && selectedMetadata.isConsistent) {
      if (selectedMetadata.timeOfDay && !hasManuallySetTimeOfDay) {
        setTimeOfDay(selectedMetadata.timeOfDay as 'morning' | 'afternoon' | 'evening' | 'night');
      }
      if (selectedMetadata.weather && !hasManuallySetWeather) {
        setWeather(selectedMetadata.weather as 'sunny' | 'cloudy' | 'rainy' | 'snowy');
      }
    }
  }, [selectedMetadata, sourceType, hasManuallySetTimeOfDay, hasManuallySetWeather]);
  
  // Reset manual flags when source type changes
  useEffect(() => {
    if (sourceType !== 'angle-variations') {
      setHasManuallySetTimeOfDay(false);
      setHasManuallySetWeather(false);
    }
  }, [sourceType]);
  
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
      
      // Validate providerId - this should never happen if button is properly disabled
      if (!providerId || providerId.trim() === '') {
        console.error('[GenerateLocationTab] providerId validation failed:', {
          providerId,
          modelsCount: models.length,
          isLoadingModels,
          quality
        });
        throw new Error('Please select a model before generating. If models are not loading, please refresh the page.');
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
          screenplayId: screenplayId, // Add screenplayId at top level for middleware
          projectId: screenplayId, // Legacy support
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
          // Toast notification handled by parent (LocationDetailModal) in onComplete callback
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
          selectedAngleId: sourceType === 'angle-variations' && selectedAngleId ? selectedAngleId : undefined, // Backward compatibility
          selectedAngleIds: sourceType === 'angle-variations' && selectedAngleIds.length > 0 ? selectedAngleIds : undefined, // NEW: Multi-select
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
          // Toast notification handled by parent (LocationDetailModal) in onComplete callback
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
                <span className="text-sm text-white">Standard Quality - {creditsPerImage} credits</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="quality"
                  checked={quality === 'high-quality'}
                  onChange={() => setQuality('high-quality')}
                  className="w-4 h-4 text-[#DC143C] focus:ring-[#DC143C] focus:ring-2"
                />
                <span className="text-sm text-white">High Quality - {creditsPerImage} credits</span>
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
              <Select
                value={providerId}
                onValueChange={(value) => setProviderId(value)}
              >
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name} ({model.credits} credits)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              </div>
            </label>
          </div>
          
          {/* Angle Selection UI - Separate section to keep radio buttons aligned */}
          {sourceType === 'angle-variations' && availableAngles.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#3F3F46] space-y-3">
                    {/* Metadata Filters */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-[#808080] mb-1.5">Filter by Time of Day</label>
                        <Select
                          value={filterTimeOfDay || '__all__'}
                          onValueChange={(value) => {
                            setFilterTimeOfDay(value === '__all__' ? '' : (value as any));
                            clearAngleSelections(); // Clear selections when filter changes
                          }}
                        >
                          <SelectTrigger className="w-full h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__all__">All times</SelectItem>
                            <SelectItem value="morning">Morning</SelectItem>
                            <SelectItem value="afternoon">Afternoon</SelectItem>
                            <SelectItem value="evening">Evening</SelectItem>
                            <SelectItem value="night">Night</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-xs text-[#808080] mb-1.5">Filter by Weather</label>
                        <Select
                          value={filterWeather || '__all__'}
                          onValueChange={(value) => {
                            setFilterWeather(value === '__all__' ? '' : (value as any));
                            clearAngleSelections(); // Clear selections when filter changes
                          }}
                        >
                          <SelectTrigger className="w-full h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__all__">All weather</SelectItem>
                            <SelectItem value="sunny">Sunny</SelectItem>
                            <SelectItem value="cloudy">Cloudy</SelectItem>
                            <SelectItem value="rainy">Rainy</SelectItem>
                            <SelectItem value="snowy">Snowy</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Selection Controls */}
                    {filteredAngles.length > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-[#808080]">
                          {filteredAngles.length} angle{filteredAngles.length !== 1 ? 's' : ''} found
                          {selectedAngleIds.length > 0 && ` • ${selectedAngleIds.length} selected`}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={selectAllFiltered}
                            className="px-3 py-1 text-xs bg-[#0A0A0A] border border-[#3F3F46] hover:bg-[#1A1A1A] text-white rounded transition-colors"
                          >
                            Select All
                          </button>
                          {selectedAngleIds.length > 0 && (
                            <button
                              type="button"
                              onClick={clearAngleSelections}
                              className="px-3 py-1 text-xs bg-[#0A0A0A] border border-[#3F3F46] hover:bg-[#1A1A1A] text-white rounded transition-colors"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Visual Angle Grid */}
                    {filteredAngles.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-64 overflow-y-auto p-2 bg-[#0A0A0A] rounded border border-[#3F3F46]">
                        {filteredAngles.map((angle: any) => {
                          const isSelected = selectedAngleIds.includes(angle.id);
                          const validation = canSelectAngle(angle);
                          const hasMetadata = (angle.generationMethod === 'ai-generated' || angle.generationMethod === 'angle-variation') &&
                            (angle.timeOfDay || angle.weather);
                          
                          return (
                            <button
                              key={angle.id}
                              type="button"
                              onClick={() => toggleAngleSelection(angle.id)}
                              disabled={!validation.canSelect && !isSelected}
                              className={`relative aspect-square rounded border-2 transition-all ${
                                isSelected
                                  ? 'border-[#DC143C] ring-2 ring-[#DC143C]/50'
                                  : !validation.canSelect
                                  ? 'border-[#3F3F46] opacity-50 cursor-not-allowed'
                                  : 'border-[#3F3F46] hover:border-[#808080]'
                              }`}
                              title={`${angle.angle || 'Angle'}${angle.timeOfDay ? ` - ${angle.timeOfDay}` : ''}${angle.weather ? ` - ${angle.weather}` : ''}${!validation.canSelect && !isSelected ? ' - Cannot mix with selected angles' : ''}`}
                            >
                              {angle.imageUrl ? (
                                <img
                                  src={angle.imageUrl}
                                  alt={angle.angle || 'Angle'}
                                  className="w-full h-full object-cover rounded"
                                />
                              ) : (
                                <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center text-[10px] text-[#808080] p-1 text-center rounded">
                                  {angle.angle || 'Angle'}
                                </div>
                              )}
                              
                              {isSelected && (
                                <div className="absolute inset-0 flex items-center justify-center bg-[#DC143C]/20 rounded">
                                  <svg className="w-5 h-5 text-[#DC143C]" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                              
                              {/* Metadata badges - show time of day and weather */}
                              {hasMetadata && (
                                <div className="absolute top-1 left-1 right-1 flex flex-wrap gap-1">
                                  {angle.timeOfDay && (
                                    <div className="px-1.5 py-0.5 bg-blue-600/90 text-white text-[8px] font-medium rounded">
                                      {angle.timeOfDay}
                                    </div>
                                  )}
                                  {angle.weather && (
                                    <div className="px-1.5 py-0.5 bg-green-600/90 text-white text-[8px] font-medium rounded">
                                      {angle.weather}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Angle name badge */}
                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5 rounded-b text-[9px] text-white truncate">
                                {angle.angle || 'Angle'}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 bg-[#0A0A0A] border border-[#3F3F46] rounded text-sm text-[#808080] text-center">
                        {availableAngles.length === 0
                          ? 'No angle variations available. Generate angles first or use reference images.'
                          : 'No angles match the selected filters. Try adjusting the time of day or weather filters.'}
                      </div>
                    )}
                    
                    {/* Info text */}
                    {selectedAngleIds.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-[#808080]">
                          Selected {selectedAngleIds.length} angle{selectedAngleIds.length !== 1 ? 's' : ''} will be used as reference{selectedAngleIds.length > 1 ? 's' : ''}. 
                          The package determines how many backgrounds are generated ({backgroundCounts[selectedBackgroundPackageId] || 6}).
                        </p>
                        {selectedMetadata && selectedMetadata.isConsistent && (
                          <p className="text-xs text-cyan-400">
                            Step 4 has been auto-populated with metadata from selected angles ({String(selectedMetadata.timeOfDay || 'any time')}, {String(selectedMetadata.weather || 'any weather')}). You can override these settings if needed.
                          </p>
                        )}
                        {selectedMetadata && !selectedMetadata.isConsistent && (
                          <p className="text-xs text-orange-400">
                            Selected angles have mixed metadata. Please set Step 4 manually.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
            compact={true}
          />
        ) : (
          <LocationBackgroundPackageSelector
            locationName={locationName}
            onSelectPackage={setSelectedBackgroundPackageId}
            selectedPackageId={selectedBackgroundPackageId}
            creditsPerImage={creditsPerImage}
            compact={true}
          />
        )}
      </div>

      {/* Step 4: Optional - Lighting & Atmosphere */}
      <div className="bg-[#1F1F1F] border border-[#3F3F46] rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Step 4: Optional - Lighting & Atmosphere</h3>
        {sourceType === 'angle-variations' && selectedMetadata && selectedMetadata.isConsistent && (
          <p className="text-xs text-cyan-400 mb-3">
            Auto-populated from selected angles. You can override these values if needed.
          </p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#808080] mb-2">Time of Day (Optional)</label>
            <Select
              value={timeOfDay || '__none__'}
              onValueChange={(value) => {
                setTimeOfDay(value === '__none__' ? '' : (value as any));
                setHasManuallySetTimeOfDay(true);
              }}
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
                <SelectItem value="evening">Evening</SelectItem>
                <SelectItem value="night">Night</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs text-[#808080] mb-2">Weather (Optional)</label>
            <Select
              value={weather || '__none__'}
              onValueChange={(value) => {
                setWeather(value === '__none__' ? '' : (value as any));
                setHasManuallySetWeather(true);
              }}
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                <SelectItem value="sunny">Sunny</SelectItem>
                <SelectItem value="cloudy">Cloudy</SelectItem>
                <SelectItem value="rainy">Rainy</SelectItem>
                <SelectItem value="snowy">Snowy</SelectItem>
              </SelectContent>
            </Select>
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
          disabled={isGenerating || isLoadingModels || !providerId || !selectedPackageId}
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

