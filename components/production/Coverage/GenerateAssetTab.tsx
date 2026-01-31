'use client';

/**
 * GenerateAssetTab - Generate Asset Angle Packages tab for Asset Detail Modal
 * 
 * Converted from AssetAngleGenerationModal to tab format
 * Steps:
 * Step 1: Model Selection (unified dropdown from API)
 * Step 2: Package Selection (Standard Props | Ground Vehicles | Aircraft)
 * Step 3: Additional Prompt (Optional)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Package, Car, Plane } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import AssetAnglePackageSelector from '../AssetAnglePackageSelector';

// Feature 0226: Vehicle/aircraft interior package definitions (match backend angleIds)
const VEHICLE_INTERIOR_PACKAGES_UI: Record<string, { id: string; name: string; angleIds: string[]; angleLabels: string[] }> = {
  car: { id: 'car', name: 'Car (sedan)', angleIds: ['driver', 'passenger', 'back_seat', 'front_looking_back', 'back_left', 'back_right', 'trunk'], angleLabels: ['Driver', 'Passenger', 'Back (through console)', 'Front (through console, looking back)', 'Back left', 'Back right', 'Trunk'] },
  truck: { id: 'truck', name: 'Truck (pickup)', angleIds: ['driver', 'passenger', 'back_seat', 'front_looking_back', 'back_left', 'back_right', 'bed'], angleLabels: ['Driver', 'Passenger', 'Back (through console)', 'Front (through console, looking back)', 'Back left', 'Back right', 'Bed'] },
  suv: { id: 'suv', name: 'SUV', angleIds: ['driver', 'passenger', 'back_seat', 'front_looking_back', 'back_left', 'back_right', 'cargo'], angleLabels: ['Driver', 'Passenger', 'Back (through console)', 'Front (through console, looking back)', 'Back left', 'Back right', 'Cargo'] },
  van: { id: 'van', name: 'Van', angleIds: ['driver', 'passenger', 'rear_cargo'], angleLabels: ['Driver', 'Passenger', 'Rear cargo'] },
  semi: { id: 'semi', name: 'Semi (tractor-trailer cab)', angleIds: ['driver', 'passenger', 'sleeper', 'dashboard'], angleLabels: ['Driver', 'Passenger', 'Sleeper', 'Dashboard'] },
  helicopter: { id: 'helicopter', name: 'Helicopter', angleIds: ['pilot', 'passenger', 'rear_door'], angleLabels: ['Pilot', 'Passenger', 'Rear door'] },
  small_plane: { id: 'small_plane', name: 'Small plane (cockpit)', angleIds: ['pilot', 'co_pilot', 'rear_cabin'], angleLabels: ['Pilot', 'Co-pilot', 'Rear cabin'] },
  passenger_cabin: { id: 'passenger_cabin', name: 'Passenger plane cabin', angleIds: ['aisle', 'window_seat', 'galley', 'cabin_wide'], angleLabels: ['Aisle', 'Window seat', 'Galley', 'Cabin wide'] },
};
const GROUND_PACKAGE_IDS = ['car', 'truck', 'suv', 'van', 'semi'];
const AIRCRAFT_PACKAGE_IDS = ['helicopter', 'small_plane', 'passenger_cabin'];

// Match Standard Props compact card: consistency rating for interior packages (3-angle ≈ 85%, 4-angle ≈ 88%)
const INTERIOR_CONSISTENCY: Record<string, number> = {
  single: 50,
  car: 88, truck: 88, suv: 88, van: 85, semi: 88,
  helicopter: 85, small_plane: 85, passenger_cabin: 88,
};
// Gradient colors for icon box (match Standard Props style: single=emerald, rest by category)
const INTERIOR_COLORS: Record<string, string> = {
  single: 'from-emerald-500 to-emerald-600',
  car: 'from-amber-500 to-amber-600', truck: 'from-amber-500 to-amber-600', suv: 'from-amber-500 to-amber-600', van: 'from-amber-500 to-amber-600', semi: 'from-amber-500 to-amber-600',
  helicopter: 'from-sky-500 to-sky-600', small_plane: 'from-sky-500 to-sky-600', passenger_cabin: 'from-sky-500 to-sky-600',
};

function VehicleInteriorPackageCards({
  category,
  selectedPackageId,
  onSelectPackage,
  creditsPerImage,
  selectedAngle,
  onSelectedAngleChange,
  selectedInteriorPackageId,
  onSelectedInteriorPackageIdChange,
}: {
  category: 'ground' | 'aircraft';
  selectedPackageId: string;
  onSelectPackage: (id: string) => void;
  creditsPerImage: number;
  selectedAngle?: string;
  onSelectedAngleChange?: (angleId: string) => void;
  selectedInteriorPackageId?: string;
  onSelectedInteriorPackageIdChange?: (packageId: string) => void;
}) {
  const ids = category === 'ground' ? GROUND_PACKAGE_IDS : AIRCRAFT_PACKAGE_IDS;
  const isSingle = selectedPackageId === 'single';
  const interiorPackageId = selectedInteriorPackageId || (category === 'ground' ? 'car' : 'helicopter');
  const pkgForAngles = VEHICLE_INTERIOR_PACKAGES_UI[interiorPackageId];
  const angleOptions = pkgForAngles ? pkgForAngles.angleIds.map((id, i) => ({ id, label: pkgForAngles.angleLabels[i] ?? id })) : [];

  const cardClass = (selected: boolean) =>
    `relative rounded-lg border-2 p-3 cursor-pointer transition-all text-left ${
      selected ? 'border-[#DC143C] bg-[#DC143C]/10' : 'border-[#3F3F46] bg-[#0A0A0A] hover:border-[#DC143C]/50'
    }`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {/* Single Angle card - same structure as Standard Props compact */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cardClass(isSingle)}
          onClick={() => {
            onSelectPackage('single');
            onSelectedInteriorPackageIdChange?.(category === 'ground' ? 'car' : 'helicopter');
            onSelectedAngleChange?.(category === 'ground' ? 'driver' : 'pilot');
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded bg-gradient-to-br ${INTERIOR_COLORS.single}`}>
              <Package className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="text-xs font-semibold text-white truncate">Single Angle</h3>
          </div>
          <div className="text-sm font-bold text-white mb-1.5">
            {creditsPerImage} <span className="text-[10px] font-normal text-[#808080]">credits</span>
          </div>
          <div className="space-y-1 mb-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#808080]">Consistency</span>
              <span className="text-white font-semibold">{INTERIOR_CONSISTENCY.single}%</span>
            </div>
            <div className="w-full bg-[#3F3F46] rounded-full h-1">
              <div className="h-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600" style={{ width: '50%' }} />
            </div>
            <div className="text-[10px] text-[#808080]">1 angle</div>
            <div className="text-[9px] text-[#808080] mt-1">
              <div className="flex flex-wrap gap-1">
                <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">Pick one</span>
              </div>
            </div>
          </div>
          {isSingle && (
            <div className="mt-2 py-1 bg-[#DC143C] text-white text-center rounded text-[10px] font-semibold">✓ Selected</div>
          )}
        </motion.div>

        {ids.map((id) => {
          const pkg = VEHICLE_INTERIOR_PACKAGES_UI[id];
          if (!pkg) return null;
          const credits = pkg.angleIds.length * creditsPerImage;
          const isSelected = selectedPackageId === id;
          const consistency = INTERIOR_CONSISTENCY[id] ?? 85;
          const Icon = category === 'ground' ? Car : Plane;
          return (
            <motion.div
              key={id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cardClass(isSelected)}
              onClick={() => onSelectPackage(id)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded bg-gradient-to-br ${INTERIOR_COLORS[id] ?? 'from-[#3F3F46] to-[#2A2A2A]'}`}>
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="text-xs font-semibold text-white truncate">{pkg.name}</h3>
              </div>
              <div className="text-sm font-bold text-white mb-1.5">
                {credits} <span className="text-[10px] font-normal text-[#808080]">credits</span>
              </div>
              <div className="space-y-1 mb-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#808080]">Consistency</span>
                  <span className="text-white font-semibold">{consistency}%</span>
                </div>
                <div className="w-full bg-[#3F3F46] rounded-full h-1">
                  <div
                    className={`h-1 rounded-full bg-gradient-to-r ${INTERIOR_COLORS[id] ?? 'from-[#3F3F46] to-[#2A2A2A]'}`}
                    style={{ width: `${consistency}%` }}
                  />
                </div>
                <div className="text-[10px] text-[#808080]">{pkg.angleIds.length} angles</div>
                <div className="text-[9px] text-[#808080] mt-1">
                  <div className="flex flex-wrap gap-1">
                    {pkg.angleLabels.map((label) => (
                      <span key={label} className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {isSelected && (
                <div className="mt-2 py-1 bg-[#DC143C] text-white text-center rounded text-[10px] font-semibold">✓ Selected</div>
              )}
            </motion.div>
          );
        })}
      </div>
      {isSingle && (
        <div className="mt-4 p-4 bg-[#1A1A1A] border border-[#3F3F46] rounded-lg">
          <label className="block text-xs font-medium text-white mb-2">Select Angle:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-[#808080] mb-1">{category === 'ground' ? 'Vehicle' : 'Aircraft'}</label>
              <select
                value={interiorPackageId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  onSelectedInteriorPackageIdChange?.(nextId);
                  const nextPkg = VEHICLE_INTERIOR_PACKAGES_UI[nextId];
                  onSelectedAngleChange?.(nextPkg?.angleIds[0] ?? '');
                }}
                className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent"
              >
                {(category === 'ground' ? GROUND_PACKAGE_IDS : AIRCRAFT_PACKAGE_IDS).map((id) => {
                  const p = VEHICLE_INTERIOR_PACKAGES_UI[id];
                  return p ? <option key={id} value={id} className="bg-[#1A1A1A]">{p.name}</option> : null;
                })}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-[#808080] mb-1">Angle</label>
              <select
                value={selectedAngle && angleOptions.some((o) => o.id === selectedAngle) ? selectedAngle : (angleOptions[0]?.id ?? '')}
                onChange={(e) => onSelectedAngleChange?.(e.target.value)}
                className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-transparent"
              >
                {angleOptions.map((o) => (
                  <option key={o.id} value={o.id} className="bg-[#1A1A1A]">{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="mt-2 text-xs text-[#808080]">Generate one interior angle.</p>
        </div>
      )}
    </div>
  );
}

interface GenerateAssetTabProps {
  assetId: string;
  assetName: string;
  screenplayId: string;
  asset: any; // Full asset object
  onClose: () => void;
  onComplete?: (result: any) => void;
}

export function GenerateAssetTab({
  assetId,
  assetName,
  screenplayId,
  asset,
  onClose,
  onComplete
}: GenerateAssetTabProps) {
  const { getToken } = useAuth();
  
  // Step 1: Model (unified list from API, no quality tier)
  const [providerId, setProviderId] = useState<string>('');
  const [models, setModels] = useState<Array<{ id: string; name: string; referenceLimit: number; quality: '1080p' | '4K'; credits: number; enabled: boolean }>>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  
  // Step 2: Package Selection (Feature 0226: Standard | Ground | Aircraft tabs)
  const [packageCategoryTab, setPackageCategoryTab] = useState<'standard' | 'ground' | 'aircraft'>('standard');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('standard');
  const [selectedAngle, setSelectedAngle] = useState<string>('front'); // Feature 0190: Single angle selection
  const [selectedInteriorPackageId, setSelectedInteriorPackageId] = useState<string>('car'); // Feature 0226: vehicle/aircraft when single angle
  
  // Step 3: Optional - Additional Prompt
  const [additionalPrompt, setAdditionalPrompt] = useState<string>('');
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Get selected model
  const selectedModel = useMemo(() => {
    return models.find(m => m.id === providerId);
  }, [models, providerId]);
  
  const creditsPerImage = selectedModel?.credits || 20;
  
  // Load unified model list (single dropdown, no quality tier)
  useEffect(() => {
    async function loadModels() {
      setIsLoadingModels(true);
      try {
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) {
          toast.error('Authentication required');
          return;
        }
        const response = await fetch('/api/model-selection/assets', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to load models');
        const data = await response.json();
        const availableModels = data.data?.models || data.models || [];
        const enabledModels = availableModels.filter((m: any) => m.enabled);
        setModels(enabledModels);
        if (enabledModels.length > 0 && !providerId) {
          setProviderId(enabledModels[0].id);
        }
      } catch (error: any) {
        console.error('[GenerateAssetTab] Failed to load models:', error);
        toast.error('Failed to load available models');
      } finally {
        setIsLoadingModels(false);
      }
    }
    loadModels();
  }, [getToken]);
  
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
        console.error('[GenerateAssetTab] providerId validation failed:', {
          providerId,
          modelsCount: models.length,
          isLoadingModels
        });
        throw new Error('Please select a model before generating. If models are not loading, please refresh the page.');
      }
      
      const apiUrl = `/api/asset-bank/${assetId}/generate-angles`;
      
      const derivedQuality = selectedModel?.quality === '4K' ? 'high-quality' : 'standard';
      const isInteriorSingle = (packageCategoryTab === 'ground' || packageCategoryTab === 'aircraft') && selectedPackageId === 'single';
      const requestBody: any = {
        packageId: isInteriorSingle ? selectedInteriorPackageId : selectedPackageId,
        quality: derivedQuality,
        providerId: providerId,
        additionalPrompt: additionalPrompt.trim() || undefined,
        projectId: screenplayId,
        screenplayId: screenplayId,
      };
      if (packageCategoryTab === 'ground' || packageCategoryTab === 'aircraft') {
        requestBody.packageType = 'vehicle-interior';
      }
      if (selectedPackageId === 'single' || isInteriorSingle) {
        requestBody.selectedAngle = selectedAngle;
      }
      
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
        const errorMessage = errorData.error?.message || errorData.error || errorData.message || 'Failed to start angle generation';
        console.error('[GenerateAssetTab] API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          requestBody: { ...requestBody }
        });
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      if (result.jobId) {
        // Note: Credits are deducted asynchronously as each angle generates, not when job is created
        // The catch-all handler in ProductionJobsPanel will refresh credits when job completes
        console.log('[GenerateAssetTab] ✅ Job created:', result.jobId);
        // Toast notification handled by parent (AssetDetailModal) in onComplete callback
        if (onComplete) {
          onComplete({ jobId: result.jobId, type: 'angles' });
        }
      } else {
        throw new Error('No job ID returned from server');
      }
      
    } catch (err: any) {
      console.error('[GenerateAssetTab] Error:', err);
      setError(err.message || 'An error occurred during generation');
      toast.error(`Failed to start angle generation!`, {
        description: err.message || 'Please try again.',
        duration: 5000
      });
      setIsGenerating(false);
    }
  };
  
  // Calculate total credits (Feature 0226: vehicle interior counts)
  const packageAngleCounts: Record<string, number> = {
    single: 1,
    basic: 3,
    standard: 6,
    premium: 10,
    car: 7,
    truck: 7,
    suv: 7,
    van: 3,
    semi: 4,
    helicopter: 3,
    small_plane: 3,
    passenger_cabin: 4,
  };
  const angleCount = selectedPackageId === 'single' ? 1 : (packageAngleCounts[selectedPackageId] ?? 6);
  const totalCredits = angleCount * creditsPerImage;
  
  return (
    <div className="p-6 space-y-4">
      {/* Step 1: Model Selection (unified dropdown) */}
      <div className="bg-[#1F1F1F] border border-[#3F3F46] rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Step 1: Model Selection</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[#808080] mb-2">Model</label>
            {isLoadingModels ? (
              <div className="px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded text-[#808080] text-sm">
                Loading models...
              </div>
            ) : models.length === 0 ? (
              <div className="px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded text-[#808080] text-sm">
                No models available
              </div>
            ) : (
              <select
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                className="select select-bordered w-full h-9 text-sm bg-[#0A0A0A] border-[#3F3F46] text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id} className="bg-[#1A1A1A] text-[#FFFFFF]">
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

      {/* Step 2: Package Selection (Standard Props | Ground Vehicles | Aircraft) */}
      <div className="bg-[#1F1F1F] border border-[#3F3F46] rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Step 2: Package Selection</h3>
        <p className="text-xs text-[#808080] mb-3">More angles = better consistency</p>
        <div className="flex gap-1 p-1 bg-[#0A0A0A] rounded-lg mb-4 border border-[#3F3F46]">
          {(['standard', 'ground', 'aircraft'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setPackageCategoryTab(tab);
                if (tab === 'standard') setSelectedPackageId('standard');
                else if (tab === 'ground') {
                  setSelectedPackageId('car');
                  setSelectedInteriorPackageId('car');
                  setSelectedAngle('driver');
                } else {
                  setSelectedPackageId('helicopter');
                  setSelectedInteriorPackageId('helicopter');
                  setSelectedAngle('pilot');
                }
              }}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                packageCategoryTab === tab ? 'bg-[#DC143C] text-white' : 'text-[#808080] hover:bg-[#2A2A2A] hover:text-white'
              }`}
            >
              {tab === 'standard' ? 'Standard Props' : tab === 'ground' ? 'Ground Vehicles' : 'Aircraft'}
            </button>
          ))}
        </div>
        {packageCategoryTab === 'standard' && (
          <AssetAnglePackageSelector
            assetName={assetName}
            onSelectPackage={setSelectedPackageId}
            selectedPackageId={selectedPackageId}
            quality={selectedModel?.quality === '4K' ? 'high-quality' : 'standard'}
            creditsPerImage={creditsPerImage}
            compact={true}
            selectedAngle={selectedAngle}
            onSelectedAngleChange={setSelectedAngle}
          />
        )}
        {packageCategoryTab === 'ground' && (
          <VehicleInteriorPackageCards
            category="ground"
            selectedPackageId={selectedPackageId}
            onSelectPackage={setSelectedPackageId}
            creditsPerImage={creditsPerImage}
            selectedAngle={selectedAngle}
            onSelectedAngleChange={setSelectedAngle}
            selectedInteriorPackageId={selectedInteriorPackageId}
            onSelectedInteriorPackageIdChange={setSelectedInteriorPackageId}
          />
        )}
        {packageCategoryTab === 'aircraft' && (
          <VehicleInteriorPackageCards
            category="aircraft"
            selectedPackageId={selectedPackageId}
            onSelectPackage={setSelectedPackageId}
            creditsPerImage={creditsPerImage}
            selectedAngle={selectedAngle}
            onSelectedAngleChange={setSelectedAngle}
            selectedInteriorPackageId={selectedInteriorPackageId}
            onSelectedInteriorPackageIdChange={setSelectedInteriorPackageId}
          />
        )}
      </div>

      {/* Step 3: Optional - Additional Prompt */}
      <div className="bg-[#1F1F1F] border border-[#3F3F46] rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Step 3: Additional Prompt (Optional)</h3>
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
              {angleCount} angle{angleCount !== 1 ? 's' : ''} × {creditsPerImage} credits
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
          disabled={isGenerating || isLoadingModels || !providerId || !selectedPackageId || (selectedPackageId === 'single' && !selectedAngle) || (packageCategoryTab !== 'standard' && selectedPackageId === 'single' && (!selectedInteriorPackageId || !selectedAngle))}
          className="flex-1 px-4 py-3 bg-[#DC143C] hover:bg-[#B91C1C] disabled:bg-[#3F3F46] disabled:text-[#808080] text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            `Generate ${selectedPackageId === 'single' ? 'Single Angle' : 'Angle Package'}`
          )}
        </button>
      </div>
    </div>
  );
}
