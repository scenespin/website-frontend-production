'use client';
/**
 * Asset Angle Generation Modal
 * 
 * Complete workflow for generating asset angle packages
 * Similar to LocationAngleGenerationModal but for assets
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle2, AlertCircle, Package } from 'lucide-react';
import AssetAnglePackageSelector from './AssetAnglePackageSelector';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

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
  const [selectedPackageId, setSelectedPackageId] = useState<string>('standard');
  const [quality, setQuality] = useState<'standard' | 'high-quality'>('standard');
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [jobId, setJobId] = useState<string | null>(null);
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    setJobId(null);
    setStep('generating');
    
    try {
      // Show initial toast notification
      toast.info('Starting angle generation...', {
        id: 'asset-angle-gen-start',
        duration: Infinity,
        icon: <Loader2 className="w-4 h-4 animate-spin" />
      });
      
      // Call backend API to generate angle package
      const token = await getToken({ template: 'wryda-backend' });
      
      if (!token) {
        throw new Error('Failed to get backend token. Please try refreshing the page.');
      }
      
      const apiUrl = `/api/asset-bank/${assetId}/generate-angles`;
      const requestBody = {
        packageId: selectedPackageId,
        quality: quality
      };
      
      console.log('[AssetAngleGeneration] Calling API:', apiUrl);
      console.log('[AssetAngleGeneration] Request body:', requestBody);
      console.log('[AssetAngleGeneration] Token available:', !!token);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('[AssetAngleGeneration] Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          const text = await response.text();
          console.error('[AssetAngleGeneration] Non-JSON error response:', text);
          throw new Error(`Server error (${response.status}): ${text || response.statusText}`);
        }
        
        console.error('[AssetAngleGeneration] Error response:', errorData);
        
        // Handle different error response formats
        let errorMessage: string;
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' ? errorData.error : 'Failed to generate angle package';
        } else {
          errorMessage = 'Failed to generate angle package';
        }
        
        // Sanitize error message
        errorMessage = errorMessage
          .replace(/MODEL_NOT_FOUND:\s*\w+(-\w+)*/gi, 'Model not available')
          .replace(/runway-gen-4/gi, 'image generation model')
          .replace(/Failed to generate angle \w+:\s*/gi, 'Failed to generate angle: ');
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      // Store jobId if provided (for async job tracking)
      if (result.jobId) {
        setJobId(result.jobId);
        console.log('[AssetAngleGeneration] Job created:', result.jobId);
      }
      
      // If angles are returned directly (synchronous), show them
      if (result.angleReferences && result.angleReferences.length > 0) {
        setGenerationResult(result);
        setStep('complete');
      } else {
        // Async job - close modal and show success
        handleReset();
        onClose();
        
        toast.dismiss('asset-angle-gen-start');
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
      }
      
      // Call onComplete with result
      if (onComplete) {
        onComplete({ jobId: result.jobId, angleReferences: result.angleReferences || [] });
      }
      
    } catch (err: any) {
      console.error('[AssetAngleGeneration] Error:', err);
      setError(err.message || 'An error occurred during generation');
      setStep('error');
      
      // Dismiss initial toast and show error toast
      toast.dismiss('asset-angle-gen-start');
      toast.error('Angle generation failed!', {
        description: err.message || 'Please try again.',
        duration: Infinity
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleReset = () => {
    setStep('package');
    setSelectedPackageId('standard');
    setQuality('standard');
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
  
  // Calculate angle count for selected package
  const packageAngleCounts: Record<string, number> = {
    basic: 3,
    standard: 6,
    premium: 10
  };
  const angleCount = packageAngleCounts[selectedPackageId] || 6;
  
  // Calculate credits based on package and quality
  const packageCredits: Record<string, { standard: number; highQuality: number }> = {
    basic: { standard: 60, highQuality: 120 },
    standard: { standard: 120, highQuality: 240 },
    premium: { standard: 200, highQuality: 400 }
  };
  const totalCredits = packageCredits[selectedPackageId]?.[quality === 'high-quality' ? 'highQuality' : 'standard'] || 120;
  
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
                  {/* Quality Selection */}
                  <div className="bg-base-300 rounded-lg p-4 border border-base-content/10">
                    <h3 className="text-sm font-semibold text-base-content mb-4">
                      Step 1: Select Quality
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setQuality('standard')}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          quality === 'standard'
                            ? 'border-[#8B5CF6] bg-[#8B5CF6]/10'
                            : 'border-base-content/20 hover:border-base-content/40'
                        }`}
                      >
                        <div className="font-semibold text-base-content mb-1">Standard (1080p)</div>
                        <div className="text-xs text-base-content/60 mb-2">
                          20 credits per image
                        </div>
                        <div className="text-xs text-base-content/50">
                          Fewer safety restrictions, more creative freedom. Perfect for most projects.
                        </div>
                      </button>
                      <button
                        onClick={() => setQuality('high-quality')}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          quality === 'high-quality'
                            ? 'border-[#8B5CF6] bg-[#8B5CF6]/10'
                            : 'border-base-content/20 hover:border-base-content/40'
                        }`}
                      >
                        <div className="font-semibold text-base-content mb-1">High Quality (4K)</div>
                        <div className="text-xs text-base-content/60 mb-2">
                          40 credits per image
                        </div>
                        <div className="text-xs text-base-content/50">
                          Maximum resolution and quality. Best for final production.
                        </div>
                      </button>
                    </div>
                  </div>
                  
                  {/* Package Selection */}
                  <div>
                    <h3 className="text-sm font-semibold text-base-content mb-4">
                      Step 2: Select Package
                    </h3>
                    <AssetAnglePackageSelector
                      assetName={assetName}
                      onSelectPackage={(packageId) => {
                        setSelectedPackageId(packageId);
                      }}
                      selectedPackageId={selectedPackageId}
                      quality={quality}
                    />
                  </div>
                  
                  {/* Credits Summary */}
                  <div className="bg-base-300 rounded-lg p-4 border border-base-content/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-base-content/60">Total Cost</div>
                        <div className="text-2xl font-bold text-base-content">{totalCredits} credits</div>
                        <div className="text-xs text-base-content/50 mt-1">
                          {angleCount} angles × {quality === 'high-quality' ? '40' : '20'} credits
                        </div>
                      </div>
                      <Package className="w-8 h-8 text-base-content/40" />
                    </div>
                  </div>
                  
                  {/* Generate Button */}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || !selectedPackageId}
                      className="px-6 py-3 bg-primary text-primary-content rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? 'Generating...' : 'Generate Angle Package'}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Step 2: Generating */}
              {step === 'generating' && (
                <div className="text-center py-12">
                  <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
                  <h3 className="text-xl font-bold text-gray-100 mb-2">
                    Generating Angle Variations...
                  </h3>
                  <p className="text-base-content/60">
                    Creating {angleCount} angle variations for {assetName}
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
                        <div className="text-base-content font-semibold capitalize">{quality === 'high-quality' ? '4K' : '1080p'}</div>
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
    
  </>
  );
}

