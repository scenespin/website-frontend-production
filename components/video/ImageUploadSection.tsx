/**
 * ImageUploadSection.tsx
 * Extracted from QuickVideoCard.tsx for better modularity
 * Handles image upload for image-to-video and interpolation modes
 */

'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Image validation constants
const MAX_IMAGE_SIZE_MB = 20;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

interface ImageUploadSectionProps {
  label: string;
  imageFile: File | null;
  onImageChange: (file: File | null) => void;
  disabled?: boolean;
  required?: boolean;
}

export function ImageUploadSection({
  label,
  imageFile,
  onImageChange,
  disabled = false,
  required = false
}: ImageUploadSectionProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (preview?.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Update preview when file changes
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }, [imageFile]);

  /**
   * Validate image file
   */
  const validateImageFile = (file: File): string | null => {
    // Check file type
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      return `Invalid file type. Supported: JPEG, PNG, GIF, WebP`;
    }

    // Check file size
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return `File too large. Maximum size: ${MAX_IMAGE_SIZE_MB}MB`;
    }

    return null;
  };

  /**
   * Handle file selection
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);

    if (!file) {
      onImageChange(null);
      return;
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      onImageChange(null);
      return;
    }

    onImageChange(file);
  };

  /**
   * Handle remove image
   */
  const handleRemove = () => {
    onImageChange(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Upload button or preview */}
      {!imageFile ? (
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose Image
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept={SUPPORTED_IMAGE_TYPES.join(',')}
            onChange={handleFileChange}
            className="hidden"
          />
          <p className="text-xs text-slate-500 mt-1">
            Max {MAX_IMAGE_SIZE_MB}MB • JPEG, PNG, GIF, WebP
          </p>
        </div>
      ) : (
        <div className="relative">
          <div className="relative rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700">
            <img
              src={preview || ''}
              alt={label}
              className="w-full h-48 object-cover"
            />
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleRemove}
              disabled={disabled}
              className="absolute top-2 right-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)}MB)
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}

