'use client';

/**
 * Asset Upload Modal
 * 
 * Modal for creating a new asset and uploading 2-10 images with drag-drop.
 * Part of Feature 0099: Asset Bank
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@clerk/nextjs';
import { X, Upload, Image as ImageIcon, Trash2, Check } from 'lucide-react';
import { AssetCategory, ASSET_CATEGORY_METADATA, CreateAssetRequest } from '@/types/asset';

interface AssetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

interface ImagePreview {
  file: File;
  preview: string;
  angle?: string;
}

export default function AssetUploadModal({ isOpen, onClose, projectId, onSuccess }: AssetUploadModalProps) {
  const { getToken } = useAuth();
  const [step, setStep] = useState<'details' | 'upload'>('details');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>('prop');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.slice(0, 10 - images.length).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      angle: undefined,
    }));
    setImages(prev => [...prev, ...newImages]);
  }, [images.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 10,
    disabled: images.length >= 10,
  });

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const setImageAngle = (index: number, angle: string) => {
    setImages(prev => {
      const newImages = [...prev];
      newImages[index].angle = angle;
      return newImages;
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      alert('Please enter an asset name');
      return;
    }

    if (images.length < 2) {
      alert('Please upload at least 2 images (2-10 required)');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        alert('Authentication required. Please sign in.');
        setUploading(false);
        return;
      }

      // Step 1: Create asset
      const createResponse = await fetch('/api/asset-bank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          name: name.trim(),
          category,
          description: description.trim() || undefined,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        } as CreateAssetRequest),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create asset');
      }

      const { asset } = await createResponse.json();
      const assetId = asset.id;

      // Step 2: Upload images
      for (let i = 0; i < images.length; i++) {
        const formData = new FormData();
        formData.append('image', images[i].file);
        if (images[i].angle) {
          formData.append('angle', images[i].angle);
        }

        const uploadResponse = await fetch(`/api/asset-bank/${assetId}/images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload image ${i + 1}`);
        }

        setUploadProgress(Math.round(((i + 1) / images.length) * 100));
      }

      // Success!
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to create asset. Please try again.');
      setUploading(false);
    }
  };

  const handleClose = () => {
    // Clean up previews
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setStep('details');
    setName('');
    setCategory('prop');
    setDescription('');
    setTags('');
    setImages([]);
    setUploading(false);
    setUploadProgress(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !uploading) {
          handleClose();
        }
      }}
    >
      <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[85vh] overflow-hidden border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h3 className="text-xl font-bold text-slate-200">Create New Asset</h3>
            <p className="text-xs text-slate-400 mt-1">
              {step === 'details' 
                ? 'Enter asset details and category'
                : `Upload 2-10 photos from different angles (${images.length}/10)`
              }
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-140px)] p-6">
          {step === 'details' ? (
            // Step 1: Asset Details
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Asset Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Vintage Red Car, Silver Revolver, Leather Chair"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-[#DC143C] focus:outline-none text-sm"
                  maxLength={100}
                />
                <p className="text-xs text-slate-500 mt-1">{name.length}/100 characters</p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(ASSET_CATEGORY_METADATA).map(([key, meta]) => (
                    <button
                      key={key}
                      onClick={() => setCategory(key as AssetCategory)}
                      className={`p-3 rounded-lg border-2 transition-all text-sm ${
                        category === key
                          ? 'border-[#DC143C] bg-[#DC143C]/10'
                          : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-xl mb-1">{meta.icon === 'Package' ? '📦' : meta.icon === 'Car' ? '🚗' : meta.icon === 'Armchair' ? '🪑' : '📦'}</div>
                      <div className="text-xs font-medium text-slate-200">{meta.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{meta.priceUSD}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {ASSET_CATEGORY_METADATA[category].examples}
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the asset in detail..."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-[#DC143C] focus:outline-none resize-none text-sm"
                  rows={2}
                  maxLength={500}
                />
                <p className="text-xs text-slate-500 mt-1">{description.length}/500 characters</p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tags (optional)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="weapon, gun, silver (comma-separated)"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-[#DC143C] focus:outline-none text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">Helps with searching later</p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-700 mt-4">
                <button
                  onClick={handleClose}
                  className="px-4 py-1.5 text-sm bg-slate-700 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep('upload')}
                  disabled={!name.trim()}
                  className="px-4 py-1.5 text-sm bg-[#DC143C] text-white rounded-lg hover:bg-[#B91238] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Upload Images →
                </button>
              </div>
            </div>
          ) : (
            // Step 2: Upload Images
            <div className="space-y-4">
              {/* Drag-Drop Area */}
              {images.length < 10 && (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    isDragActive
                      ? 'border-[#DC143C] bg-[#DC143C]/10'
                      : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-200 font-medium mb-2">
                    {isDragActive ? 'Drop images here...' : 'Drag & drop images here'}
                  </p>
                  <p className="text-sm text-slate-400 mb-4">
                    or click to browse (JPG, PNG, WebP)
                  </p>
                  <p className="text-xs text-slate-500">
                    Upload {Math.max(0, 2 - images.length)} more to reach minimum (2-10 total)
                  </p>
                </div>
              )}

              {/* Image Previews */}
              {images.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-slate-300">
                      Uploaded Images ({images.length}/10)
                    </h4>
                    {images.length >= 2 && (
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <Check className="w-4 h-4" />
                        Ready for 3D generation
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((img, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-slate-700 rounded-lg overflow-hidden">
                          <img
                            src={img.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                        <select
                          value={img.angle || ''}
                          onChange={(e) => setImageAngle(index, e.target.value)}
                          className="mt-2 w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-slate-200"
                        >
                          <option value="">Angle (optional)</option>
                          <option value="front">Front</option>
                          <option value="side">Side</option>
                          <option value="back">Back</option>
                          <option value="top">Top</option>
                          <option value="45-degree">45° Angle</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress */}
              {uploading && (
                <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-300">Uploading images...</span>
                    <span className="text-xs font-medium text-[#DC143C]">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-1.5">
                    <div
                      className="bg-[#DC143C] h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between gap-2 pt-3 border-t border-slate-700 mt-4">
                <button
                  onClick={() => setStep('details')}
                  disabled={uploading}
                  className="px-4 py-1.5 text-sm bg-slate-700 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  ← Back
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleClose}
                    disabled={uploading}
                    className="px-4 py-1.5 text-sm bg-slate-700 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={images.length < 2 || uploading}
                    className="px-4 py-1.5 text-sm bg-[#DC143C] text-white rounded-lg hover:bg-[#B91238] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Creating...' : `Create Asset (${images.length} images)`}
                  </button>
                </div>
              </div>

              {images.length < 2 && (
                <p className="text-center text-xs text-yellow-500">
                  ⚠️ Upload at least 2 images to enable 3D generation
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

