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

import { useState } from 'react';
import { X, Edit2, Save, Trash2, Image as ImageIcon, Sparkles, Package, Car, Armchair, Box, Upload, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Asset, AssetCategory, ASSET_CATEGORY_METADATA } from '@/types/asset';
import { toast } from 'sonner';

interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset;
  onUpdate: () => void;
  onDelete: () => void;
  onGenerate3D: (asset: Asset) => void;
  isMobile?: boolean;
}

export default function AssetDetailModal({ 
  isOpen, 
  onClose, 
  asset, 
  onUpdate, 
  onDelete,
  onGenerate3D,
  isMobile = false
}: AssetDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'gallery' | 'info' | 'references'>('gallery');
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(asset.name);
  const [description, setDescription] = useState(asset.description || '');
  const [category, setCategory] = useState<AssetCategory>(asset.category);
  const [tags, setTags] = useState(asset.tags.join(', '));
  const [saving, setSaving] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const categoryMeta = ASSET_CATEGORY_METADATA[category];
  const canExport3D = asset.images.length >= 2 && asset.images.length <= 10;
  
  // Convert asset images to gallery format
  const allImages = asset.images.map((img, idx) => ({
    id: `img-${idx}`,
    imageUrl: img.url,
    label: `${asset.name} - Image ${idx + 1}`,
    isBase: idx === 0
  }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/asset-bank/${asset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
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

  const handleDelete = async () => {
    if (!confirm(`Delete "${asset.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/asset-bank/${asset.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        onDelete();
        onClose();
        toast.success('Asset deleted successfully');
      } else {
        throw new Error('Failed to delete asset');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete asset');
    }
  };

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
                    <button
                      onClick={handleDelete}
                      className="p-2 hover:bg-[#DC143C]/20 rounded-lg transition-colors text-[#DC143C] hover:text-[#DC143C]"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
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
                References ({asset.images.length})
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
                    <label className="px-4 py-2 bg-[#141414] border border-[#3F3F46] hover:bg-[#1F1F1F] hover:border-[#DC143C] text-[#FFFFFF] rounded-lg cursor-pointer transition-colors inline-flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        multiple
                      />
                    </label>
                    
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
                        ⚠️ Need {2 - asset.images.length} more image{(2 - asset.images.length) !== 1 ? 's' : ''} for 3D export
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
                <div className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {allImages.map((img) => (
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
