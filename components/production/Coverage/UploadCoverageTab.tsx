'use client';

/**
 * UploadCoverageTab - Upload Coverage tab for Character Detail Modal
 * 
 * Features:
 * - Create new outfit OR select existing outfit
 * - Upload new images OR browse Media Library
 * - Pose guidance system
 * - Drag & drop upload
 * - Progress tracking
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FolderOpen, Loader2, X, Check, AlertCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import type { CharacterReference } from '../types';
import type { MediaFile } from '@/types/media';
import { PoseGuidanceSection } from '../CharacterStudio/PoseGuidanceSection';
import { MediaLibraryBrowser } from '../CharacterStudio/MediaLibraryBrowser';

interface UploadCoverageTabProps {
  characterId: string;
  characterName: string;
  screenplayId: string;
  existingReferences?: CharacterReference[];
  onComplete: (result: { outfitName: string; images: string[] }) => void;
}

interface UploadingImage {
  file: File;
  preview: string;
  progress: number;
  error?: string;
}

export function UploadCoverageTab({
  characterId,
  characterName,
  screenplayId,
  existingReferences = [],
  onComplete
}: UploadCoverageTabProps) {
  const { getToken } = useAuth();
  const [outfitMode, setOutfitMode] = useState<'create' | 'existing'>('create');
  const [newOutfitName, setNewOutfitName] = useState<string>('');
  const [selectedExistingOutfit, setSelectedExistingOutfit] = useState<string>('');
  const [imageSource, setImageSource] = useState<'upload' | 'browse'>('upload');
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Extract existing outfit names
  const existingOutfits = useMemo(() => {
    const outfits = new Set<string>();
    existingReferences.forEach(ref => {
      const outfit = ref.metadata?.outfitName || 'default';
      if (outfit !== 'default') {
        outfits.add(outfit);
      }
    });
    return Array.from(outfits).sort();
  }, [existingReferences]);

  // Auto-generate outfit name helper
  const generateOutfitName = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `Outfit_${year}${month}${day}_${hours}${minutes}${seconds}`;
  };

  // Get final outfit name
  const finalOutfitName = useMemo(() => {
    if (outfitMode === 'create') {
      return newOutfitName.trim() || generateOutfitName();
    } else {
      return selectedExistingOutfit || 'default';
    }
  }, [outfitMode, newOutfitName, selectedExistingOutfit]);

  // Handle file drop (upload)
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages: UploadingImage[] = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0
    }));
    setUploadingImages(prev => [...prev, ...newImages]);
    
    // Start upload
    handleImageUpload(acceptedFiles);
  }, [finalOutfitName]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp']
    },
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isProcessing
  });

  // Handle direct upload
  const handleImageUpload = async (files: File[]) => {
    setIsProcessing(true);
    const uploadedS3Keys: string[] = [];
    const outfitNameToUse = finalOutfitName;

    try {
      for (const file of files) {
        try {
          // Step 1: Get presigned POST URL
          const token = await getToken({ template: 'wryda-backend' });
          if (!token) throw new Error('Not authenticated');

          const presignedResponse = await fetch(
            `/api/video/upload/get-presigned-url?fileName=${encodeURIComponent(file.name)}&fileType=image&fileSize=${file.size}&projectId=${encodeURIComponent(screenplayId)}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          if (!presignedResponse.ok) {
            throw new Error(`Failed to get presigned URL: ${presignedResponse.statusText}`);
          }

          const { url, fields, s3Key } = await presignedResponse.json();

          // Update progress
          setUploadingImages(prev => prev.map(img => 
            img.file === file ? { ...img, progress: 30 } : img
          ));

          // Step 2: Upload to S3
          const formData = new FormData();
          Object.entries(fields).forEach(([key, value]) => {
            formData.append(key, value as string);
          });
          formData.append('file', file);

          const uploadResponse = await fetch(url, {
            method: 'POST',
            body: formData
          });

          if (!uploadResponse.ok) {
            throw new Error('Upload to S3 failed');
          }

          // Update progress
          setUploadingImages(prev => prev.map(img => 
            img.file === file ? { ...img, progress: 60 } : img
          ));

          // Step 3: Register in Character Bank
          const registerResponse = await fetch(
            `/api/character-bank/${characterId}/references`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                s3Key: s3Key,
                outfitName: outfitNameToUse === 'default' ? undefined : outfitNameToUse,
                source: 'user-upload',
                label: file.name,
                metadata: {
                  outfitName: outfitNameToUse === 'default' ? 'default' : outfitNameToUse,
                  fileName: file.name,
                  fileSize: file.size
                },
                screenplayId: screenplayId
              })
            }
          );

          if (!registerResponse.ok) {
            const errorData = await registerResponse.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to register reference');
          }

          const result = await registerResponse.json();
          uploadedS3Keys.push(result.reference.s3Key);

          // Update progress to 100%
          setUploadingImages(prev => prev.map(img => 
            img.file === file ? { ...img, progress: 100 } : img
          ));

        } catch (error: any) {
          console.error(`Failed to upload ${file.name}:`, error);
          setUploadingImages(prev => prev.map(img => 
            img.file === file ? { ...img, error: error.message || 'Upload failed' } : img
          ));
        }
      }

      if (uploadedS3Keys.length > 0) {
        toast.success(`Successfully uploaded ${uploadedS3Keys.length} image(s) to ${outfitNameToUse}`);
        onComplete({ outfitName: outfitNameToUse, images: uploadedS3Keys });
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload images');
    } finally {
      setIsProcessing(false);
      // Clear uploaded images after a delay
      setTimeout(() => {
        setUploadingImages([]);
      }, 2000);
    }
  };

  // Handle Media Library selection
  const handleSelectFromMediaLibrary = async (images: MediaFile[]) => {
    setIsProcessing(true);
    const outfitNameToUse = finalOutfitName;

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const uploadedS3Keys: string[] = [];

      for (const file of images) {
        try {
          const response = await fetch(
            `/api/character-bank/${characterId}/references`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                s3Key: file.s3Key,
                outfitName: outfitNameToUse === 'default' ? undefined : outfitNameToUse,
                source: 'user-upload',
                label: file.fileName,
                metadata: {
                  outfitName: outfitNameToUse === 'default' ? 'default' : outfitNameToUse,
                  fileName: file.fileName,
                  fileSize: file.fileSize,
                  fromMediaLibrary: true,
                  mediaLibraryFileId: file.id
                },
                screenplayId: screenplayId
              })
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to register reference');
          }

          const result = await response.json();
          uploadedS3Keys.push(result.reference.s3Key);

        } catch (error: any) {
          console.error(`Failed to add ${file.fileName}:`, error);
          toast.error(`Failed to add ${file.fileName}: ${error.message}`);
        }
      }

      if (uploadedS3Keys.length > 0) {
        toast.success(`Added ${uploadedS3Keys.length} image(s) from Media Library to ${outfitNameToUse}`);
        onComplete({ outfitName: outfitNameToUse, images: uploadedS3Keys });
      }

    } catch (error: any) {
      console.error('Failed to add images from Media Library:', error);
      toast.error(error.message || 'Failed to add images from Media Library');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Step 1: Create or Select Outfit */}
      <div className="bg-[#1F1F1F] border border-[#3F3F46] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Step 1: Create or Select Outfit</h3>
        
        <div className="space-y-4">
          {/* Mode Selection */}
          <div className="flex gap-2">
            <button
              onClick={() => setOutfitMode('create')}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${
                outfitMode === 'create'
                  ? 'bg-[#DC143C] text-white'
                  : 'bg-[#1F1F1F] text-[#808080] hover:bg-[#2A2A2A]'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Create New Outfit
            </button>
            <button
              onClick={() => setOutfitMode('existing')}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${
                outfitMode === 'existing'
                  ? 'bg-[#DC143C] text-white'
                  : 'bg-[#1F1F1F] text-[#808080] hover:bg-[#2A2A2A]'
              }`}
            >
              Add to Existing Outfit
            </button>
          </div>

          {/* Create New Outfit */}
          {outfitMode === 'create' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">
                Outfit Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOutfitName}
                  onChange={(e) => setNewOutfitName(e.target.value)}
                  placeholder="Enter outfit name (e.g., Casual, Formal)"
                  className="flex-1 px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg text-white placeholder-[#808080] focus:outline-none focus:ring-2 focus:ring-[#DC143C]"
                />
                <button
                  onClick={() => {
                    if (!newOutfitName.trim()) {
                      const autoName = generateOutfitName();
                      setNewOutfitName(autoName);
                      toast.info(`Auto-generated outfit name: ${autoName}`);
                    } else {
                      toast.success(`Outfit "${newOutfitName}" ready`);
                    }
                  }}
                  className="px-4 py-2 bg-[#DC143C] hover:bg-[#DC143C]/80 text-white rounded-lg transition-colors font-medium"
                >
                  Create
                </button>
              </div>
              <p className="text-xs text-[#808080]">
                {newOutfitName.trim() 
                  ? `Will create outfit: "${newOutfitName}"`
                  : `Leave empty to auto-generate: ${generateOutfitName()}`
                }
              </p>
            </div>
          )}

          {/* Select Existing Outfit */}
          {outfitMode === 'existing' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">
                Select Existing Outfit
              </label>
              {existingOutfits.length > 0 ? (
                <select
                  value={selectedExistingOutfit}
                  onChange={(e) => setSelectedExistingOutfit(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#DC143C]"
                >
                  <option value="">Select an outfit...</option>
                  {existingOutfits.map(outfit => (
                    <option key={outfit} value={outfit}>{outfit}</option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg text-[#808080]">
                  No existing outfits. Create a new one instead.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Upload Method */}
      <div className="bg-[#1F1F1F] border border-[#3F3F46] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Step 2: Add Images</h3>
        
        {/* Toggle between Upload and Browse */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setImageSource('upload')}
            disabled={isProcessing}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${
              imageSource === 'upload'
                ? 'bg-[#DC143C] text-white'
                : 'bg-[#1F1F1F] text-[#808080] hover:bg-[#2A2A2A]'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Upload New Images
          </button>
          <button
            onClick={() => setImageSource('browse')}
            disabled={isProcessing}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${
              imageSource === 'browse'
                ? 'bg-[#DC143C] text-white'
                : 'bg-[#1F1F1F] text-[#808080] hover:bg-[#2A2A2A]'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <FolderOpen className="w-4 h-4 inline mr-2" />
            Browse Media Library
          </button>
        </div>

        {/* Pose Guidance */}
        <PoseGuidanceSection
          existingReferences={existingReferences}
          outfitName={finalOutfitName}
        />

        {/* Conditional Content Based on Selection */}
        {imageSource === 'upload' ? (
          <div className="mt-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-[#DC143C] bg-[#DC143C]/10'
                  : 'border-[#3F3F46] hover:border-[#DC143C]/50'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 text-[#808080] mx-auto mb-4" />
              <p className="text-white mb-2">
                {isDragActive ? 'Drop images here' : 'Drag & drop images or click to browse'}
              </p>
              <p className="text-sm text-[#808080]">
                Max 10 images, JPG/PNG/WebP, up to 10MB each
              </p>
            </div>

            {/* Upload Progress */}
            {uploadingImages.length > 0 && (
              <div className="mt-4 space-y-2">
                {uploadingImages.map((img, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-[#0A0A0A] rounded">
                    <img src={img.preview} alt={img.file.name} className="w-16 h-16 object-cover rounded" />
                    <div className="flex-1">
                      <p className="text-sm text-white">{img.file.name}</p>
                      {img.error ? (
                        <p className="text-xs text-[#DC143C] mt-1">{img.error}</p>
                      ) : (
                        <div className="w-full bg-[#3F3F46] rounded-full h-2 mt-1">
                          <div
                            className="bg-[#DC143C] h-2 rounded-full transition-all"
                            style={{ width: `${img.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    {img.progress === 100 && (
                      <Check className="w-5 h-5 text-green-400" />
                    )}
                    {img.error && (
                      <AlertCircle className="w-5 h-5 text-[#DC143C]" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6">
            <MediaLibraryBrowser
              screenplayId={screenplayId}
              onSelectImages={handleSelectFromMediaLibrary}
              filterTypes={['image']}
              allowMultiSelect={true}
              maxSelections={10}
              selectedFolderPath={['Characters', characterName]}
            />
          </div>
        )}
      </div>
    </div>
  );
}

