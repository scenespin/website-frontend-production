'use client';

/**
 * Asset Detail Modal - Full-screen asset detail view
 * 
 * Features:
 * - Image gallery (main + references with thumbnail grid)
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
import { X, Trash2, Image as ImageIcon, Sparkles, Package, Car, Armchair, Box, Upload, FileText, MoreVertical, Info, Eye, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Asset, AssetCategory, ASSET_CATEGORY_METADATA } from '@/types/asset';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
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
  isMobile?: boolean;
  onAssetUpdate?: (updatedAsset: Asset) => void; // 🔥 NEW: Callback to update asset in parent
}

export default function AssetDetailModal({ 
  isOpen, 
  onClose, 
  asset, 
  onUpdate,
  onDelete,
  isMobile = false,
  onAssetUpdate
}: AssetDetailModalProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient(); // 🔥 NEW: For invalidating Media Library cache
  // 🔥 ONE-WAY SYNC: Removed ScreenplayContext sync - Production Hub changes stay in Production Hub
  // 🔥 FIX: Use screenplayId (primary) with projectId fallback for backward compatibility
  const screenplayId = asset?.screenplayId || asset?.projectId;
  const [activeTab, setActiveTab] = useState<'gallery' | 'info' | 'references'>('gallery');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showAngleModal, setShowAngleModal] = useState(false);
  const [isGeneratingAngles, setIsGeneratingAngles] = useState(false);
  const [previewImage, setPreviewImage] = useState<{url: string; label: string; s3Key?: string} | null>(null);

  // Helper function for downloading images via blob (more reliable than download attribute)
  // Follows MediaLibrary pattern: fetches fresh presigned URL if s3Key available
  const downloadImageAsBlob = async (imageUrl: string, filename: string, s3Key?: string) => {
    try {
      let downloadUrl = imageUrl;
      
      // If we have an s3Key, fetch a fresh presigned URL (like MediaLibrary does)
      if (s3Key) {
        try {
          const token = await getToken({ template: 'wryda-backend' });
          if (!token) throw new Error('Not authenticated');
          
          const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
          const presignedResponse = await fetch(`${BACKEND_API_URL}/api/s3/download-url`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              s3Key: s3Key,
              expiresIn: 3600, // 1 hour
            }),
          });
          
          if (!presignedResponse.ok) {
            throw new Error(`Failed to generate presigned URL: ${presignedResponse.status}`);
          }
          
          const presignedData = await presignedResponse.json();
          downloadUrl = presignedData.downloadUrl;
        } catch (error) {
          console.error('[AssetDetailModal] Failed to get presigned URL, using original URL:', error);
          // Fall back to original imageUrl if presigned URL fetch fails
        }
      }
      
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL after a short delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error: any) {
      console.error('[AssetDetailModal] Failed to download image:', error);
      throw error;
    }
  };

  const categoryMeta = ASSET_CATEGORY_METADATA[asset.category];
  const assetImages = asset.images || []; // Safety check for undefined images
  
  // 🔥 SIMPLIFIED: Get angleReferences directly from asset prop (backend already provides this with presigned URLs)
  // Backend AssetBankService already enriches angleReferences with imageUrl and all metadata
  const angleReferences = asset.angleReferences || [];
  
  const canGenerateAngles = assetImages.length >= 1; // Need at least 1 image for angle generation
  
  // 🔥 SIMPLIFIED: Separate Creation images from Production Hub angles
  // Creation images: source='user-upload' OR no source
  // Production Hub images: source='angle-generation' or 'image-generation' (AI-generated angles)
  const creationImages = assetImages.filter((img: any) => {
    const source = img.metadata?.source;
    return !source || source === 'user-upload';
  });
  
  // 🔥 SIMPLIFIED: Convert angleReferences to angleImages format (backend already provides imageUrl)
  const angleImages = angleReferences.map((ref: any) => ({
    url: ref.imageUrl || '',
    s3Key: ref.s3Key || '',
    uploadedAt: ref.createdAt || new Date().toISOString(),
    metadata: {
      s3Key: ref.s3Key,
      angle: ref.angle,
      source: 'angle-generation', // Backend marks these as angle-generation
      createdIn: 'production-hub',
      creditsUsed: ref.creditsUsed || 0
    }
  }));
  
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
    label: `${asset.name} - ${img.metadata?.angle || 'Angle'} view`,
    isBase: false,
    s3Key: img.s3Key || img.metadata?.s3Key,
    isAngleReference: true,
    angle: img.metadata?.angle,
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
        angleReferencesCount: angleReferences.length,
        angleImagesCount: angleImages.length,
        angleImageObjectsCount: angleImageObjects.length,
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
        canGenerateAngles,
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
        if (assetImages.length >= 5) {
          toast.error('Maximum 5 images per asset');
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

  // 🔥 REMOVED: handleSave, handleCancel, handleDelete - assets should only be edited/deleted from Create page

  if (!isOpen) return null;

  const getCategoryIcon = () => {
    const icons = { prop: Package, vehicle: Car, furniture: Armchair, other: Box };
    const Icon = icons[asset.category];
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
                  <h2 className="text-xl font-bold text-[#FFFFFF]">{asset.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-[#808080]">{categoryMeta.label}</span>
                    {/* 🔥 READ-ONLY BADGE */}
                    <span className="px-2 py-0.5 bg-[#6B7280]/20 border border-[#6B7280]/50 rounded text-[10px] text-[#9CA3AF]">
                      Read-only - Edit in Creation section
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
                References ({angleImageObjects.length})
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
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
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
                        <p className="text-[#FFFFFF]">{asset.name}</p>
                      </div>
                      <div>
                        <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Category</label>
                        <p className="text-[#FFFFFF]">{categoryMeta.label}</p>
                      </div>
                      {asset.description !== undefined && (
                        <div>
                          <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Description</label>
                          <p className="text-[#808080]">{asset.description || <span className="italic">No description</span>}</p>
                        </div>
                      )}
                      {asset.tags !== undefined && (
                        <div>
                          <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Tags</label>
                          {asset.tags.length > 0 ? (
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
                                  <DropdownMenuContent 
                                    align="end"
                                    className="bg-[#0A0A0A] border border-[#3F3F46] shadow-lg backdrop-blur-none"
                                    style={{ backgroundColor: '#0A0A0A' }}
                                  >
                                    <DropdownMenuItem
                                      className="text-[#FFFFFF] hover:bg-[#1F1F1F] hover:text-[#FFFFFF] cursor-pointer focus:bg-[#1F1F1F] focus:text-[#FFFFFF]"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewImage({ url: img.imageUrl, label: img.label, s3Key: img.s3Key });
                                      }}
                                    >
                                      <Eye className="w-4 h-4 mr-2 text-[#808080]" />
                                      View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-[#FFFFFF] hover:bg-[#1F1F1F] hover:text-[#FFFFFF] cursor-pointer focus:bg-[#1F1F1F] focus:text-[#FFFFFF]"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          // Generate filename from metadata
                                          const angle = img.metadata?.angle || img.angle || 'angle';
                                          const filename = `${asset.name}_${angle.replace(/[^a-zA-Z0-9]/g, '-')}_${Date.now()}.jpg`;
                                          await downloadImageAsBlob(img.imageUrl, filename, img.s3Key);
                                        } catch (error: any) {
                                          toast.error('Failed to download image');
                                        }
                                      }}
                                    >
                                      <Download className="w-4 h-4 mr-2 text-[#808080]" />
                                      Download
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-[#DC143C] hover:bg-[#DC143C]/10 hover:text-[#DC143C] cursor-pointer focus:bg-[#DC143C]/10 focus:text-[#DC143C]"
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
                                          
                                          // 🔥 FIX: For angle images, only update angleReferences (same pattern as LocationDetailModal)
                                          // Angle images are stored in angleReferences, not in the images array
                                          const updatedAngleReferences = (asset.angleReferences || []).filter(
                                            (ref: any) => ref.s3Key !== img.s3Key
                                          );
                                          
                                          // Update asset via API - only update angleReferences for angle images
                                          const response = await fetch(`/api/asset-bank/${asset.id}?screenplayId=${encodeURIComponent(screenplayId)}`, {
                                            method: 'PUT',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              'Authorization': `Bearer ${token}`,
                                            },
                                            body: JSON.stringify({
                                              angleReferences: updatedAngleReferences
                                            }),
                                          });
                                          
                                          if (!response.ok) {
                                            const errorData = await response.json().catch(() => ({}));
                                            throw new Error(errorData.error || 'Failed to delete image');
                                          }
                                          
                                          // 🔥 ONE-WAY SYNC: Do NOT update ScreenplayContext - Production Hub changes stay in Production Hub
                                          // Production Hub images (createdIn: 'production-hub') should NOT sync back to Creation section
                                          
                                          // 🔥 FIX: Use refetchQueries for immediate UI update (same pattern as CharacterDetailModal)
                                          await Promise.all([
                                            queryClient.refetchQueries({ queryKey: ['media', 'files', screenplayId] }),
                                            queryClient.refetchQueries({ queryKey: ['assets', screenplayId, 'production-hub'] })
                                          ]);
                                          
                                          onUpdate(); // Refresh asset list in parent
                                          toast.success('Image deleted');
                                        } catch (error: any) {
                                          console.error('[AssetDetailModal] Failed to delete image:', error);
                                          toast.error(`Failed to delete image: ${error.message}`);
                                        }
                                      }}
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
    
    {/* Image Preview Modal */}
    {previewImage && (
      <div 
        className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
        onClick={() => setPreviewImage(null)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setPreviewImage(null);
          }
        }}
        tabIndex={-1}
      >
        <div 
          className="bg-[#0A0A0A] rounded-lg border border-[#3F3F46] max-w-4xl w-full max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-[#141414] p-4 md:p-5 border-b border-[#3F3F46] flex items-center justify-between">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-[#FFFFFF]">{previewImage.label}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      // Generate filename from label
                      const filename = `${previewImage.label.replace(/[^a-zA-Z0-9]/g, '-')}_${Date.now()}.jpg`;
                      await downloadImageAsBlob(previewImage.url, filename, previewImage.s3Key);
                    } catch (error: any) {
                      toast.error('Failed to download image');
                    }
                  }}
                  className="px-4 py-2 bg-[#DC143C] hover:bg-[#B91238] text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewImage(null);
                }}
                className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors"
                aria-label="Close preview"
              >
                <X className="w-5 h-5 text-[#808080] hover:text-[#FFFFFF]" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 md:p-5">
            <div className="relative">
              <img 
                src={previewImage.url} 
                alt={previewImage.label}
                className="w-full h-auto rounded-lg max-h-[70vh] object-contain mx-auto bg-[#0A0A0A]"
                onError={(e) => {
                  console.error('[AssetDetailModal] Image failed to load:', previewImage.url);
                  toast.error('Image failed to load. The file may be corrupted or the URL expired.');
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
