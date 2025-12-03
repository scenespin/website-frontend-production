'use client';
/**
 * Pose Generation Modal
 * 
 * Complete workflow for generating character pose packages
 * Part of Feature 0098: Complete Character & Location Consistency System
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Wand2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import PosePackageSelector from './PosePackageSelector';
import { OutfitSelector } from '../production/OutfitSelector';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

interface PoseGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string;
  characterName: string;
  projectId: string;
  baseReferenceS3Key?: string; // Character's existing base reference S3 key (not presigned URL)
  onComplete?: (result: any) => void;
}

type GenerationStep = 'package' | 'input' | 'generating' | 'complete' | 'error';

export default function PoseGenerationModal({
  isOpen,
  onClose,
  characterId,
  characterName,
  projectId,
  baseReferenceS3Key,
  onComplete
}: PoseGenerationModalProps) {
  const { getToken } = useAuth();
  
  const [step, setStep] = useState<GenerationStep>('package');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('standard');
  const [typicalClothing, setTypicalClothing] = useState<string | undefined>(undefined);
  const [characterDefaultOutfit, setCharacterDefaultOutfit] = useState<string | undefined>(undefined);
  
  // Input data
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState<string>('');
  const [screenplayContent, setScreenplayContent] = useState<string>('');
  const [manualDescription, setManualDescription] = useState<string>('');
  
  // Fetch character's default outfit on mount
  useEffect(() => {
    if (isOpen && characterId && projectId) {
      const fetchCharacterOutfit = async () => {
        try {
          const token = await getToken({ template: 'wryda-backend' });
          // Get character from screenplay characters API
          const response = await fetch(`/api/screenplays/${projectId}/characters/${characterId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            const outfit = data.data?.physicalAttributes?.typicalClothing;
            if (outfit) {
              setCharacterDefaultOutfit(outfit);
            }
          }
        } catch (error) {
          console.error('[PoseGenerationModal] Failed to fetch character outfit:', error);
          // Non-fatal - continue without default
        }
      };
      fetchCharacterOutfit();
    }
  }, [isOpen, characterId, projectId, getToken]);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [jobId, setJobId] = useState<string | null>(null);
  
  const handleHeadshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHeadshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeadshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleGenerateWithPackage = async (packageId: string) => {
    setIsGenerating(true);
    setError('');
    setJobId(null);
    
    try {
      // Show initial toast notification
      toast.info('Starting pose generation...', {
        id: 'pose-gen-start',
        duration: Infinity,
        icon: <Loader2 className="w-4 h-4 animate-spin" />
      });
      
      // Call backend API to generate pose package
      // Backend will create a job automatically
      const token = await getToken({ template: 'wryda-backend' });
      const response = await fetch(
        `/api/projects/${projectId}/characters/${characterId}/generate-poses`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
            body: JSON.stringify({
            characterName,
            packageId: packageId,
            headshotS3Key: baseReferenceS3Key || undefined, // Pass s3Key, backend will generate presigned URL
            headshotUrl: headshotFile ? headshotPreview : undefined, // Only for manual uploads
            screenplayContent: screenplayContent || undefined,
            manualDescription: manualDescription || undefined,
            typicalClothing: typicalClothing, // NEW: Pass selected outfit
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.message || 'Failed to generate pose package';
        
        // Sanitize error message - remove internal model names and technical details
        errorMessage = errorMessage
          .replace(/MODEL_NOT_FOUND:\s*\w+(-\w+)*/gi, 'Model not available')
          .replace(/luma-photon-\w+/gi, 'image generation model')
          .replace(/photon-\w+/gi, 'image generation model')
          .replace(/Failed to generate pose \w+:\s*/gi, 'Failed to generate pose: ');
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      // Store jobId for reference
      if (result.jobId) {
        setJobId(result.jobId);
      }
      
      // Reset state before closing
      handleReset();
      
      // Close modal immediately - jobs area will handle tracking
      onClose();
      
      // Dismiss initial toast and show success toast
      toast.dismiss('pose-gen-start');
      toast.success('Pose generation started!', {
        description: 'View in Jobs tab to track progress and save your poses.',
        action: {
          label: 'View Jobs',
          onClick: () => {
            // Navigate to jobs tab
            window.location.href = `/production?tab=jobs&projectId=${projectId}`;
          }
        },
        duration: 5000
      });
      
      if (onComplete) {
        onComplete(result);
      }
      
    } catch (err: any) {
      console.error('[PoseGeneration] Error:', err);
      setError(err.message || 'An error occurred during generation');
      
      // Dismiss initial toast and show error toast
      toast.dismiss('pose-gen-start');
      toast.error('Pose generation failed!', {
        description: err.message || 'Please try again.',
        duration: Infinity // Keep error toast visible
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    await handleGenerateWithPackage(selectedPackageId);
  };
  
  const handleReset = () => {
    setStep('package');
    setSelectedPackageId('standard');
    setTypicalClothing(undefined);
    setHeadshotFile(null);
    setHeadshotPreview('');
    setScreenplayContent('');
    setManualDescription('');
    setGenerationResult(null);
    setError('');
  };
  
  const handleClose = () => {
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
                <h2 className="text-2xl font-bold text-base-content">Generate Pose Package</h2>
                <p className="text-base-content/60 mt-1">Create consistent character references for {characterName}</p>
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
              
              {/* Step 1: Outfit Selection & Package Selection */}
              {step === 'package' && (
                <div className="space-y-6">
                  {/* Outfit Selection - NEW */}
                  <div className="bg-base-300 rounded-lg p-4 border border-base-content/10">
                    <h3 className="text-sm font-semibold text-base-content mb-4">
                      Step 1: Select Outfit
                    </h3>
                    <OutfitSelector
                      value={typicalClothing}
                      defaultValue={characterDefaultOutfit}
                      onChange={(outfit) => setTypicalClothing(outfit)}
                      label="Character Outfit"
                      showDefaultOption={true}
                    />
                    <p className="text-xs text-base-content/50 mt-2">
                      All poses in the package will be generated wearing the selected outfit
                    </p>
                  </div>
                  
                  {/* Package Selection */}
                  <div>
                    <h3 className="text-sm font-semibold text-base-content mb-4">
                      Step 2: Select Package
                    </h3>
                    <PosePackageSelector
                      characterName={characterName}
                      onSelectPackage={(packageId) => {
                        setSelectedPackageId(packageId);
                      }}
                      selectedPackageId={selectedPackageId}
                    />
                  </div>
                  
                  {/* Generate Button */}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || !selectedPackageId}
                      className="px-6 py-3 bg-primary text-primary-content rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? 'Generating...' : 'Generate Pose Package'}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Step 2: Input Data */}
              {step === 'input' && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-bold text-gray-100 mb-2">
                      Provide Character Information
                    </h3>
                    <p className="text-base-content/60">
                      Upload a headshot, paste screenplay text, or write a description. The more info, the better!
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Headshot Upload */}
                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-base-content/70">
                        <Upload className="w-4 h-4 inline mr-2" />
                        Headshot (Optional)
                      </label>
                      
                      <div className="border-2 border-dashed border-base-content/20 rounded-lg p-6 hover:border-base-content/30 transition-colors">
                        {headshotPreview ? (
                          <div className="relative">
                            <img
                              src={headshotPreview}
                              alt="Headshot preview"
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => {
                                setHeadshotFile(null);
                                setHeadshotPreview('');
                              }}
                              className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full"
                            >
                              <X className="w-4 h-4 text-base-content" />
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer block text-center">
                            <Upload className="w-12 h-12 text-base-content/50 mx-auto mb-2" />
                            <div className="text-sm text-base-content/60">
                              Click to upload headshot
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleHeadshotUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                      
                      <p className="text-xs text-base-content/50">
                        AI will analyze the headshot to extract physical attributes
                      </p>
                    </div>
                    
                    {/* Screenplay Content */}
                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-base-content/70">
                        <FileText className="w-4 h-4 inline mr-2" />
                        Screenplay Description (Optional)
                      </label>
                      
                      <textarea
                        value={screenplayContent}
                        onChange={(e) => setScreenplayContent(e.target.value)}
                        placeholder="Paste character introduction from screenplay..."
                        className="w-full h-32 bg-base-300 border border-base-content/20 rounded-lg p-3 text-gray-100 placeholder-base-content/50 focus:outline-none focus:border-blue-500"
                      />
                      
                      <p className="text-xs text-base-content/50">
                        Include the character's first appearance or description
                      </p>
                    </div>
                  </div>
                  
                  {/* Manual Description */}
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-base-content/70">
                      <Wand2 className="w-4 h-4 inline mr-2" />
                      Additional Description (Optional)
                    </label>
                    
                    <textarea
                      value={manualDescription}
                      onChange={(e) => setManualDescription(e.target.value)}
                      placeholder="Add any additional details about the character..."
                      className="w-full h-24 bg-base-300 border border-base-content/20 rounded-lg p-3 text-gray-100 placeholder-base-content/50 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Actions */}
                  <div className="flex justify-between pt-4">
                    <button
                      onClick={() => setStep('package')}
                      className="px-6 py-3 bg-base-300 hover:bg-base-content/20 text-base-content rounded-lg font-semibold transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleGenerate}
                      className="px-6 py-3 bg-[#DC143C] hover:bg-blue-700 text-base-content rounded-lg font-semibold transition-colors flex items-center"
                    >
                      <Wand2 className="w-5 h-5 mr-2" />
                      Generate Poses
                    </button>
                  </div>
                </div>
              )}
              
              {/* Step 3: Generating - Removed since jobs handle this now */}
              
              {/* Step 4: Complete */}
              {step === 'complete' && generationResult && (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-100 mb-2">
                    Pose Package Generated!
                  </h3>
                  <p className="text-base-content/60 mb-6">
                    Created {generationResult.result?.poses?.length || 0} poses for {characterName}
                  </p>
                  <div className="bg-base-300 rounded-lg p-6 max-w-md mx-auto mb-6">
                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div>
                        <div className="text-base-content/60 text-sm">Package</div>
                        <div className="text-base-content font-semibold capitalize">{selectedPackageId}</div>
                      </div>
                      <div>
                        <div className="text-base-content/60 text-sm">Credits Used</div>
                        <div className="text-base-content font-semibold">{generationResult.result?.totalCredits || 0}</div>
                      </div>
                      <div>
                        <div className="text-base-content/60 text-sm">Poses</div>
                        <div className="text-base-content font-semibold">{generationResult.result?.poses?.length || 0}</div>
                      </div>
                      <div>
                        <div className="text-base-content/60 text-sm">Consistency</div>
                        <div className="text-base-content font-semibold">{generationResult.result?.consistencyRating || 0}%</div>
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
              
              {/* Step 5: Error */}
              {step === 'error' && (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-100 mb-2">
                    Generation Failed
                  </h3>
                  <p className="text-base-content/60 mb-6">
                    {error}
                  </p>
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-base-300 hover:bg-base-content/20 text-base-content rounded-lg font-semibold transition-colors"
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

