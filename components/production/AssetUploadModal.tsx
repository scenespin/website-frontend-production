'use client';

/**
 * Asset Upload Modal
 * 
 * Modal for creating a new asset and uploading 2-10 images with drag-drop.
 * Part of Feature 0099: Asset Bank
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
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
      // Step 1: Create asset
      const createResponse = await fetch('/api/asset-bank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h3 className="text-2xl font-bold text-white">Create New Asset</h3>
            <p className="text-sm text-gray-400 mt-1">
              {step === 'details' 
                ? 'Enter asset details and category'
                : `Upload 2-10 photos from different angles (${images.length}/10)`
              }
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'details' ? (
            // Step 1: Asset Details
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Asset Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Vintage Red Car, Silver Revolver, Leather Chair"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">{name.length}/100 characters</p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(ASSET_CATEGORY_METADATA).map(([key, meta]) => (
                    <button
                      key={key}
                      onClick={() => setCategory(key as AssetCategory)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        category === key
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <div className="text-2xl mb-2">{meta.icon === 'Package' ? '📦' : meta.icon === 'Car' ? '🚗' : meta.icon === 'Armchair' ? '🪑' : '📦'}</div>
                      <div className="text-sm font-medium text-white">{meta.label}</div>
                      <div className="text-xs text-gray-400 mt-1">{meta.priceUSD}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {ASSET_CATEGORY_METADATA[category].examples}
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the asset in detail..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary focus:outline-none resize-none"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">{description.length}/500 characters</p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags (optional)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="weapon, gun, silver (comma-separated)"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Helps with searching later</p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={handleClose}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep('upload')}
                  disabled={!name.trim()}
                  className="btn btn-primary"
                >
                  Next: Upload Images →
                </button>
              </div>
            </div>
          ) : (
            // Step 2: Upload Images
            <div className="space-y-6">
              {/* Drag-Drop Area */}
              {images.length < 10 && (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    isDragActive
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-white font-medium mb-2">
                    {isDragActive ? 'Drop images here...' : 'Drag & drop images here'}
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    or click to browse (JPG, PNG, WebP)
                  </p>
                  <p className="text-xs text-gray-500">
                    Upload {Math.max(0, 2 - images.length)} more to reach minimum (2-10 total)
                  </p>
                </div>
              )}

              {/* Image Previews */}
              {images.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-300">
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
                        <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
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
                          className="mt-2 w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white"
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
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">Uploading images...</span>
                    <span className="text-sm font-medium text-primary">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between gap-3 pt-4">
                <button
                  onClick={() => setStep('details')}
                  disabled={uploading}
                  className="btn btn-outline"
                >
                  ← Back
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    disabled={uploading}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={images.length < 2 || uploading}
                    className="btn btn-primary"
                  >
                    {uploading ? 'Creating...' : `Create Asset (${images.length} images)`}
                  </button>
                </div>
              </div>

              {images.length < 2 && (
                <p className="text-center text-sm text-yellow-500">
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

