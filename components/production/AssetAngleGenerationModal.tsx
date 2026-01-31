'use client';
/**
 * Asset Angle Generation Modal
 * 
 * Complete workflow for generating asset angle packages
 * Similar to LocationAngleGenerationModal but for assets
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle2, AlertCircle, Package, Car, Plane } from 'lucide-react';
import AssetAnglePackageSelector from './AssetAnglePackageSelector';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
// Safety errors are handled in job result monitoring (async pattern)

// Feature 0226: Vehicle/aircraft interior package definitions for UI (angleIds match backend)
const VEHICLE_INTERIOR_PACKAGES_UI: Record<string, { id: string; name: string; angleIds: string[]; angleLabels: string[] }> = {
  car: { id: 'car', name: 'Car (sedan)', angleIds: ['driver', 'passenger', 'back_seat', 'trunk'], angleLabels: ['Driver', 'Passenger', 'Back seat', 'Trunk'] },
  truck: { id: 'truck', name: 'Truck (pickup)', angleIds: ['driver', 'passenger', 'back_seat', 'bed'], angleLabels: ['Driver', 'Passenger', 'Back seat', 'Bed'] },
  suv: { id: 'suv', name: 'SUV', angleIds: ['driver', 'passenger', 'back_seat', 'cargo'], angleLabels: ['Driver', 'Passenger', 'Back seat', 'Cargo'] },
  van: { id: 'van', name: 'Van', angleIds: ['driver', 'passenger', 'rear_cargo'], angleLabels: ['Driver', 'Passenger', 'Rear cargo'] },
  semi: { id: 'semi', name: 'Semi (tractor-trailer cab)', angleIds: ['driver', 'passenger', 'sleeper', 'dashboard'], angleLabels: ['Driver', 'Passenger', 'Sleeper', 'Dashboard'] },
  helicopter: { id: 'helicopter', name: 'Helicopter', angleIds: ['pilot', 'passenger', 'rear_door'], angleLabels: ['Pilot', 'Passenger', 'Rear door'] },
  small_plane: { id: 'small_plane', name: 'Small plane (cockpit)', angleIds: ['pilot', 'co_pilot', 'rear_cabin'], angleLabels: ['Pilot', 'Co-pilot', 'Rear cabin'] },
  passenger_cabin: { id: 'passenger_cabin', name: 'Passenger plane cabin', angleIds: ['aisle', 'window_seat', 'galley', 'cabin_wide'], angleLabels: ['Aisle', 'Window seat', 'Galley', 'Cabin wide'] },
};
const GROUND_PACKAGE_IDS = ['car', 'truck', 'suv', 'van', 'semi'];
const AIRCRAFT_PACKAGE_IDS = ['helicopter', 'small_plane', 'passenger_cabin'];

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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {/* Single Angle card (mimics Standard Props single angle) */}
        <button
          type="button"
          onClick={() => {
            onSelectPackage('single');
            if (onSelectedInteriorPackageIdChange) onSelectedInteriorPackageIdChange(category === 'ground' ? 'car' : 'helicopter');
            const firstAngle = category === 'ground' ? 'driver' : 'pilot';
            if (onSelectedAngleChange) onSelectedAngleChange(firstAngle);
          }}
          className={`rounded-lg border-2 p-4 text-left transition-all ${
            isSingle ? 'border-primary bg-primary/10' : 'border-base-content/20 bg-base-300 hover:border-base-content/40'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-base-content/70" />
            <span className="font-medium text-sm text-base-content">Single Angle</span>
          </div>
          <div className="text-xs text-base-content/60 mb-1">1 angle</div>
          <div className="text-xs text-base-content/50">Pick vehicle/aircraft + angle</div>
          <div className="text-sm font-semibold text-base-content mt-2">{creditsPerImage} credits</div>
          {isSingle && <div className="text-xs text-primary mt-1">✓ Selected</div>}
        </button>
        {ids.map((id) => {
          const pkg = VEHICLE_INTERIOR_PACKAGES_UI[id];
          if (!pkg) return null;
          const credits = pkg.angleIds.length * creditsPerImage;
          const isSelected = selectedPackageId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectPackage(id)}
              className={`rounded-lg border-2 p-4 text-left transition-all ${
                isSelected ? 'border-primary bg-primary/10' : 'border-base-content/20 bg-base-300 hover:border-base-content/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {category === 'ground' ? <Car className="w-4 h-4 text-base-content/70" /> : <Plane className="w-4 h-4 text-base-content/70" />}
                <span className="font-medium text-sm text-base-content">{pkg.name}</span>
              </div>
              <div className="text-xs text-base-content/60 mb-1">{pkg.angleIds.length} angles</div>
              <div className="text-xs text-base-content/50 flex flex-wrap gap-1">
                {pkg.angleLabels.slice(0, 3).map((l) => (
                  <span key={l} className="bg-base-content/10 px-1 rounded">{l}</span>
                ))}
                {pkg.angleLabels.length > 3 && <span>+{pkg.angleLabels.length - 3}</span>}
              </div>
              <div className="text-sm font-semibold text-base-content mt-2">{credits} credits</div>
              {isSelected && <div className="text-xs text-primary mt-1">✓ Selected</div>}
            </button>
          );
        })}
      </div>
      {/* Single angle: package + angle dropdowns (mimics AssetAnglePackageSelector single mode) */}
      {isSingle && (
        <div className="rounded-lg border border-base-content/20 bg-base-300 p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-base-content mb-2">
              {category === 'ground' ? 'Vehicle' : 'Aircraft'}
            </label>
            <select
              value={interiorPackageId}
              onChange={(e) => {
                const nextId = e.target.value;
                if (onSelectedInteriorPackageIdChange) onSelectedInteriorPackageIdChange(nextId);
                const nextPkg = VEHICLE_INTERIOR_PACKAGES_UI[nextId];
                if (onSelectedAngleChange && nextPkg?.angleIds[0]) onSelectedAngleChange(nextPkg.angleIds[0]);
              }}
              className="w-full px-3 py-2 bg-base-200 border border-base-content/20 rounded-lg text-base-content text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {(category === 'ground' ? GROUND_PACKAGE_IDS : AIRCRAFT_PACKAGE_IDS).map((id) => {
                const p = VEHICLE_INTERIOR_PACKAGES_UI[id];
                return p ? <option key={id} value={id}>{p.name}</option> : null;
              })}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-base-content mb-2">Angle</label>
            <select
              value={selectedAngle && angleOptions.some((o) => o.id === selectedAngle) ? selectedAngle : (angleOptions[0]?.id ?? '')}
              onChange={(e) => onSelectedAngleChange?.(e.target.value)}
              className="w-full px-3 py-2 bg-base-200 border border-base-content/20 rounded-lg text-base-content text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {angleOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-base-content/50">
            Generate one interior angle. Great for trying a specific view before committing to a full package.
          </p>
        </div>
      )}
    </div>
  );
}

interface AssetAngleGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;
  assetName: string;
  projectId: string;
  asset: any; // Asset type
  onComplete?: (result: any) => void;
}

type GenerationStep = 'package' | 'generating' | 'complete' | 'error';

export default function AssetAngleGenerationModal({
  isOpen,
  onClose,
  assetId,
  assetName,
  projectId,
  asset,
  onComplete
}: AssetAngleGenerationModalProps) {
  const { getToken } = useAuth();
  
  const [step, setStep] = useState<GenerationStep>('package');
  const [packageCategoryTab, setPackageCategoryTab] = useState<'standard' | 'ground' | 'aircraft'>('standard'); // Feature 0226: tabs
  const [selectedPackageId, setSelectedPackageId] = useState<string>('standard');
  const [selectedAngle, setSelectedAngle] = useState<string>('front'); // 🔥 Feature 0190: Single angle selection
  const [selectedInteriorPackageId, setSelectedInteriorPackageId] = useState<string>('car'); // Feature 0226: which vehicle/aircraft when single angle on Ground/Aircraft
  const [providerId, setProviderId] = useState<string>('');
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
        const response = await fetch('/api/model-selection/assets', {
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
        console.error('[AssetAngleGenerationModal] Failed to load models:', error);
        toast.error('Failed to load available models');
      } finally {
        setIsLoadingModels(false);
      }
    }
    loadModels();
  }, [isOpen, getToken]);
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    setJobId(null);
    
    try {
      // Call backend API to generate angle package (async job pattern)
      const token = await getToken({ template: 'wryda-backend' });
      
      if (!token) {
        throw new Error('Failed to get backend token. Please try refreshing the page.');
      }
      
      const apiUrl = `/api/asset-bank/${assetId}/generate-angles`;
      
      // 🔥 FIX: Require providerId - no fallbacks (backend requires explicit providerId)
      if (!providerId || providerId.trim() === '') {
        throw new Error('Please select a model before generating angles.');
      }
      
      const selectedModel = models.find(m => m.id === providerId);
      const derivedQuality = selectedModel?.quality === '4K' ? 'high-quality' : 'standard';
      const isInteriorSingle = (packageCategoryTab === 'ground' || packageCategoryTab === 'aircraft') && selectedPackageId === 'single';
      const requestBody: any = {
        packageId: isInteriorSingle ? selectedInteriorPackageId : selectedPackageId,
        quality: derivedQuality,
        providerId: providerId,
        additionalPrompt: additionalPrompt.trim() || undefined,
        projectId: projectId,
        screenplayId: projectId,
      };
      if (packageCategoryTab === 'ground' || packageCategoryTab === 'aircraft') {
        requestBody.packageType = 'vehicle-interior';
      }
      if (selectedPackageId === 'single' || isInteriorSingle) {
        requestBody.selectedAngle = selectedAngle;
      }
      
      console.log('[AssetAngleGeneration] Calling API:', apiUrl);
      console.log('[AssetAngleGeneration] Request body:', {
        packageId: requestBody.packageId,
        selectedAngle: requestBody.selectedAngle,
        quality: derivedQuality,
        providerId: providerId,
        hasProviderId: !!providerId
      });
      console.log('[AssetAngleGeneration] Full requestBody:', JSON.stringify(requestBody, null, 2));
      
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
      
      // Store jobId and close modal immediately (async pattern - matches character poses and locations)
      if (result.jobId) {
        setJobId(result.jobId);
        console.log('[AssetAngleGeneration] Job started:', result.jobId);
        // Close modal immediately - job runs in background
        handleReset();
        onClose();
        
        // Toast notification handled by parent (AssetDetailModal) in onComplete callback
        
        // Call onComplete with jobId
        if (onComplete) {
          onComplete({ jobId: result.jobId, angleReferences: [] });
        }
      } else {
        throw new Error('No job ID returned from server');
      }
      
    } catch (err: any) {
      console.error('[AssetAngleGeneration] Error:', err);
      setError(err.message || 'An error occurred during generation');
      setStep('error');
      
      toast.error('Failed to start angle generation!', {
        description: err.message || 'Please try again.',
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
    setSelectedInteriorPackageId('car');
    setAdditionalPrompt('');
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
  
  // Calculate angle count for selected package (Feature 0226: vehicle interior counts)
  const packageAngleCounts: Record<string, number> = {
    single: 1,
    basic: 3,
    standard: 6,
    premium: 10,
    car: 4,
    truck: 4,
    suv: 4,
    van: 3,
    semi: 4,
    helicopter: 3,
    small_plane: 3,
    passenger_cabin: 4,
  };
  const angleCount = packageAngleCounts[selectedPackageId] ?? 6;
  
  const selectedModelForCredits = models.find(m => m.id === providerId);
  const creditsPerImageForTotal = selectedModelForCredits?.credits || 20;
  const totalCredits = angleCount * creditsPerImageForTotal;
  
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
                <p className="text-base-content/60 mt-1">Create consistent asset references for {assetName}</p>
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
                  
                  {/* Step 2: Package Selection (Feature 0226: Standard | Ground | Aircraft tabs) */}
                  <div>
                    <h3 className="text-sm font-semibold text-base-content mb-3">
                      Step 2: Package Selection
                    </h3>
                    <p className="text-xs text-base-content/60 mb-3">More angles = better consistency</p>
                    {/* Tabs: Standard Props | Ground Vehicles | Aircraft */}
                    <div className="flex gap-1 p-1 bg-base-300 rounded-lg mb-4 border border-base-content/10">
                      {(['standard', 'ground', 'aircraft'] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => {
                            setPackageCategoryTab(tab);
                            if (tab === 'standard') {
                              setSelectedPackageId('standard');
                            } else if (tab === 'ground') {
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
                            packageCategoryTab === tab
                              ? 'bg-primary text-primary-content'
                              : 'text-base-content/70 hover:bg-base-content/10'
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
                        quality={selectedModelForCredits?.quality === '4K' ? 'high-quality' : 'standard'}
                        creditsPerImage={creditsPerImageForTotal}
                        selectedAngle={selectedAngle}
                        onSelectedAngleChange={setSelectedAngle}
                      />
                    )}
                    {packageCategoryTab === 'ground' && (
                      <VehicleInteriorPackageCards
                        category="ground"
                        selectedPackageId={selectedPackageId}
                        onSelectPackage={setSelectedPackageId}
                        creditsPerImage={creditsPerImageForTotal}
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
                        creditsPerImage={creditsPerImageForTotal}
                        selectedAngle={selectedAngle}
                        onSelectedAngleChange={setSelectedAngle}
                        selectedInteriorPackageId={selectedInteriorPackageId}
                        onSelectedInteriorPackageIdChange={setSelectedInteriorPackageId}
                      />
                    )}
                  </div>
                  
                  {/* Credits Summary */}
                  <div className="bg-base-300 rounded-lg p-4 border border-base-content/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-base-content/60">Total Cost</div>
                        <div className="text-2xl font-bold text-base-content">{totalCredits} credits</div>
                        <div className="text-xs text-base-content/50 mt-1">
                          {angleCount} angles × {creditsPerImageForTotal} credits
                        </div>
                      </div>
                      <Package className="w-8 h-8 text-base-content/40" />
                    </div>
                  </div>
                  
                  {/* Additional Prompt */}
                  <div className="bg-base-300 rounded-lg p-4 border border-base-content/10">
                    <h3 className="text-sm font-semibold text-base-content mb-4">
                      Step 4: Additional Prompt (Optional)
                    </h3>
                    <textarea
                      value={additionalPrompt}
                      onChange={(e) => setAdditionalPrompt(e.target.value)}
                      placeholder="Add special instructions, color codes (#FF0000), or time-sensitive keywords for real-time search. Nano Banana Pro and FLUX.2 [max] support grounding search. FLUX.2 [max] supports explicit hex codes."
                      className="w-full h-24 bg-base-200 border border-base-content/20 rounded-lg p-3 text-base-content placeholder-base-content/50 focus:outline-none focus:border-[#DC143C] resize-none"
                    />
                    <p className="text-xs text-base-content/50 mt-2">
                      Example: "Latest iPhone model, brand colors #000000 #FFFFFF"
                    </p>
                  </div>
                  
                  {/* Generate Button */}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || !selectedPackageId || !providerId || (selectedPackageId === 'single' && !selectedAngle) || (packageCategoryTab !== 'standard' && selectedPackageId === 'single' && (!selectedInteriorPackageId || !selectedAngle))}
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
                      ? `Creating ${selectedAngle} angle for ${assetName}`
                      : `Creating ${angleCount} angle variations for ${assetName}`
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
                    Created {generationResult.angleReferences?.length || 0} angle variations for {assetName}
                  </p>
                  <div className="bg-base-300 rounded-lg p-6 max-w-md mx-auto mb-6">
                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div>
                        <div className="text-base-content/60 text-sm">Package</div>
                        <div className="text-base-content font-semibold capitalize">{selectedPackageId}</div>
                      </div>
                      <div>
                        <div className="text-base-content/60 text-sm">Angles</div>
                        <div className="text-base-content font-semibold">{generationResult.angleReferences?.length || 0}</div>
                      </div>
                      <div>
                        <div className="text-base-content/60 text-sm">Credits Used</div>
                        <div className="text-base-content font-semibold">{generationResult.creditsUsed || totalCredits}</div>
                      </div>
                      <div>
                        <div className="text-base-content/60 text-sm">Quality</div>
                        <div className="text-base-content font-semibold capitalize">{selectedModelForCredits?.quality === '4K' ? '4K' : '1080p'}</div>
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

