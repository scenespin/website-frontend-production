'use client';

/**
 * Asset Detail Modal
 * 
 * Modal for viewing and editing asset details.
 * Part of Feature 0099: Asset Bank
 */

import { useState } from 'react';
import { X, Edit2, Save, Trash2, Image as ImageIcon, Sparkles, Package, Car, Armchair, Box } from 'lucide-react';
import { Asset, AssetCategory, ASSET_CATEGORY_METADATA } from '@/types/asset';

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
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(asset.name);
  const [description, setDescription] = useState(asset.description || '');
  const [category, setCategory] = useState<AssetCategory>(asset.category);
  const [tags, setTags] = useState(asset.tags.join(', '));
  const [saving, setSaving] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const categoryMeta = ASSET_CATEGORY_METADATA[category];
  const canExport3D = asset.images.length >= 2 && asset.images.length <= 10;

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
      } else {
        throw new Error('Failed to update asset');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update asset');
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
      } else {
        throw new Error('Failed to delete asset');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete asset');
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
    return <Icon className="w-5 h-5" />;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-base-200 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-base-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <div className="flex-1">
            {editing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-2xl font-bold bg-base-300 border border-base-content/20 rounded px-3 py-2 text-base-content w-full"
                maxLength={100}
              />
            ) : (
              <h3 className="text-2xl font-bold text-base-content">{asset.name}</h3>
            )}
            <div className="flex items-center gap-2 mt-2">
              {getCategoryIcon()}
              <span className="text-sm text-base-content/60">{categoryMeta.label}</span>
              {asset.has3DModel && (
                <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-lg font-medium">
                  3D Model Available
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editing && !isMobile ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="p-2 hover:bg-base-300 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-5 h-5 text-base-content/60" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5 text-red-400" />
                </button>
              </>
            ) : editing && !isMobile ? (
              <>
                <button
                  onClick={handleCancel}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                  className="btn btn-primary btn-sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : null}
            <button
              onClick={onClose}
              className="p-2 hover:bg-base-300 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5 text-base-content/60" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Images */}
            <div>
              <h4 className="text-lg font-semibold text-base-content mb-4">
                Images ({asset.images.length}/10)
              </h4>
              
              {/* Main Image */}
              {asset.images.length > 0 && (
                <div className="aspect-video bg-base-300 rounded-lg overflow-hidden mb-4">
                  <img
                    src={asset.images[selectedImageIndex].url}
                    alt={`${asset.name} - ${selectedImageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Thumbnails */}
              <div className="grid grid-cols-5 gap-2">
                {asset.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-primary'
                        : 'border-base-content/20 hover:border-base-content/30'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
                {asset.images.length < 10 && (
                  <button className="aspect-square rounded-lg border-2 border-dashed border-base-content/20 flex items-center justify-center hover:border-base-content/30 transition-colors">
                    <ImageIcon className="w-6 h-6 text-base-content/40" />
                  </button>
                )}
              </div>
            </div>

            {/* Right: Details */}
            <div className="space-y-6">
              {/* Category */}
              {editing ? (
                <div>
                  <label className="block text-sm font-medium text-base-content/70 mb-2">
                    Category
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(ASSET_CATEGORY_METADATA).map(([key, meta]) => (
                      <button
                        key={key}
                        onClick={() => setCategory(key as AssetCategory)}
                        className={`p-3 rounded-lg border-2 text-sm transition-all ${
                          category === key
                            ? 'border-primary bg-primary/10'
                            : 'border-base-content/20 bg-base-300 hover:border-base-content/30'
                        }`}
                      >
                        <div className="font-medium text-base-content">{meta.label}</div>
                        <div className="text-xs text-base-content/60 mt-1">{meta.priceUSD}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-base-content/60 mb-1">
                    Category
                  </label>
                  <div className="text-base-content">{categoryMeta.label}</div>
                  <div className="text-sm text-base-content/50 mt-1">{categoryMeta.examples}</div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-base-content/60 mb-2">
                  Description
                </label>
                {editing ? (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-base-300 border border-base-content/20 rounded-lg text-base-content placeholder-base-content/50 focus:border-primary focus:outline-none resize-none"
                    rows={4}
                    maxLength={500}
                    placeholder="Describe the asset..."
                  />
                ) : (
                  <div className="text-base-content/70">
                    {asset.description || <span className="text-base-content/40 italic">No description</span>}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-base-content/60 mb-2">
                  Tags
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full px-4 py-2 bg-base-300 border border-base-content/20 rounded-lg text-base-content placeholder-base-content/50 focus:border-primary focus:outline-none"
                    placeholder="weapon, gun, silver"
                  />
                ) : asset.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {asset.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-base-300 text-base-content/70 text-sm rounded-lg"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-base-content/40 italic">No tags</div>
                )}
              </div>

              {/* Metadata */}
              <div className="bg-base-300 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-base-content/60">Created:</span>
                  <span className="text-base-content/70">{new Date(asset.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">Last Updated:</span>
                  <span className="text-base-content/70">{new Date(asset.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">3D Export Cost:</span>
                  <span className="text-base-content/70">{categoryMeta.priceUSD} ({categoryMeta.credits} credits)</span>
                </div>
              </div>

              {/* Actions */}
              {!editing && (
                <div className="space-y-3 pt-4">
                  {canExport3D && !asset.has3DModel && (
                    <button
                      onClick={() => onGenerate3D(asset)}
                      className="w-full btn btn-primary"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate 3D Model ({categoryMeta.priceUSD})
                    </button>
                  )}
                  {!canExport3D && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-base-content/60">
                      ⚠️ Need {2 - asset.images.length} more image{(2 - asset.images.length) !== 1 ? 's' : ''} for 3D export
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

