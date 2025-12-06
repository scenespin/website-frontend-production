'use client';

/**
 * Asset Detail Modal - Full-screen asset detail view
 * 
 * Features:
 * - Image gallery (main + references with thumbnail grid)
 * - 3D image button/display
 * - Description and info
 * - Uploaded images management
 * - Three tabs: Gallery, Info, References
 * - Full-screen modal with cinema theme
 * 
 * Consistent with CharacterDetailModal and LocationDetailModal
 */

import { useState, useEffect } from 'react';
import React from 'react';
import { useAuth } from '@clerk/nextjs';
import { X, Edit2, Save, Trash2, Image as ImageIcon, Sparkles, Package, Car, Armchair, Box, Upload, FileText, MoreVertical, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Asset, AssetCategory, ASSET_CATEGORY_METADATA } from '@/types/asset';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import AssetAngleGenerationModal from './AssetAngleGenerationModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset;
  onUpdate: () => void;
  onDelete?: () => void; // 🔥 Made optional - delete removed from Production Hub
  onGenerate3D: (asset: Asset) => void;
  isMobile?: boolean;
  onAssetUpdate?: (updatedAsset: Asset) => void; // 🔥 NEW: Callback to update asset in parent
}

export default function AssetDetailModal({ 
  isOpen, 
  onClose, 
  asset, 
  onUpdate, 
  onDelete,
  onGenerate3D,
  isMobile = false,
  onAssetUpdate
}: AssetDetailModalProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient(); // 🔥 NEW: For invalidating Media Library cache
  const { assets: contextAssets } = useScreenplay(); // 🔥 FIX: Get assets from ScreenplayContext for angle images
  // 🔥 ONE-WAY SYNC: Removed ScreenplayContext sync - Production Hub changes stay in Production Hub
  // 🔥 FIX: Use screenplayId (primary) with projectId fallback for backward compatibility
  const screenplayId = asset?.screenplayId || asset?.projectId;
  const [activeTab, setActiveTab] = useState<'gallery' | 'info' | 'references'>('gallery');
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(asset.name);
  const [description, setDescription] = useState(asset.description || '');
  const [category, setCategory] = useState<AssetCategory>(asset.category);
  const [tags, setTags] = useState(asset.tags.join(', '));
  const [saving, setSaving] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showAngleModal, setShowAngleModal] = useState(false);
  const [isGeneratingAngles, setIsGeneratingAngles] = useState(false);

  // 🔥 FIX: Sync local state when asset prop changes (e.g., after deletion refresh)
  useEffect(() => {
    setName(asset.name);
    setDescription(asset.description || '');
    setCategory(asset.category);
    setTags(asset.tags.join(', '));
  }, [asset.id, asset.name, asset.description, asset.category, asset.tags]);

  const categoryMeta = ASSET_CATEGORY_METADATA[category];
  const assetImages = asset.images || []; // Safety check for undefined images
  
  // 🔥 FIX: Get angle images from ScreenplayContext (same pattern as locations)
  // First try from asset prop, then from context
  // 🔥 CRITICAL: Try multiple ID matching strategies (asset.id might be different)
  const contextAsset = contextAssets?.find(a => 
    a.id === asset.id || 
    a.name === asset.name
  );
  
  // 🔥 DEBUG: Log context asset matching
  React.useEffect(() => {
    if (isOpen) {
      console.log('[AssetDetailModal] 🔍 Context asset search:', {
        assetId: asset.id,
        assetName: asset.name,
        allAssetIds: contextAssets?.map(a => ({ id: a.id, name: a.name })),
        contextAssetFound: !!contextAsset,
        contextAssetId: contextAsset?.id,
        contextAssetName: contextAsset?.name,
        contextAssetImagesCount: contextAsset?.images?.length || 0,
        contextAssetImages: contextAsset?.images?.map((img: any) => ({
          hasMetadata: !!img.metadata,
          source: img.metadata?.source,
          angle: img.metadata?.angle,
          s3Key: img.s3Key || img.metadata?.s3Key
        })) || []
      });
    }
  }, [isOpen, asset.id, asset.name, contextAsset?.id, contextAsset?.images?.length]);
  
  const contextAngleImages = (contextAsset?.images || []).filter((img: any) => 
    (img.metadata as any)?.source === 'angle-generation' || (img.metadata as any)?.source === 'image-generation'
  );
  
  const canExport3D = assetImages.length >= 2 && assetImages.length <= 10;
  const canGenerateAngles = assetImages.length >= 1; // Need at least 1 image for angle generation
  
  // 🔥 FIX: Separate Creation images from Production Hub angles (same pattern as characters/locations)
  // Creation images: source='user-upload' OR no source
  // Production Hub images: source='angle-generation' or 'image-generation' (AI-generated angles)
  const creationImages = assetImages.filter((img: any) => {
    const source = img.metadata?.source;
    return !source || source === 'user-upload';
  });
  
  let angleImages = assetImages.filter((img: any) => {
    const source = img.metadata?.source;
    return source === 'angle-generation' || source === 'image-generation'; // Match location pattern
  });
  
  // 🔥 FIX: Also add angle images from context (from API with production-hub context)
  contextAngleImages.forEach((img: any, idx: number) => {
    // Check if already in angleImages to avoid duplicates
    const alreadyAdded = angleImages.some((existingImg: any) => 
      (existingImg.s3Key === img.s3Key || existingImg.s3Key === img.metadata?.s3Key) ||
      (img.s3Key === existingImg.s3Key || img.metadata?.s3Key === existingImg.s3Key) ||
      (existingImg.metadata?.s3Key === img.s3Key || existingImg.metadata?.s3Key === img.metadata?.s3Key)
    );
    
    if (!alreadyAdded) {
      angleImages.push({
        url: img.imageUrl || img.url || '',
        s3Key: img.s3Key || img.metadata?.s3Key || '',
        uploadedAt: img.createdAt || img.uploadedAt || new Date().toISOString(),
        metadata: {
          ...img.metadata,
          source: img.metadata?.source || 'angle-generation',
          angle: img.metadata?.angle || 'front',
          creditsUsed: img.metadata?.creditsUsed || 0
        }
      });
    }
  });
  
  // Convert Creation images to gallery format
  const userImages = creationImages.map((img, idx) => ({
    id: `img-${idx}`,
    imageUrl: img.url,
    label: `${asset.name} - Image ${idx + 1}`,
    isBase: idx === 0,
    s3Key: img.s3Key || img.metadata?.s3Key,
    isAngleReference: false,
    metadata: img.metadata
  }));
  
  // Convert Production Hub angle images to gallery format
  const angleImageObjects = angleImages.map((img, idx) => ({
    id: `angle-${idx}`,
    imageUrl: img.url,
    label: `${asset.name} - ${img.metadata?.angle || img.angle || 'Angle'} view`,
    isBase: false,
    s3Key: img.s3Key || img.metadata?.s3Key,
    isAngleReference: true,
    angle: img.metadata?.angle || img.angle,
    metadata: img.metadata
  }));
  
  // 🔥 DEBUG: Log asset images for troubleshooting
  useEffect(() => {
    if (isOpen) {
      console.log('[AssetDetailModal] Asset images:', {
        assetId: asset.id,
        assetName: asset.name,
        totalImagesCount: assetImages.length,
        creationImagesCount: creationImages.length,
        angleImagesCount: angleImages.length,
        contextAngleImagesCount: contextAngleImages.length,
        angleImageObjectsCount: angleImageObjects.length,
        contextAssetFound: !!contextAsset,
        contextAssetImages: contextAsset?.images?.map((img: any) => ({
          source: img.metadata?.source,
          angle: img.metadata?.angle,
          s3Key: img.s3Key || img.metadata?.s3Key
        })) || [],
        creationImages: creationImages.map((img: any, idx: number) => ({
          index: idx,
          url: img.url ? `${img.url.substring(0, 50)}...` : 'MISSING',
          s3Key: img.s3Key || img.metadata?.s3Key || 'MISSING',
          source: img.metadata?.source || 'user-upload',
          hasUrl: !!img.url
        })),
        angleImages: angleImages.map((img: any, idx: number) => ({
          index: idx,
          url: img.url ? `${img.url.substring(0, 50)}...` : 'MISSING',
          s3Key: img.s3Key || img.metadata?.s3Key || 'MISSING',
          source: img.metadata?.source,
          angle: img.metadata?.angle || img.angle,
          hasUrl: !!img.url
        })),
        userImagesCount: userImages.length,
        angleImageObjectsCount: angleImageObjects.length,
        canGenerateAngles,
        canExport3D
      });
    }
  }, [isOpen, asset.id, assetImages.length, creationImages.length, angleImages.length]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        toast.error('Authentication required. Please sign in.');
        setIsUploading(false);
        return;
      }

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (assetImages.length >= 10) {
          toast.error('Maximum 10 images per asset');
          break;
        }

        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`/api/asset-bank/${asset.id}/images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to upload image');
        }
      }

      toast.success(`Successfully uploaded ${files.length} image${files.length > 1 ? 's' : ''}`);
      
      // 🔥 NEW: Invalidate Media Library cache so new image appears
      if (screenplayId) {
        queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
      }
      
      // 🔥 ONE-WAY SYNC: Do NOT update ScreenplayContext - Production Hub changes stay in Production Hub
      // Production Hub image uploads should NOT sync back to Creation section
      
      onUpdate(); // Refresh asset data
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      // Reset input
      if (e.target) e.target.value = '';
    }
  };
  
  // Combined for main display (all images)
  const allImages = [...userImages, ...angleImageObjects];

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        toast.error('Authentication required. Please sign in.');
        setSaving(false);
        return;
      }

      const response = await fetch(`/api/asset-bank/${asset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          category,
          description: description.trim() || undefined,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        }),
      });

      if (response.ok) {
        setEditing(false);
        onUpdate();
        toast.success('Asset updated successfully');
      } else {
        throw new Error('Failed to update asset');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update asset');
    } finally {
      setSaving(false);
    }
  };

  // 🔥 REMOVED: handleDelete function - assets should only be deleted from Create page

  const handleCancel = () => {
    setName(asset.name);
    setDescription(asset.description || '');
    setCategory(asset.category);
    setTags(asset.tags.join(', '));
    setEditing(false);
  };

  if (!isOpen) return null;

  const getCategoryIcon = () => {
    const icons = { prop: Package, vehicle: Car, furniture: Armchair, other: Box };
    const Icon = icons[category];
    return <Icon className="w-6 h-6" />;
  };

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0A0A0A]/95 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-8 lg:inset-12 bg-[#0A0A0A] border border-[#3F3F46] rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-[#3F3F46] flex items-center justify-between bg-[#141414]">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-[#DC143C]/10 rounded-lg">
                  {getCategoryIcon()}
                </div>
                <div className="flex-1">
                  {editing ? (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-xl font-bold bg-[#1F1F1F] border border-[#3F3F46] rounded px-3 py-2 text-[#FFFFFF] w-full focus:border-[#DC143C] focus:outline-none"
                      maxLength={100}
                    />
                  ) : (
                    <h2 className="text-xl font-bold text-[#FFFFFF]">{asset.name}</h2>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-[#808080]">{categoryMeta.label}</span>
                    {asset.has3DModel && (
                      <span className="px-2 py-0.5 bg-[#DC143C]/20 text-[#DC143C] text-xs rounded-lg font-medium">
                        3D Model Available
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!editing && !isMobile && (
                  <>
                    <button
                      onClick={() => setEditing(true)}
                      className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors text-[#808080] hover:text-[#FFFFFF]"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    {/* 🔥 REMOVED: Delete button - assets should only be deleted from Create page */}
                  </>
                )}
                {editing && !isMobile && (
                  <>
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1.5 bg-[#1F1F1F] text-[#808080] border border-[#3F3F46] rounded-lg hover:bg-[#2A2A2A] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving || !name.trim()}
                      className="px-3 py-1.5 bg-[#DC143C] text-white rounded-lg hover:bg-[#B91238] transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors text-[#808080] hover:text-[#FFFFFF]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex-shrink-0 px-6 py-3 border-b border-[#3F3F46] bg-[#141414] flex gap-2">
              <button
                onClick={() => setActiveTab('gallery')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'gallery'
                    ? 'bg-[#DC143C] text-white'
                    : 'bg-[#1F1F1F] text-[#808080] hover:bg-[#2A2A2A] hover:text-[#FFFFFF]'
                }`}
              >
                <ImageIcon className="w-4 h-4 inline mr-2" />
                Gallery
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'info'
                    ? 'bg-[#DC143C] text-white'
                    : 'bg-[#1F1F1F] text-[#808080] hover:bg-[#2A2A2A] hover:text-[#FFFFFF]'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Info
              </button>
              <button
                onClick={() => setActiveTab('references')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'references'
                    ? 'bg-[#DC143C] text-white'
                    : 'bg-[#1F1F1F] text-[#808080] hover:bg-[#2A2A2A] hover:text-[#FFFFFF]'
                }`}
              >
                <Box className="w-4 h-4 inline mr-2" />
                References ({assetImages.length})
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-[#0A0A0A]">
              {activeTab === 'gallery' && (
                <div className="p-6">
                  {/* Main Image Display */}
                  {allImages.length > 0 ? (
                    <div className="mb-6">
                      <div className="relative aspect-video bg-[#1F1F1F] rounded-lg overflow-hidden border border-[#3F3F46] mb-4">
                        <img
                          src={allImages[selectedImageIndex]?.imageUrl}
                          alt={allImages[selectedImageIndex]?.label}
                          className="w-full h-full object-contain"
                        />
                        {allImages[selectedImageIndex]?.isBase && (
                          <div className="absolute top-4 left-4 px-3 py-1 bg-[#DC143C]/20 text-[#DC143C] rounded-full text-xs font-medium">
                            Base Reference
                          </div>
                        )}
                      </div>
                      
                      {/* Thumbnail Grid */}
                      {allImages.length > 1 && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                          {allImages.map((img, idx) => (
                            <button
                              key={img.id}
                              onClick={() => setSelectedImageIndex(idx)}
                              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                selectedImageIndex === idx
                                  ? 'border-[#DC143C] ring-2 ring-[#DC143C]/20'
                                  : 'border-[#3F3F46] hover:border-[#DC143C]/50'
                              }`}
                            >
                              <img
                                src={img.imageUrl}
                                alt={img.label}
                                className="w-full h-full object-cover"
                              />
                              {img.isBase && (
                                <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-[#DC143C] text-white text-[10px] rounded">
                                  Base
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Box className="w-16 h-16 text-[#808080] mb-4" />
                      <p className="text-[#808080] mb-4">No images yet</p>
                      <p className="text-sm text-[#808080] mb-4">Upload 2-10 images for 3D generation</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <label className={`px-4 py-2 bg-[#141414] border border-[#3F3F46] hover:bg-[#1F1F1F] hover:border-[#DC143C] text-[#FFFFFF] rounded-lg cursor-pointer transition-colors inline-flex items-center gap-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <Upload className="w-4 h-4" />
                      {isUploading ? 'Uploading...' : assetImages.length >= 10 ? 'Max Images (10/10)' : `Upload Image (${assetImages.length}/10)`}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        multiple
                        onChange={handleFileUpload}
                        disabled={isUploading || assetImages.length >= 10}
                      />
                    </label>
                    
                    {/* Generate Angle Package Button */}
                    {canGenerateAngles && (
                      <button
                        onClick={() => setShowAngleModal(true)}
                        disabled={isGeneratingAngles}
                        className="px-4 py-2 bg-[#141414] border border-[#3F3F46] hover:bg-[#1F1F1F] hover:border-[#DC143C] text-[#FFFFFF] rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Sparkles className="w-4 h-4" />
                        {isGeneratingAngles ? 'Generating...' : 'Generate Angle Package'}
                      </button>
                    )}
                    
                    {!canGenerateAngles && (
                      <div className="px-4 py-2 bg-[#DC143C]/10 border border-[#DC143C]/30 rounded-lg text-sm text-[#808080]">
                        ⚠️ Upload at least 1 image to generate angle package
                      </div>
                    )}
                    
                    {canExport3D && !asset.has3DModel && (
                      <div className="space-y-2">
                        <button
                          onClick={() => onGenerate3D(asset)}
                          className="px-4 py-2 bg-[#DC143C] hover:bg-[#B91238] text-white rounded-lg transition-colors inline-flex items-center gap-2 w-full justify-center"
                          title="Required: Generate 3D model to render multiple angles for consistent prop appearance in scenes"
                        >
                          <Sparkles className="w-4 h-4" />
                          Generate 3D Model for Scene Generation ({categoryMeta.priceUSD})
                        </button>
                        <p className="text-xs text-center" style={{ color: '#9CA3AF' }}>
                          3D export required for scene generation. The model will be used to render reference images at different angles.
                        </p>
                      </div>
                    )}
                    
                    {!canExport3D && (
                      <div className="px-4 py-2 bg-[#DC143C]/10 border border-[#DC143C]/30 rounded-lg text-sm text-[#808080]">
                        ⚠️ Need {2 - assetImages.length} more image{(2 - assetImages.length) !== 1 ? 's' : ''} for 3D export
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'info' && (
                <div className="p-6 space-y-6">
                  {/* Asset Info */}
                  <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#FFFFFF] mb-4">Asset Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Name</label>
                        {editing ? (
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-[#FFFFFF] focus:border-[#DC143C] focus:outline-none"
                            maxLength={100}
                          />
                        ) : (
                          <p className="text-[#FFFFFF]">{asset.name}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Category</label>
                        {editing ? (
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(ASSET_CATEGORY_METADATA).map(([key, meta]) => (
                              <button
                                key={key}
                                onClick={() => setCategory(key as AssetCategory)}
                                className={`p-3 rounded-lg border-2 text-sm transition-all ${
                                  category === key
                                    ? 'border-[#DC143C] bg-[#DC143C]/10'
                                    : 'border-[#3F3F46] bg-[#1F1F1F] hover:border-[#DC143C]/50'
                                }`}
                              >
                                <div className="font-medium text-[#FFFFFF]">{meta.label}</div>
                                <div className="text-xs text-[#808080] mt-1">{meta.priceUSD}</div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[#FFFFFF]">{categoryMeta.label}</p>
                        )}
                      </div>
                      {description !== undefined && (
                        <div>
                          <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Description</label>
                          {editing ? (
                            <textarea
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              className="w-full px-4 py-3 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-[#FFFFFF] placeholder-[#808080] focus:border-[#DC143C] focus:outline-none resize-none"
                              rows={4}
                              maxLength={500}
                              placeholder="Describe the asset..."
                            />
                          ) : (
                            <p className="text-[#808080]">{asset.description || <span className="italic">No description</span>}</p>
                          )}
                        </div>
                      )}
                      {tags !== undefined && (
                        <div>
                          <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Tags</label>
                          {editing ? (
                            <input
                              type="text"
                              value={tags}
                              onChange={(e) => setTags(e.target.value)}
                              className="w-full px-4 py-2 bg-[#1F1F1F] border border-[#3F3F46] rounded-lg text-[#FFFFFF] placeholder-[#808080] focus:border-[#DC143C] focus:outline-none"
                              placeholder="weapon, gun, silver"
                            />
                          ) : asset.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {asset.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-[#1F1F1F] text-[#808080] text-sm rounded-lg border border-[#3F3F46]"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[#808080] italic">No tags</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#FFFFFF] mb-4">Metadata</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#808080]">Created:</span>
                        <span className="text-[#FFFFFF]">{new Date(asset.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#808080]">Last Updated:</span>
                        <span className="text-[#FFFFFF]">{new Date(asset.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#808080]">3D Export Cost:</span>
                        <span className="text-[#FFFFFF]">{categoryMeta.priceUSD} ({categoryMeta.credits} credits)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'references' && (
                <div className="p-6 space-y-6">
                  {/* 🔥 SEPARATION: Production Hub Images - Angle References (Editable/Deletable) */}
                  {angleImageObjects.length > 0 && (
                    <div className="p-4 bg-[#1A0F2E] rounded-lg border border-[#8B5CF6]/30">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#8B5CF6]/20">
                        <div>
                          <h3 className="text-sm font-semibold text-[#8B5CF6] mb-1">
                            Production Hub Images ({angleImageObjects.length})
                          </h3>
                          <p className="text-xs text-[#6B7280]">AI-generated angle variations - can be edited/deleted here</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {angleImageObjects.map((img) => {
                          // All angleImages are Production Hub images (editable/deletable)
                          return (
                            <div
                              key={img.id}
                              className="relative group aspect-square bg-[#141414] border border-[#3F3F46] rounded-lg overflow-hidden hover:border-[#DC143C] transition-colors"
                            >
                              <img
                                src={img.imageUrl}
                                alt={img.label}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="absolute bottom-2 left-2 right-2">
                                  <p className="text-xs text-[#FFFFFF] truncate">{img.label}</p>
                                </div>
                                {/* Delete button - all Production Hub images can be deleted */}
                                {!img.isBase && (
                              <div className="absolute top-2 right-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      className="p-1.5 bg-[#DC143C]/80 hover:bg-[#DC143C] rounded-lg transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreVertical className="w-3 h-3 text-white" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (!confirm('Delete this angle image? This action cannot be undone.')) {
                                          return;
                                        }
                                        
                                        try {
                                          if (!img.s3Key) {
                                            throw new Error('Missing S3 key for image');
                                          }
                                          
                                          const token = await getToken({ template: 'wryda-backend' });
                                          if (!token) {
                                            toast.error('Authentication required');
                                            return;
                                          }
                                          
                                          // 🔥 FIX: Remove from images array (both Creation and Production Hub images are in images array now)
                                          // Filter by s3Key to remove the deleted image
                                          const updatedImages = assetImages.filter((assetImg: any) => {
                                            const imgS3Key = assetImg.s3Key || assetImg.metadata?.s3Key;
                                            return imgS3Key !== img.s3Key;
                                          });
                                          
                                          // Also update angleReferences if it's an angle reference (for backward compatibility)
                                          let updatedAngleReferences = asset.angleReferences || [];
                                          if (img.isAngleReference) {
                                            updatedAngleReferences = updatedAngleReferences.filter(
                                              (ref: any) => ref.s3Key !== img.s3Key
                                            );
                                          }
                                          
                                          // Update asset via API
                                          const response = await fetch(`/api/asset-bank/${asset.id}`, {
                                            method: 'PUT',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              'Authorization': `Bearer ${token}`,
                                            },
                                            body: JSON.stringify({
                                              images: updatedImages,
                                              angleReferences: updatedAngleReferences // Update for backward compatibility
                                            }),
                                          });
                                          
                                          if (!response.ok) {
                                            throw new Error('Failed to delete image');
                                          }
                                          
                                          // 🔥 ONE-WAY SYNC: Do NOT update ScreenplayContext - Production Hub changes stay in Production Hub
                                          // Production Hub images (createdIn: 'production-hub') should NOT sync back to Creation section
                                          
                                          queryClient.invalidateQueries({ queryKey: ['media', 'files', screenplayId] });
                                          
                                          // 🔥 FIX: Fetch fresh asset data after deletion to ensure UI reflects backend state
                                          try {
                                            const refreshResponse = await fetch(`/api/asset-bank/${asset.id}`, {
                                              headers: {
                                                'Authorization': `Bearer ${token}`,
                                              },
                                            });
                                            if (refreshResponse.ok) {
                                              const refreshData = await refreshResponse.json();
                                              if (refreshData.asset && onAssetUpdate) {
                                                onAssetUpdate(refreshData.asset);
                                              }
                                            }
                                          } catch (refreshError) {
                                            console.error('[AssetDetailModal] Failed to refresh asset after deletion:', refreshError);
                                          }
                                          
                                          onUpdate(); // Refresh asset list in parent
                                          toast.success('Image deleted');
                                        } catch (error: any) {
                                          console.error('[AssetDetailModal] Failed to delete image:', error);
                                          toast.error(`Failed to delete image: ${error.message}`);
                                        }
                                      }}
                                      className="text-red-500"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* 🔥 SEPARATION: Creation Section Images - User Uploaded (Read-Only) */}
                  {userImages.length > 0 && (
                    <div className="p-4 bg-[#0F0F0F] rounded-lg border border-[#3F3F46]">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#3F3F46]">
                        <div>
                          <h3 className="text-sm font-semibold text-white mb-1">
                            Reference Images from Creation ({userImages.length})
                          </h3>
                          <p className="text-xs text-[#6B7280]">Uploaded in Creation section - view only (delete in Creation section)</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {userImages.map((img) => {
                          return (
                            <div
                              key={img.id}
                              className="relative group aspect-square bg-[#141414] border border-[#3F3F46] rounded-lg overflow-hidden opacity-75"
                            >
                              <img
                                src={img.imageUrl}
                                alt={img.label}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="absolute bottom-2 left-2 right-2">
                                  <p className="text-xs text-[#FFFFFF] truncate">{img.label}</p>
                                </div>
                                {/* Info icon - read-only indicator */}
                                <div className="absolute top-2 right-2">
                                  <div className="p-1.5 bg-[#1F1F1F]/80 rounded-lg" title="Uploaded in Creation section - delete there">
                                    <Info className="w-3 h-3 text-[#808080]" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {angleImages.length === 0 && userImages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <ImageIcon className="w-16 h-16 text-[#808080] mb-4" />
                      <p className="text-[#808080] mb-4">No reference images yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    
    {/* Asset Angle Generation Modal */}
    {showAngleModal && (
      <AssetAngleGenerationModal
        isOpen={showAngleModal}
        onClose={() => {
          setShowAngleModal(false);
        }}
        assetId={asset.id}
        assetName={asset.name}
        projectId={screenplayId || asset.projectId || ''}
        asset={asset}
        onComplete={async (result) => {
          toast.success(`Angle generation started for ${asset.name}!`, {
            description: 'Check the Jobs tab to track progress.'
          });
          setShowAngleModal(false);
          setIsGeneratingAngles(false);
          
          // Refresh asset data after delay to catch completed angles
          setTimeout(() => {
            onUpdate();
          }, 5000);
        }}
      />
    )}
  </>
  );
}
