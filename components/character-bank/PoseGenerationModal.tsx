'use client';
/**
 * Pose Generation Modal
 * 
 * Complete workflow for generating character pose packages
 * Part of Feature 0098: Complete Character & Location Consistency System
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Wand2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import PosePackageSelector from './PosePackageSelector';
import { useAuth } from '@clerk/nextjs';

interface PoseGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string;
  characterName: string;
  projectId: string;
  baseReferenceUrl?: string; // Character's existing base reference image
  onComplete?: (result: any) => void;
}

type GenerationStep = 'package' | 'input' | 'generating' | 'complete' | 'error';

export default function PoseGenerationModal({
  isOpen,
  onClose,
  characterId,
  characterName,
  projectId,
  baseReferenceUrl,
  onComplete
}: PoseGenerationModalProps) {
  const { getToken } = useAuth();
  
  const [step, setStep] = useState<GenerationStep>('package');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('standard');
  
  // Input data
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState<string>('');
  const [screenplayContent, setScreenplayContent] = useState<string>('');
  const [manualDescription, setManualDescription] = useState<string>('');
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState(0);
  
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
    setStep('generating');
    setError('');
    setProgress(0);
    
    try {
      setProgress(10);
      
      // Use character's existing base reference image if available
      const headshotUrl = baseReferenceUrl || (headshotFile ? headshotPreview : '');
      
      setProgress(20);
      
      // Call backend API to generate pose package
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
            headshotUrl: headshotUrl || undefined,
            screenplayContent: screenplayContent || undefined,
            manualDescription: manualDescription || undefined
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate pose package');
      }
      
      // Simulate progress during generation
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 1000);
      
      const result = await response.json();
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setGenerationResult(result);
      setStep('complete');
      
      if (onComplete) {
        onComplete(result);
      }
      
    } catch (err: any) {
      console.error('[PoseGeneration] Error:', err);
      setError(err.message || 'An error occurred during generation');
      setStep('error');
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
    setHeadshotFile(null);
    setHeadshotPreview('');
    setScreenplayContent('');
    setManualDescription('');
    setGenerationResult(null);
    setError('');
    setProgress(0);
  };
  
  const handleClose = () => {
    handleReset();
    onClose();
  };
  
  return (
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
              
              {/* Step 1: Package Selection */}
              {step === 'package' && (
                <div className="space-y-6">
                  <PosePackageSelector
                    characterName={characterName}
                    onSelectPackage={(packageId) => {
                      setSelectedPackageId(packageId);
                      // Automatically generate when package is selected
                      handleGenerateWithPackage(packageId);
                    }}
                    selectedPackageId={selectedPackageId}
                  />
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
              
              {/* Step 3: Generating */}
              {step === 'generating' && (
                <div className="text-center py-12">
                  <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-100 mb-2">
                    Generating Pose Package...
                  </h3>
                  <p className="text-base-content/60 mb-6">
                    Creating {selectedPackageId} package poses for {characterName}
                  </p>
                  <div className="max-w-md mx-auto">
                    <div className="w-full bg-base-content/20 rounded-full h-3 mb-2">
                      <div 
                        className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-base-content/50">{progress}% complete</p>
                  </div>
                </div>
              )}
              
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
  );
}

