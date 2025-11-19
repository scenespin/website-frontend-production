'use client';

/**
 * MediaUploadSlot Component - Feature 0070
 * 
 * Reusable upload slot for video, audio, and image files.
 * Used in Production page for user media uploads.
 * 
 * Features:
 * - File type detection and validation
 * - File size display and limits
 * - Preview for images and videos
 * - Audio file icon display
 * - Remove functionality
 * - Mobile-optimized touch targets
 */

import React, { useState } from 'react';
import { Upload, X, FileVideo, FileAudio, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const MAX_VIDEO_SIZE_MB = 100;
const MAX_AUDIO_SIZE_MB = 10;
const MAX_IMAGE_SIZE_MB = 10;

const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
const MAX_AUDIO_SIZE_BYTES = MAX_AUDIO_SIZE_MB * 1024 * 1024;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime', // MOV
  'video/webm',
  'video/x-matroska' // MKV
];

const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg', // MP3
  'audio/wav',
  'audio/aac',
  'audio/ogg'
];

const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

interface MediaUploadSlotProps {
  index: number;
  file: File | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
  isMobile?: boolean;
  uploading?: boolean;
}

export function MediaUploadSlot({ 
  index, 
  file, 
  onUpload, 
  onRemove, 
  isMobile = false,
  uploading = false
}: MediaUploadSlotProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  /**
   * Validate file before upload
   */
  function validateFile(selectedFile: File): string | null {
    const fileType = selectedFile.type;
    
    // Check video types
    if (fileType.startsWith('video/')) {
      if (!SUPPORTED_VIDEO_TYPES.includes(fileType)) {
        return 'Unsupported video format. Use MP4, MOV, WebM, or MKV.';
      }
      if (selectedFile.size > MAX_VIDEO_SIZE_BYTES) {
        return `Video too large. Max ${MAX_VIDEO_SIZE_MB}MB`;
      }
      return null;
    }
    
    // Check audio types
    if (fileType.startsWith('audio/')) {
      if (!SUPPORTED_AUDIO_TYPES.includes(fileType)) {
        return 'Unsupported audio format. Use MP3, WAV, AAC, or OGG.';
      }
      if (selectedFile.size > MAX_AUDIO_SIZE_BYTES) {
        return `Audio too large. Max ${MAX_AUDIO_SIZE_MB}MB`;
      }
      return null;
    }
    
    // Check image types
    if (fileType.startsWith('image/')) {
      if (!SUPPORTED_IMAGE_TYPES.includes(fileType)) {
        return 'Unsupported image format. Use JPG, PNG, GIF, or WebP.';
      }
      if (selectedFile.size > MAX_IMAGE_SIZE_BYTES) {
        return `Image too large. Max ${MAX_IMAGE_SIZE_MB}MB`;
      }
      return null;
    }
    
    return 'Unsupported file type. Use video, audio, or image files.';
  }

  /**
   * Handle file selection
   */
  function handleFileSelect(selectedFile: File) {
    // Validate
    const error = validateFile(selectedFile);
    if (error) {
      toast.error(error);
      return;
    }

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }

    // Call parent handler
    onUpload(selectedFile);
  }

  /**
   * Handle remove
   */
  function handleRemove() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onRemove();
  }

  /**
   * Get file type icon
   */
  function getFileIcon() {
    if (!file) return <Upload className="w-4 h-4 text-[#808080]" />;
    
    const fileType = file.type;
    if (fileType.startsWith('video/')) {
      return <FileVideo className="w-8 h-8 text-blue-500" />;
    }
    if (fileType.startsWith('audio/')) {
      return <FileAudio className="w-8 h-8 text-green-500" />;
    }
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="w-8 h-8 text-purple-500" />;
    }
    return <Upload className="w-4 h-4 text-[#808080]" />;
  }

  /**
   * Format file size
   */
  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="relative">
      {file ? (
        <div className="relative w-full border-2 border-[#3F3F46] rounded overflow-hidden bg-[#141414]">
          {/* Preview for images */}
          {file.type.startsWith('image/') && previewUrl ? (
            <div className={`relative ${isMobile ? 'h-20' : 'h-20'}`}>
              <img
                src={previewUrl}
                alt={file.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            /* Icon display for video/audio */
            <div className={`flex flex-col items-center justify-center ${isMobile ? 'h-20' : 'h-20'} bg-[#1F1F1F]`}>
              {getFileIcon()}
              <div className="text-[10px] font-medium text-center mt-1 px-2 line-clamp-1 text-[#FFFFFF]">
                {file.name}
              </div>
              <div className="text-[10px] text-[#808080]">
                {formatFileSize(file.size)}
              </div>
            </div>
          )}

          {/* Remove button */}
          {!uploading && (
            <button
              onClick={handleRemove}
              className="absolute top-1 right-1 p-1 bg-[#0A0A0A]/90 rounded-full hover:bg-[#DC143C] shadow-lg z-10"
            >
              <X className="w-3 h-3 text-[#FFFFFF]" />
            </button>
          )}

          {/* Uploading overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-[#0A0A0A]/80 flex flex-col items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#DC143C]" />
              <span className="text-xs text-[#808080] mt-2">Uploading...</span>
            </div>
          )}

          {/* File type badge */}
          <div className="absolute bottom-1 left-1 px-2 py-1 bg-[#0A0A0A]/90 rounded text-[10px] font-medium text-[#FFFFFF]">
            {file.type.split('/')[0].toUpperCase()}
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = [
              ...SUPPORTED_VIDEO_TYPES,
              ...SUPPORTED_AUDIO_TYPES,
              ...SUPPORTED_IMAGE_TYPES
            ].join(',');
            input.onchange = (e: any) => {
              const selectedFile = e.target?.files?.[0];
              if (selectedFile) {
                handleFileSelect(selectedFile);
              }
            };
            input.click();
          }}
          className={`w-full border-2 border-dashed border-[#3F3F46] rounded flex flex-col items-center justify-center hover:border-[#DC143C] hover:bg-[#DC143C]/10 transition-colors ${
            isMobile ? 'h-20' : 'h-20'
          }`}
        >
          <Upload className="w-4 h-4 text-[#808080] mb-1" />
          <span className="text-[10px] text-[#808080] font-medium">
            {isMobile ? 'Upload Media' : `Media ${index + 1}`}
          </span>
          <span className="text-[10px] text-[#808080] mt-1">
            Video, Audio, or Image
          </span>
        </button>
      )}
    </div>
  );
}

