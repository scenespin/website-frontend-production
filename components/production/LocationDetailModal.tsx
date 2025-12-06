'use client';

/**
 * LocationDetailModal - Full-screen location detail view
 * 
 * Features:
 * - Image gallery (main + references with thumbnail grid)
 * - 3D image button/display (placeholder for future implementation)
 * - Description and info from script
 * - Uploaded images management
 * - Three tabs: Gallery, Info, References
 * - Full-screen modal with cinema theme
 * 
 * Consistent with CharacterDetailModal for scene consistency and AI generation
 */

import React, { useState } from 'react';
import { X, Upload, Sparkles, Image as ImageIcon, MapPin, FileText, Box, Download, Trash2, Plus, Camera, Edit2, Save, MoreVertical, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import LocationAngleGenerationModal from './LocationAngleGenerationModal';
import Location3DExportModal from './Location3DExportModal';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Location Profile from Location Bank API (Feature 0142: Unified storage)
interface LocationReference {
  id: string;
  locationId: string;
  imageUrl: string;
  s3Key: string;
  angle: 'front' | 'side' | 'aerial' | 'interior' | 'exterior' | 'wide' | 'detail';
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
  generationMethod: 'upload' | 'ai-generated' | 'angle-variation';
  creditsUsed: number;
  createdAt: string;
}

interface LocationProfile {
  locationId: string;
  screenplayId: string;
  projectId: string; // Backward compatibility
  name: string;
  type: 'interior' | 'exterior' | 'mixed';
  description: string;
  baseReference: LocationReference;
  angleVariations: LocationReference[];
  totalCreditsSpent?: number;
  consistencyRating?: number;
  createdAt: string;
  updatedAt: string;
}

interface LocationDetailModalProps {
  location: LocationProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (locationId: string, updates: Partial<LocationProfile>) => void;
  onDelete?: (locationId: string) => void;
  projectId: string;
  onUploadImage?: (locationId: string, file: File) => Promise<void>;
  onGenerate3D?: (locationId: string) => Promise<void>;
  onGenerateAngles?: (locationId: string) => Promise<void>;
}

export function LocationDetailModal({
  location,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  projectId,
  onUploadImage,
  onGenerate3D,
  onGenerateAngles
}: LocationDetailModalProps) {
  // 🔥 ONE-WAY SYNC: Production Hub reads from ScreenplayContext but doesn't update it
  // Removed updateLocation - Production Hub changes stay in Production Hub
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'gallery' | 'info' | 'references'>('gallery');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating3D, setIsGenerating3D] = useState(false);
  const [isGeneratingAngles, setIsGeneratingAngles] = useState(false);
  const [showAngleModal, setShowAngleModal] = useState(false);
  const [show3DModal, setShow3DModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(location.name);
  const [description, setDescription] = useState(location.description || '');
  const [type, setType] = useState<LocationProfile['type']>(location.type);
  
  // Convert baseReference and angleVariations to image objects
  // Check new format (angleVariations directly) first, then fall back to old format (locationBankProfile)
  const allImages: Array<{ id: string; imageUrl: string; label: string; isBase: boolean; s3Key?: string }> = [];
  
  if (location.baseReference) {
    allImages.push({
      id: location.baseReference.id,
      imageUrl: location.baseReference.imageUrl,
      label: `${location.name} - Base Reference`,
      isBase: true,
      s3Key: location.baseReference.s3Key
    });
  }
  
  // Get angleVariations from new format or old format
  const angleVariations = location.angleVariations || 
    (location as any).locationBankProfile?.angleVariations?.map((v: any) => ({
      id: `ref_${v.s3Key}`,
      imageUrl: '', // Will be enriched
      s3Key: v.s3Key,
      angle: v.angle,
      timeOfDay: v.timeOfDay,
      weather: v.weather,
      season: v.season,
      generationMethod: v.generationMethod,
      creditsUsed: v.creditsUsed,
      createdAt: v.createdAt
    })) || [];
  
  angleVariations.forEach((variation: any) => {
    allImages.push({
      id: variation.id || `ref_${variation.s3Key}`,
      imageUrl: variation.imageUrl || '',
      label: `${location.name} - ${variation.angle} view`,
      isBase: false,
      s3Key: variation.s3Key
    });
  });
  
  // Convert type for display
  const typeLabel = location.type === 'interior' ? 'INT.' : 
                   location.type === 'exterior' ? 'EXT.' : 'INT./EXT.';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!onUploadImage) {
      toast.error('Upload functionality not available');
      return;
    }

    setIsUploading(true);
    try {
      await onUploadImage(location.locationId, file);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleGenerate3D = () => {
    // Open 3D export modal
    setShow3DModal(true);
  };

  const handleGenerateAngles = () => {
    // Open angle generation modal
    setShowAngleModal(true);
  };

  if (!isOpen) return null;

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
                  <MapPin className="w-6 h-6 text-[#DC143C]" />
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
                    <>
                      <h2 className="text-xl font-bold text-[#FFFFFF]">{location.name}</h2>
                      <p className="text-sm text-[#808080]">{typeLabel}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors text-[#808080] hover:text-[#FFFFFF]"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                )}
                {editing && (
                  <>
                    <button
                      onClick={async () => {
                        try {
                          await onUpdate(location.locationId, { name, description, type });
                          setEditing(false);
                          toast.success('Location updated successfully');
                        } catch (error) {
                          console.error('Update failed:', error);
                          toast.error('Failed to update location');
                        }
                      }}
                      className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors text-[#DC143C] hover:text-[#FFFFFF]"
                      title="Save"
                    >
                      <Save className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setName(location.name);
                        setDescription(location.description || '');
                        setType(location.type);
                        setEditing(false);
                      }}
                      className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors text-[#808080] hover:text-[#FFFFFF]"
                      title="Cancel"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </>
                )}
                {!editing && (
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors text-[#808080] hover:text-[#FFFFFF]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
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
                References ({allImages.length})
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
                      <MapPin className="w-16 h-16 text-[#808080] mb-4" />
                      <p className="text-[#808080] mb-4">No images yet</p>
                      <label className="px-4 py-2 bg-[#DC143C] hover:bg-[#B91238] text-white rounded-lg cursor-pointer transition-colors inline-flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </label>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <label className="px-4 py-2 bg-[#141414] border border-[#3F3F46] hover:bg-[#1F1F1F] hover:border-[#DC143C] text-[#FFFFFF] rounded-lg cursor-pointer transition-colors inline-flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      {isUploading ? 'Uploading...' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                    
                    <div className="space-y-2">
                      <button
                        onClick={handleGenerate3D}
                        className="px-4 py-2 bg-[#141414] border border-[#3F3F46] hover:bg-[#1F1F1F] hover:border-[#DC143C] text-[#FFFFFF] rounded-lg transition-colors inline-flex items-center gap-2 w-full justify-center"
                        title="Export 3D model for external use"
                      >
                        <Box className="w-4 h-4" />
                        Export to 3D (1000 cr)
                      </button>
                      <p className="text-xs text-center" style={{ color: '#9CA3AF' }}>
                        Use in AR/VR, game engines, 3D animation tools, and more
                      </p>
                    </div>
                    
                    <button
                      onClick={handleGenerateAngles}
                      disabled={isGeneratingAngles}
                      className="px-4 py-2 bg-[#141414] border border-[#3F3F46] hover:bg-[#1F1F1F] hover:border-[#DC143C] text-[#FFFFFF] rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="w-4 h-4" />
                      {isGeneratingAngles ? 'Generating...' : 'Generate Angle Package'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'info' && (
                <div className="p-6 space-y-6">
                  {/* Location Info */}
                  <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#FFFFFF] mb-4">Location Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Name</label>
                        {editing ? (
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-[#1F1F1F] border border-[#3F3F46] rounded text-[#FFFFFF] focus:border-[#DC143C] focus:outline-none"
                            maxLength={100}
                          />
                        ) : (
                          <p className="text-[#FFFFFF]">{location.name}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Type</label>
                        {editing ? (
                          <select
                            value={type}
                            onChange={(e) => setType(e.target.value as LocationProfile['type'])}
                            className="w-full px-3 py-2 bg-[#1F1F1F] border border-[#3F3F46] rounded text-[#FFFFFF] focus:border-[#DC143C] focus:outline-none"
                          >
                            <option value="interior">Interior</option>
                            <option value="exterior">Exterior</option>
                            <option value="mixed">Mixed</option>
                          </select>
                        ) : (
                          <p className="text-[#FFFFFF]">{typeLabel}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Description</label>
                        {editing ? (
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-[#1F1F1F] border border-[#3F3F46] rounded text-[#FFFFFF] focus:border-[#DC143C] focus:outline-none resize-none"
                            rows={4}
                            maxLength={500}
                          />
                        ) : (
                          <p className="text-[#808080]">{location.description || 'No description'}</p>
                        )}
                      </div>
                      {location.angleVariations && location.angleVariations.length > 0 && (
                        <div>
                          <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Angle Variations</label>
                          <p className="text-[#808080]">{location.angleVariations.length} angle{location.angleVariations.length !== 1 ? 's' : ''}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Script Info */}
                  <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#FFFFFF] mb-4">From Script</h3>
                    <p className="text-[#808080] text-sm">
                      Location information extracted from the screenplay will appear here.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'references' && (
                <div className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {allImages.map((img, idx) => {
                      // Find the actual LocationReference for this image
                      const locationRef = img.isBase 
                        ? location.baseReference 
                        : location.angleVariations.find(v => v.id === img.id);
                      
                      // Check if image was created in Production Hub (AI-generated angles)
                      const isAIGenerated = locationRef?.generationMethod === 'ai-generated' || 
                                           locationRef?.generationMethod === 'angle-variation' ||
                                           (!img.isBase); // Angle variations are AI-generated
                      
                      // Check if image was created in Creation section (user uploads)
                      const createdInCreation = locationRef?.generationMethod === 'upload' && img.isBase;
                      
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
                            {/* Delete button - only show for Production Hub images */}
                            {isAIGenerated && !img.isBase && (
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
                                          if (!locationRef?.s3Key) {
                                            throw new Error('Missing S3 key for image');
                                          }
                                          
                                          // 🔥 FIX: Use s3Key for matching (more reliable than id)
                                          // Remove from angleVariations by matching s3Key
                                          const updatedAngleVariations = angleVariations.filter(
                                            (v: any) => v.s3Key !== locationRef.s3Key
                                          );
                                          
                                          // 🔥 ONE-WAY SYNC: Only update Production Hub backend
                                          // Production Hub images (createdIn: 'production-hub') should NOT sync back to Creation section
                                          await onUpdate(location.locationId, {
                                            angleVariations: updatedAngleVariations
                                          });
                                          
                                          queryClient.invalidateQueries({ queryKey: ['media', 'files', projectId] });
                                          toast.success('Angle image deleted');
                                        } catch (error: any) {
                                          console.error('[LocationDetailModal] Failed to delete angle image:', error);
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
                            {/* Info icon for Creation section images (cannot delete from Production Hub) */}
                            {createdInCreation && (
                              <div className="absolute top-2 right-2">
                                <div className="p-1.5 bg-[#DC143C]/20 rounded-lg" title="This image was uploaded in the Create section and can only be deleted there">
                                  <Info className="w-3 h-3 text-[#DC143C]" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
      </AnimatePresence>
      
      {/* Location Angle Generation Modal */}
      {showAngleModal && (
        <LocationAngleGenerationModal
        isOpen={showAngleModal}
        onClose={() => {
          setShowAngleModal(false);
        }}
        locationId={location.locationId}
        locationName={location.name}
        projectId={projectId}
        locationProfile={location}
        onComplete={async (result) => {
          // Job started - modal already closed, job runs in background
          // User can track progress in Jobs tab
          // Location data will refresh automatically when job completes (via ProductionJobsPanel)
        }}
      />
    )}
    
    {/* Location 3D Export Modal */}
    {show3DModal && (
      <Location3DExportModal
        isOpen={show3DModal}
        onClose={() => {
          setShow3DModal(false);
        }}
        location={location}
        onSuccess={() => {
          setShow3DModal(false);
          // Optionally refresh location data
          if (onGenerate3D) {
            // Parent can handle refresh if needed
          }
        }}
      />
    )}
  </>
  );
}

