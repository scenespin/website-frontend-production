'use client';

/**
 * UploadLocationImagesTab - Upload Images tab for Location Detail Modal
 * 
 * Feature 0192: Location/Asset Upload Tab
 * 
 * Features:
 * - Create new view OR select existing view
 * - Upload new images OR browse Archive
 * - Location guidance system
 * - Drag & drop upload
 * - Progress tracking
 */

import React, { useState, useMemo, useRef } from 'react';
import { Upload, FolderOpen, Loader2, X, Check, AlertCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import type { MediaFile } from '@/types/media';
import { LocationGuidanceSection } from '../CharacterStudio/LocationGuidanceSection';
import { MediaLibraryBrowser } from '../CharacterStudio/MediaLibraryBrowser';
import { useIsMobile } from '@/hooks/use-mobile';

interface LocationReference {
  id?: string;
  s3Key?: string;
  imageUrl?: string;
  metadata?: {
    viewName?: string;
    [key: string]: any;
  };
}

interface UploadLocationImagesTabProps {
  locationId: string;
  locationName: string;
  screenplayId: string;
  existingReferences?: LocationReference[];
  onComplete: (result: { viewName: string; images: string[] }) => void;
}

interface UploadingImage {
  file: File;
  preview: string;
  progress: number;
  error?: string;
}

export function UploadLocationImagesTab({
  locationId,
  locationName,
  screenplayId,
  existingReferences = [],
  onComplete
}: UploadLocationImagesTabProps) {
  const { getToken } = useAuth();
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'create' | 'existing'>('create');
  const [newViewName, setNewViewName] = useState<string>('');
  const [selectedExistingView, setSelectedExistingView] = useState<string>('');
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract existing view names
  const existingViews = useMemo(() => {
    const views = new Set<string>();
    existingReferences.forEach(ref => {
      const view = ref.metadata?.viewName || 'default';
      if (view !== 'default') {
        views.add(view);
      }
    });
    return Array.from(views).sort();
  }, [existingReferences]);

  // Get final view name
  const finalViewName = useMemo(() => {
    if (viewMode === 'create') {
      return newViewName.trim() || null;
    } else {
      return selectedExistingView || null;
    }
  }, [viewMode, newViewName, selectedExistingView]);
  
  // Check if view name is valid
  const isViewNameValid = useMemo(() => {
    if (viewMode === 'create') {
      return newViewName.trim().length > 0;
    } else {
      return selectedExistingView.length > 0;
    }
  }, [viewMode, newViewName, selectedExistingView]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    if (!isViewNameValid) {
      toast.error('Please create or select a view name first (Step 1)');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    const newImages: UploadingImage[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0
    }));
    setUploadingImages(prev => [...prev, ...newImages]);
    
    handleImageUpload(files);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle direct upload
  const handleImageUpload = async (files: File[]) => {
    if (!isViewNameValid || !finalViewName) {
      toast.error('Please create or select a view name first (Step 1)');
      return;
    }
    
    setIsProcessing(true);
    const uploadedS3Keys: string[] = [];
    const viewNameToUse = finalViewName;

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

          // Step 3: Register with Location
          const registerResponse = await fetch(
            `/api/locations/${screenplayId}/${locationId}/references`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                s3Key: s3Key,
                viewName: viewNameToUse,
                source: 'user-upload',
                label: file.name,
                metadata: {
                  viewName: viewNameToUse,
                  fileName: file.name,
                  fileSize: file.size
                }
              })
            }
          );

          if (!registerResponse.ok) {
            const errorData = await registerResponse.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to register reference');
          }

          const result = await registerResponse.json();
          if (!result.data || !result.data.reference) {
            throw new Error('Invalid response format from server');
          }
          uploadedS3Keys.push(result.data.reference.s3Key);

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
        toast.success(`Successfully uploaded ${uploadedS3Keys.length} image(s) to ${viewNameToUse}`);
        onComplete({ viewName: viewNameToUse, images: uploadedS3Keys });
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload images');
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        setUploadingImages([]);
      }, 2000);
    }
  };

  // Handle Media Library selection
  const handleSelectFromMediaLibrary = async (images: MediaFile[]) => {
    if (!isViewNameValid || !finalViewName) {
      toast.error('Please create or select a view name first (Step 1)');
      return;
    }
    
    setIsProcessing(true);
    const viewNameToUse = finalViewName;

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const uploadedS3Keys: string[] = [];

      for (const file of images) {
        try {
          const response = await fetch(
            `/api/locations/${screenplayId}/${locationId}/references`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                s3Key: file.s3Key,
                viewName: viewNameToUse,
                source: 'user-upload',
                label: file.fileName,
                metadata: {
                  viewName: viewNameToUse,
                  fileName: file.fileName,
                  fileSize: file.fileSize,
                  fromMediaLibrary: true,
                  mediaLibraryFileId: file.id
                }
              })
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to register reference');
          }

          const result = await response.json();
          if (!result.data || !result.data.reference) {
            throw new Error('Invalid response format from server');
          }
          uploadedS3Keys.push(result.data.reference.s3Key);

        } catch (error: any) {
          console.error(`Failed to add ${file.fileName}:`, error);
          toast.error(`Failed to add ${file.fileName}: ${error.message}`);
        }
      }

      if (uploadedS3Keys.length > 0) {
        toast.success(`Added ${uploadedS3Keys.length} image(s) from Archive to ${viewNameToUse}`);
        onComplete({ viewName: viewNameToUse, images: uploadedS3Keys });
      }

    } catch (error: any) {
      console.error('Failed to add images from Archive:', error);
      toast.error(error.message || 'Failed to add images from Archive');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`${isMobile ? 'p-3' : 'p-6'} space-y-4`}>
      {/* Step 1: Create or Select View */}
      <div className={`bg-[#1F1F1F] border border-[#3F3F46] rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
        <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-white mb-3`}>Step 1: Create or Select View</h3>
        
        <div className="space-y-3">
          {/* Mode Selection */}
          <div className={`flex ${isMobile ? 'flex-col gap-3' : 'gap-4'}`}>
            <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
              <input
                type="radio"
                name="viewMode"
                checked={viewMode === 'create'}
                onChange={() => setViewMode('create')}
                className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-[#DC143C] focus:ring-[#DC143C] focus:ring-2`}
              />
              <span className={`${isMobile ? 'text-base' : 'text-sm'} text-white`}>Create New View</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
              <input
                type="radio"
                name="viewMode"
                checked={viewMode === 'existing'}
                onChange={() => setViewMode('existing')}
                className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-[#DC143C] focus:ring-[#DC143C] focus:ring-2`}
              />
              <span className={`${isMobile ? 'text-base' : 'text-sm'} text-white`}>Add to Existing View</span>
            </label>
          </div>

          {/* Create New View */}
          {viewMode === 'create' && (
            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2'}`}>
              <input
                type="text"
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                placeholder="Enter view name (e.g., Wide Shot, Entrance, Detail)"
                className={`flex-1 ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-1.5 text-sm'} bg-[#0A0A0A] border border-[#3F3F46] rounded text-white placeholder-[#808080] focus:outline-none focus:ring-1 focus:ring-[#DC143C]`}
              />
              <button
                onClick={() => {
                  if (!newViewName.trim()) {
                    toast.error('Please enter a view name');
                    return;
                  }
                  toast.success(`View "${newViewName.trim()}" is ready for images`);
                }}
                disabled={!newViewName.trim()}
                className={`${isMobile ? 'w-full px-4 py-3 text-base min-h-[48px]' : 'px-3 py-1.5 text-sm'} bg-[#DC143C] hover:bg-[#DC143C]/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors font-medium`}
              >
                Create
              </button>
            </div>
          )}

          {/* Select Existing View */}
          {viewMode === 'existing' && (
            <div>
              {existingViews.length > 0 ? (
                <select
                  value={selectedExistingView || '__select__'}
                  onChange={(e) => setSelectedExistingView(e.target.value === '__select__' ? '' : e.target.value)}
                  className={`select select-bordered w-full ${isMobile ? 'h-12 text-base' : 'h-9 text-sm'} bg-[#0A0A0A] border-[#3F3F46] text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]`}
                >
                  <option value="__select__" className="bg-[#1A1A1A] text-[#FFFFFF]">Select a view...</option>
                  {existingViews.map(view => (
                    <option key={view} value={view} className="bg-[#1A1A1A] text-[#FFFFFF]">{view}</option>
                  ))}
                </select>
              ) : (
                <div className={`${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-1.5 text-sm'} bg-[#0A0A0A] border border-[#3F3F46] rounded text-[#808080]`}>
                  No existing views. Create a new one instead.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Add Images */}
      <div className={`bg-[#1F1F1F] border border-[#3F3F46] rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
        <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-white mb-3`}>Step 2: Add Images</h3>
        
        {/* Action Buttons */}
        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2'} mb-3`}>
          <button
            onClick={() => {
              if (!isViewNameValid) {
                toast.error('Please create or select a view name first (Step 1)');
                return;
              }
              fileInputRef.current?.click();
            }}
            disabled={isProcessing || !isViewNameValid}
            className={`flex-1 ${isMobile ? 'w-full px-4 py-3 text-base min-h-[48px]' : 'px-4 py-2 text-sm'} bg-[#DC143C] hover:bg-[#DC143C]/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium transition-colors flex items-center justify-center gap-2`}
          >
            <Upload className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} />
            Upload New Images
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => {
              if (!isViewNameValid) {
                toast.error('Please create or select a view name first (Step 1)');
                return;
              }
              setShowMediaLibrary(!showMediaLibrary);
            }}
            disabled={isProcessing || !isViewNameValid}
            className={`flex-1 ${isMobile ? 'w-full px-4 py-3 text-base min-h-[48px]' : 'px-4 py-2 text-sm'} bg-[#1F1F1F] hover:bg-[#2A2A2A] disabled:opacity-50 disabled:cursor-not-allowed text-white border border-[#3F3F46] rounded font-medium transition-colors flex items-center justify-center gap-2`}
          >
            <FolderOpen className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} />
            Browse Archive
          </button>
        </div>

        {/* Collapsible Guidance */}
        <button
          onClick={() => setShowGuidance(!showGuidance)}
          className={`w-full flex items-center justify-between ${isMobile ? 'p-3 min-h-[48px]' : 'p-2'} hover:bg-[#0A0A0A] rounded text-left transition-colors`}
        >
          <div className={`flex items-center gap-2 ${isMobile ? 'text-sm' : 'text-xs'} text-[#808080]`}>
            <Info className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} />
            <span>Location Guidance (Click to expand)</span>
          </div>
          {showGuidance ? (
            <ChevronUp className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-[#808080]`} />
          ) : (
            <ChevronDown className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-[#808080]`} />
          )}
        </button>
        
        {showGuidance && (
          <div className="mt-2">
            <LocationGuidanceSection
              existingCount={existingReferences.length}
              viewName={finalViewName || undefined}
            />
          </div>
        )}

        {/* Archive Browser */}
        {showMediaLibrary && (
          <div className="mt-3">
            <MediaLibraryBrowser
              screenplayId={screenplayId}
              onSelectImages={handleSelectFromMediaLibrary}
              filterTypes={['image']}
              allowMultiSelect={true}
              maxSelections={10}
              selectedFolderPath={['Locations', locationName]}
              onCancel={() => setShowMediaLibrary(false)}
            />
          </div>
        )}

        {/* Upload Progress */}
        {uploadingImages.length > 0 && (
          <div className="mt-3 space-y-2">
            {uploadingImages.map((img, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-[#0A0A0A] rounded">
                <img src={img.preview} alt={img.file.name} className="w-12 h-12 object-cover rounded" />
                <div className="flex-1">
                  <p className="text-xs text-white truncate">{img.file.name}</p>
                  {img.error ? (
                    <p className="text-xs text-[#DC143C] mt-0.5">{img.error}</p>
                  ) : (
                    <div className="w-full bg-[#3F3F46] rounded-full h-1.5 mt-1">
                      <div
                        className="bg-[#DC143C] h-1.5 rounded-full transition-all"
                        style={{ width: `${img.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                {img.progress === 100 && (
                  <Check className="w-4 h-4 text-green-400" />
                )}
                {img.error && (
                  <AlertCircle className="w-4 h-4 text-[#DC143C]" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
