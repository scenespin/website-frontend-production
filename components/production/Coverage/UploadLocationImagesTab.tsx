'use client';

/**
 * UploadLocationImagesTab - Upload Images tab for Location Detail Modal
 * 
 * Feature 0192: Location/Asset Upload Tab
 * 
 * Features:
 * - Choose destination: Angles OR Backgrounds
 * - Create new view/background OR select existing
 * - Upload new images OR browse Archive
 * - Location guidance system
 * - Progress tracking
 */

import React, { useState, useMemo, useRef } from 'react';
import { Upload, FolderOpen, Check, AlertCircle, ChevronDown, ChevronUp, Info, Camera, Layers } from 'lucide-react';
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

interface LocationBackground {
  id?: string;
  s3Key?: string;
  imageUrl?: string;
  backgroundType?: string;
}

interface UploadLocationImagesTabProps {
  locationId: string;
  locationName: string;
  screenplayId: string;
  existingReferences?: LocationReference[];
  existingBackgrounds?: LocationBackground[];
  onComplete: (result: { viewName: string; images: string[]; category: 'angles' | 'backgrounds' }) => void;
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
  existingBackgrounds = [],
  onComplete
}: UploadLocationImagesTabProps) {
  const { getToken } = useAuth();
  const isMobile = useIsMobile();
  
  // Step 1: Category selection
  const [category, setCategory] = useState<'angles' | 'backgrounds'>('angles');
  
  // Step 2: Create or select name
  const [nameMode, setNameMode] = useState<'create' | 'existing'>('create');
  const [newName, setNewName] = useState<string>('');
  const [selectedExisting, setSelectedExisting] = useState<string>('');
  
  // Upload state
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract existing names based on category
  const existingNames = useMemo(() => {
    const names = new Set<string>();
    if (category === 'angles') {
      existingReferences.forEach(ref => {
        const name = ref.metadata?.viewName || 'default';
        if (name !== 'default') {
          names.add(name);
        }
      });
    } else {
      existingBackgrounds.forEach(bg => {
        const name = bg.backgroundType || 'default';
        if (name !== 'default') {
          names.add(name);
        }
      });
    }
    return Array.from(names).sort();
  }, [category, existingReferences, existingBackgrounds]);

  // Get final name
  const finalName = useMemo(() => {
    if (nameMode === 'create') {
      return newName.trim() || null;
    } else {
      return selectedExisting || null;
    }
  }, [nameMode, newName, selectedExisting]);
  
  // Check if name is valid
  const isNameValid = useMemo(() => {
    if (nameMode === 'create') {
      return newName.trim().length > 0;
    } else {
      return selectedExisting.length > 0;
    }
  }, [nameMode, newName, selectedExisting]);

  // Reset name when category changes
  const handleCategoryChange = (newCategory: 'angles' | 'backgrounds') => {
    setCategory(newCategory);
    setNewName('');
    setSelectedExisting('');
    setNameMode('create');
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    if (!isNameValid) {
      toast.error(`Please create or select a ${category === 'angles' ? 'view' : 'background'} name first (Step 2)`);
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
    if (!isNameValid || !finalName) {
      toast.error(`Please create or select a ${category === 'angles' ? 'view' : 'background'} name first (Step 2)`);
      return;
    }
    
    setIsProcessing(true);
    const uploadedS3Keys: string[] = [];
    const nameToUse = finalName;

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
            `/api/screenplays/${screenplayId}/locations/${locationId}/references`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                s3Key: s3Key,
                viewName: nameToUse,
                source: 'user-upload',
                label: file.name,
                category: category, // angles or backgrounds
                metadata: {
                  viewName: nameToUse,
                  category: category,
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
        const categoryLabel = category === 'angles' ? 'Location Angles' : 'Location Backgrounds';
        toast.success(`Successfully uploaded ${uploadedS3Keys.length} image(s) to ${categoryLabel}: ${nameToUse}`);
        onComplete({ viewName: nameToUse, images: uploadedS3Keys, category });
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
    if (!isNameValid || !finalName) {
      toast.error(`Please create or select a ${category === 'angles' ? 'view' : 'background'} name first (Step 2)`);
      return;
    }
    
    // Feature 0205: Check for duplicates before processing
    const existingArray = category === 'angles' ? existingReferences : existingBackgrounds;
    const existingS3Keys = new Set(
      (existingArray || [])
        .map(ref => ref.s3Key)
        .filter((key): key is string => !!key)
    );
    
    const duplicates = images.filter(img => existingS3Keys.has(img.s3Key));
    const newImages = images.filter(img => !existingS3Keys.has(img.s3Key));
    
    // Block if all duplicates
    if (duplicates.length > 0 && newImages.length === 0) {
      const message = duplicates.length === 1
        ? 'This image is already added'
        : 'All selected images are already added';
      toast.error(message);
      return;
    }
    
    // Warn if some duplicates
    if (duplicates.length > 0) {
      toast.warning(`${duplicates.length} already added, adding ${newImages.length} new`);
    }
    
    setIsProcessing(true);
    const nameToUse = finalName;

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const uploadedS3Keys: string[] = [];

      for (const file of newImages) {
        try {
          const response = await fetch(
            `/api/screenplays/${screenplayId}/locations/${locationId}/references`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                s3Key: file.s3Key,
                viewName: nameToUse,
                source: 'user-upload',
                label: file.fileName,
                category: category,
                metadata: {
                  viewName: nameToUse,
                  category: category,
                  fileName: file.fileName,
                  fileSize: file.fileSize,
                  fromMediaLibrary: true,
                  mediaLibraryFileId: file.id
                }
              })
            }
          );

          if (!response.ok) {
            // Feature 0205: Handle 409 (duplicate) as silent skip
            if (response.status === 409) {
              console.log(`Skipped duplicate: ${file.fileName}`);
              continue;
            }
            
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
        const categoryLabel = category === 'angles' ? 'Location Angles' : 'Location Backgrounds';
        toast.success(`Added ${uploadedS3Keys.length} image(s) from Archive to ${categoryLabel}: ${nameToUse}`);
        onComplete({ viewName: nameToUse, images: uploadedS3Keys, category });
      }

    } catch (error: any) {
      console.error('Failed to add images from Archive:', error);
      toast.error(error.message || 'Failed to add images from Archive');
    } finally {
      setIsProcessing(false);
    }
  };

  // Dynamic labels based on category
  const categoryLabels = {
    angles: {
      name: 'View',
      placeholder: 'Enter view name (e.g., Wide Shot, Entrance, Detail)',
      examples: 'Wide Shot, Entrance, Window View, Corner',
    },
    backgrounds: {
      name: 'Background',
      placeholder: 'Enter background name (e.g., Wall Texture, Floor, Ceiling)',
      examples: 'Wall Texture, Floor Detail, Ceiling, Window',
    }
  };

  const labels = categoryLabels[category];

  return (
    <div className={`${isMobile ? 'p-3' : 'p-6'} space-y-4`}>
      {/* Step 1: Choose Destination */}
      <div className={`bg-[#1F1F1F] border border-[#3F3F46] rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
        <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-white mb-3`}>Step 1: Choose Destination</h3>
        
        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'gap-4'}`}>
          <label 
            className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-colors ${
              category === 'angles' 
                ? 'bg-[#DC143C]/10 border-[#DC143C]' 
                : 'bg-[#0A0A0A] border-[#3F3F46] hover:border-[#808080]'
            }`}
          >
            <input
              type="radio"
              name="category"
              checked={category === 'angles'}
              onChange={() => handleCategoryChange('angles')}
              className="sr-only"
            />
            <Camera className={`w-5 h-5 ${category === 'angles' ? 'text-[#DC143C]' : 'text-[#808080]'}`} />
            <div>
              <span className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium ${category === 'angles' ? 'text-white' : 'text-[#808080]'}`}>
                Location Angles
              </span>
              <p className="text-xs text-[#808080]">Camera perspectives of the location</p>
            </div>
            {category === 'angles' && (
              <span className="ml-auto text-[#DC143C]">●</span>
            )}
          </label>
          
          <label 
            className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-colors ${
              category === 'backgrounds' 
                ? 'bg-[#DC143C]/10 border-[#DC143C]' 
                : 'bg-[#0A0A0A] border-[#3F3F46] hover:border-[#808080]'
            }`}
          >
            <input
              type="radio"
              name="category"
              checked={category === 'backgrounds'}
              onChange={() => handleCategoryChange('backgrounds')}
              className="sr-only"
            />
            <Layers className={`w-5 h-5 ${category === 'backgrounds' ? 'text-[#DC143C]' : 'text-[#808080]'}`} />
            <div>
              <span className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium ${category === 'backgrounds' ? 'text-white' : 'text-[#808080]'}`}>
                Location Backgrounds
              </span>
              <p className="text-xs text-[#808080]">Close-up areas, surfaces, details</p>
            </div>
            {category === 'backgrounds' && (
              <span className="ml-auto text-[#DC143C]">●</span>
            )}
          </label>
        </div>
      </div>

      {/* Step 2: Create or Select Name */}
      <div className={`bg-[#1F1F1F] border border-[#3F3F46] rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
        <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-white mb-3`}>Step 2: Create or Select {labels.name}</h3>
        
        <div className="space-y-3">
          {/* Mode Selection */}
          <div className={`flex ${isMobile ? 'flex-col gap-3' : 'gap-4'}`}>
            <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
              <input
                type="radio"
                name="nameMode"
                checked={nameMode === 'create'}
                onChange={() => setNameMode('create')}
                className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-[#DC143C] focus:ring-[#DC143C] focus:ring-2`}
              />
              <span className={`${isMobile ? 'text-base' : 'text-sm'} text-white`}>Create New {labels.name}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
              <input
                type="radio"
                name="nameMode"
                checked={nameMode === 'existing'}
                onChange={() => setNameMode('existing')}
                className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-[#DC143C] focus:ring-[#DC143C] focus:ring-2`}
              />
              <span className={`${isMobile ? 'text-base' : 'text-sm'} text-white`}>Add to Existing {labels.name}</span>
            </label>
          </div>

          {/* Create New */}
          {nameMode === 'create' && (
            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2'}`}>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={labels.placeholder}
                className={`flex-1 ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-1.5 text-sm'} bg-[#0A0A0A] border border-[#3F3F46] rounded text-white placeholder-[#808080] focus:outline-none focus:ring-1 focus:ring-[#DC143C]`}
              />
              <button
                onClick={() => {
                  if (!newName.trim()) {
                    toast.error(`Please enter a ${labels.name.toLowerCase()} name`);
                    return;
                  }
                  toast.success(`${labels.name} "${newName.trim()}" is ready for images`);
                }}
                disabled={!newName.trim()}
                className={`${isMobile ? 'w-full px-4 py-3 text-base min-h-[48px]' : 'px-3 py-1.5 text-sm'} bg-[#DC143C] hover:bg-[#DC143C]/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors font-medium`}
              >
                Create
              </button>
            </div>
          )}

          {/* Select Existing */}
          {nameMode === 'existing' && (
            <div>
              {existingNames.length > 0 ? (
                <select
                  value={selectedExisting || '__select__'}
                  onChange={(e) => setSelectedExisting(e.target.value === '__select__' ? '' : e.target.value)}
                  className={`select select-bordered w-full ${isMobile ? 'h-12 text-base' : 'h-9 text-sm'} bg-[#0A0A0A] border-[#3F3F46] text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]`}
                >
                  <option value="__select__" className="bg-[#1A1A1A] text-[#FFFFFF]">Select a {labels.name.toLowerCase()}...</option>
                  {existingNames.map(name => (
                    <option key={name} value={name} className="bg-[#1A1A1A] text-[#FFFFFF]">{name}</option>
                  ))}
                </select>
              ) : (
                <div className={`${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-1.5 text-sm'} bg-[#0A0A0A] border border-[#3F3F46] rounded text-[#808080]`}>
                  No existing {labels.name.toLowerCase()}s. Create a new one instead.
                </div>
              )}
            </div>
          )}

          {/* Examples hint */}
          <p className="text-xs text-[#808080]">
            Examples: {labels.examples}
          </p>
        </div>
      </div>

      {/* Step 3: Add Images */}
      <div className={`bg-[#1F1F1F] border border-[#3F3F46] rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
        <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-white mb-3`}>Step 3: Add Images</h3>
        
        {/* Action Buttons */}
        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2'} mb-3`}>
          <button
            onClick={() => {
              if (!isNameValid) {
                toast.error(`Please create or select a ${labels.name.toLowerCase()} name first (Step 2)`);
                return;
              }
              fileInputRef.current?.click();
            }}
            disabled={isProcessing || !isNameValid}
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
              if (!isNameValid) {
                toast.error(`Please create or select a ${labels.name.toLowerCase()} name first (Step 2)`);
                return;
              }
              setShowMediaLibrary(!showMediaLibrary);
            }}
            disabled={isProcessing || !isNameValid}
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
            <span>{category === 'angles' ? 'Location' : 'Background'} Guidance (Click to expand)</span>
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
              existingCount={category === 'angles' ? existingReferences.length : existingBackgrounds.length}
              viewName={finalName || undefined}
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
