'use client';

/**
 * GenerateAssetTab - Generate Asset Angle Packages tab for Asset Detail Modal
 * 
 * Converted from AssetAngleGenerationModal to tab format
 * Steps:
 * Step 1: Model Selection (unified dropdown from API)
 * Step 2: Package Selection
 * Step 3: Additional Prompt (Optional)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import AssetAnglePackageSelector from '../AssetAnglePackageSelector';

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
  
  // Step 2: Package Selection
  const [selectedPackageId, setSelectedPackageId] = useState<string>('standard');
  const [selectedAngle, setSelectedAngle] = useState<string>('front'); // 🔥 Feature 0190: Single angle selection
  
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
      // 🔥 Feature 0190: Handle single angle mode
      const requestBody: any = {
        packageId: selectedPackageId,
        quality: derivedQuality,
        providerId: providerId,
        additionalPrompt: additionalPrompt.trim() || undefined,
        projectId: screenplayId, // 🔥 FIX: Include projectId for job creation (matches location angle generation pattern)
        screenplayId: screenplayId, // Legacy support
      };
      
      // Add selectedAngle for single mode
      if (selectedPackageId === 'single') {
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
        window.dispatchEvent(new CustomEvent('wryda:job-created'));
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
  
  // Calculate total credits
  const packageAngleCounts: Record<string, number> = {
    single: 1,
    basic: 3,
    standard: 6,
    premium: 10
  };
  
  // 🔥 FIX: Ensure single package always calculates as 1 angle
  const angleCount = selectedPackageId === 'single' ? 1 : (packageAngleCounts[selectedPackageId] || 6);
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

      {/* Step 2: Package Selection */}
      <div className="bg-[#1F1F1F] border border-[#3F3F46] rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-4">
          Step 2: Package Selection
        </h3>
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
          disabled={isGenerating || isLoadingModels || !providerId || !selectedPackageId || (selectedPackageId === 'single' && !selectedAngle)}
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
