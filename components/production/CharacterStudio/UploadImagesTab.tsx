'use client';

/**
 * UploadImagesTab - Upload Images tab for Character Studio
 * 
 * Features:
 * - Outfit selection
 * - Upload new images OR browse Media Library
 * - Pose guidance system
 * - Drag & drop upload
 * - Progress tracking
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FolderOpen, Loader2, X, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import type { CharacterReference } from '../types';
import type { MediaFile } from '@/types/media';
import { useMediaFiles } from '@/hooks/useMediaLibrary';
import { OutfitSelector } from '../OutfitSelector';
import { PoseGuidanceSection } from './PoseGuidanceSection';
import { MediaLibraryBrowser } from './MediaLibraryBrowser';

interface UploadImagesTabProps {
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

export function UploadImagesTab({
  characterId,
  characterName,
  screenplayId,
  existingReferences = [],
  onComplete
}: UploadImagesTabProps) {
  const { getToken } = useAuth();
  const [outfitName, setOutfitName] = useState<string>('default');
  const [imageSource, setImageSource] = useState<'upload' | 'browse'>('upload');
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [selectedMediaLibraryImages, setSelectedMediaLibraryImages] = useState<MediaFile[]>([]);
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
    return Array.from(outfits);
  }, [existingReferences]);

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
  }, []);

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
                outfitName: outfitName === 'default' ? undefined : outfitName,
                source: 'user-upload',
                label: file.name,
                metadata: {
                  outfitName: outfitName === 'default' ? 'default' : outfitName,
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
        toast.success(`Successfully uploaded ${uploadedS3Keys.length} image(s)`);
        onComplete({ outfitName, images: uploadedS3Keys });
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
    setSelectedMediaLibraryImages(images);

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
                outfitName: outfitName === 'default' ? undefined : outfitName,
                source: 'user-upload',
                label: file.fileName,
                metadata: {
                  outfitName: outfitName === 'default' ? 'default' : outfitName,
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
        toast.success(`Added ${uploadedS3Keys.length} image(s) from Media Library`);
        onComplete({ outfitName, images: uploadedS3Keys });
      }

    } catch (error: any) {
      console.error('Failed to add images from Media Library:', error);
      toast.error(error.message || 'Failed to add images from Media Library');
    } finally {
      setIsProcessing(false);
      setSelectedMediaLibraryImages([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Outfit Selection */}
      <div className="bg-[#1F1F1F] border border-[#3F3F46] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Step 1: Select Outfit</h3>
        <div className="max-w-md">
          <OutfitSelector
            value={outfitName === 'default' ? undefined : outfitName}
            onChange={(value) => setOutfitName(value || 'default')}
            label="Outfit/Style Name"
          />
          {outfitName !== 'default' && (
            <p className="text-xs text-[#808080] mt-2">
              Images will be organized under "{outfitName}" outfit
            </p>
          )}
        </div>
      </div>

      {/* Step 2: Image Source Selection */}
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

        {/* Pose Guidance (shown for both options) */}
        <PoseGuidanceSection
          existingReferences={existingReferences}
          outfitName={outfitName}
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

