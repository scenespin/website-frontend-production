'use client';

/**
 * CharacterDetailModal - Full-screen character detail view
 * 
 * Features:
 * - Image gallery (main + references)
 * - 3D image button/display
 * - Description and info from script
 * - Uploaded images management
 * - Advanced options
 */

import React, { useState } from 'react';
import { X, Upload, Sparkles, Image as ImageIcon, User, FileText, Box, Download, Trash2, Plus, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CharacterProfile } from './ProductionPageLayout';
import { toast } from 'sonner';
import { PerformanceControls, type PerformanceSettings } from '../characters/PerformanceControls';

interface CharacterDetailModalProps {
  character: CharacterProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (characterId: string, updates: Partial<CharacterProfile>) => void;
  onDelete?: (characterId: string) => void;
  projectId: string;
  onUploadImage?: (characterId: string, file: File) => Promise<void>;
  onGenerate3D?: (characterId: string) => Promise<void>;
  onGenerateVariations?: (characterId: string) => Promise<void>;
  onGeneratePosePackage?: (characterId: string) => void;
  hasAdvancedFeatures?: boolean;
  performanceSettings?: PerformanceSettings;
  onPerformanceSettingsChange?: (settings: PerformanceSettings) => void;
}

export function CharacterDetailModal({
  character,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  projectId,
  onUploadImage,
  onGenerate3D,
  onGenerateVariations,
  onGeneratePosePackage,
  hasAdvancedFeatures = false,
  performanceSettings,
  onPerformanceSettingsChange
}: CharacterDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'gallery' | 'info' | 'references'>('gallery');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating3D, setIsGenerating3D] = useState(false);
  
  // Combine all images: base reference + references
  const allImages = [
    character.baseReference ? {
      id: 'base',
      imageUrl: character.baseReference.imageUrl,
      label: 'Base Reference',
      isBase: true
    } : null,
    ...character.references.map(ref => ({
      id: ref.id,
      imageUrl: ref.imageUrl,
      label: ref.label || 'Reference',
      isBase: false
    }))
  ].filter(Boolean) as Array<{id: string; imageUrl: string; label: string; isBase: boolean}>;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!onUploadImage) {
      toast.error('Upload functionality not available');
      return;
    }

    setIsUploading(true);
    try {
      await onUploadImage(character.id, file);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      // Reset input
      if (e.target) e.target.value = '';
    }
  };

  const handleGenerate3D = async () => {
    if (!onGenerate3D) {
      toast.error('3D generation not available');
      return;
    }

    setIsGenerating3D(true);
    try {
      await onGenerate3D(character.id);
      toast.success('3D model generation started');
    } catch (error) {
      console.error('3D generation failed:', error);
      toast.error('Failed to generate 3D model');
    } finally {
      setIsGenerating3D(false);
    }
  };

  if (!isOpen) return null;

  return (
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
                  <User className="w-6 h-6 text-[#DC143C]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#FFFFFF]">{character.name}</h2>
                  <p className="text-sm text-[#808080] capitalize">{character.type} character</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors text-[#808080] hover:text-[#FFFFFF]"
              >
                <X className="w-5 h-5" />
              </button>
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
                References ({character.referenceCount})
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
                      <ImageIcon className="w-16 h-16 text-[#808080] mb-4" />
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

                  {/* Performance Controls - Only show if advanced features available */}
                  {hasAdvancedFeatures && performanceSettings && onPerformanceSettingsChange && (
                    <div className="mb-6 pb-6 border-b border-[#3F3F46]">
                      <PerformanceControls
                        settings={performanceSettings}
                        onChange={onPerformanceSettingsChange}
                        compact={false}
                      />
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
                        disabled={isGenerating3D}
                        className="px-4 py-2 bg-[#141414] border border-[#3F3F46] hover:bg-[#1F1F1F] hover:border-[#DC143C] text-[#FFFFFF] rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                        title="Export 3D model for external use"
                      >
                        <Box className="w-4 h-4" />
                        {isGenerating3D ? 'Generating...' : 'Export to 3D (500 cr)'}
                      </button>
                      <p className="text-xs text-center" style={{ color: '#9CA3AF' }}>
                        Use in AR/VR, game engines, 3D animation tools, and more
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          if (onGenerateVariations) {
                            onGenerateVariations(character.id);
                          } else {
                            toast.error('Generate variations function not available');
                          }
                        }}
                        className="px-4 py-2 bg-[#DC143C] hover:bg-[#B91238] text-white rounded-lg transition-colors inline-flex items-center gap-2 w-full justify-center font-medium"
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate Variations
                      </button>
                      
                      <button
                        onClick={() => {
                          if (onGeneratePosePackage) {
                            onGeneratePosePackage(character.id);
                          } else {
                            toast.error('Generate pose package function not available');
                          }
                        }}
                        className="px-4 py-2 bg-[#141414] border border-[#3F3F46] hover:bg-[#1F1F1F] hover:border-[#DC143C] text-[#FFFFFF] rounded-lg transition-colors inline-flex items-center gap-2 w-full justify-center"
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate Pose Package
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-[#DC143C] text-white ml-1">NEW!</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'info' && (
                <div className="p-6 space-y-6">
                  {/* Character Info */}
                  <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#FFFFFF] mb-4">Character Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Name</label>
                        <p className="text-[#FFFFFF]">{character.name}</p>
                      </div>
                      <div>
                        <label className="text-xs text-[#808080] uppercase tracking-wide mb-1 block">Type</label>
                        <p className="text-[#FFFFFF] capitalize">{character.type}</p>
                      </div>
                    </div>
                  </div>

                  {/* Script Info */}
                  <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-[#FFFFFF] mb-4">From Script</h3>
                    <p className="text-[#808080] text-sm">
                      Character information extracted from the screenplay will appear here.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'references' && (
                <div className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {character.references.map((ref) => (
                      <div
                        key={ref.id}
                        className="relative group aspect-square bg-[#141414] border border-[#3F3F46] rounded-lg overflow-hidden hover:border-[#DC143C] transition-colors"
                      >
                        <img
                          src={ref.imageUrl}
                          alt={ref.label}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-xs text-[#FFFFFF] truncate">{ref.label}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

