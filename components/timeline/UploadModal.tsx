'use client';

/**
 * UploadModal Component - Feature 0070
 * 
 * Modal for uploading video, audio, and image files to the Timeline.
 * Provides drag & drop interface with S3 upload and storage integration.
 * 
 * Features:
 * - Drag & drop upload zone
 * - File type validation
 * - S3 upload with progress
 * - Storage decision integration
 * - Auto-add to timeline after upload
 */

import React, { useState } from 'react';
import { Upload, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { StorageDecisionModal } from '@/components/storage/StorageDecisionModal';
import { extractS3Key } from '@/utils/s3';

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

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (url: string, s3Key: string, type: string, name: string) => void;
  projectId?: string;
}

export function UploadModal({ isOpen, onClose, onUploadComplete, projectId }: UploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  /**
   * Validate file before upload
   */
  function validateFile(file: File): string | null {
    const fileType = file.type;
    
    // Check video types
    if (fileType.startsWith('video/')) {
      if (!SUPPORTED_VIDEO_TYPES.includes(fileType)) {
        return 'Unsupported video format. Use MP4, MOV, WebM, or MKV.';
      }
      if (file.size > MAX_VIDEO_SIZE_BYTES) {
        return `Video too large. Max ${MAX_VIDEO_SIZE_MB}MB`;
      }
      return null;
    }
    
    // Check audio types
    if (fileType.startsWith('audio/')) {
      if (!SUPPORTED_AUDIO_TYPES.includes(fileType)) {
        return 'Unsupported audio format. Use MP3, WAV, AAC, or OGG.';
      }
      if (file.size > MAX_AUDIO_SIZE_BYTES) {
        return `Audio too large. Max ${MAX_AUDIO_SIZE_MB}MB`;
      }
      return null;
    }
    
    // Check image types
    if (fileType.startsWith('image/')) {
      if (!SUPPORTED_IMAGE_TYPES.includes(fileType)) {
        return 'Unsupported image format. Use JPG, PNG, GIF, or WebP.';
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return `Image too large. Max ${MAX_IMAGE_SIZE_MB}MB`;
      }
      return null;
    }
    
    return 'Unsupported file type. Use video, audio, or image files.';
  }

  /**
   * Handle file upload
   */
  async function handleFileUpload(file: File) {
    // Validate
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      const fileType = file.type.startsWith('video/') ? 'video' : 
                       file.type.startsWith('audio/') ? 'video' : 'image';
      formData.append(fileType, file);
      formData.append('projectId', projectId || 'default');
      
      const endpoint = '/api/video/upload';
      
      toast.info('Uploading...');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Show storage decision modal
        setSelectedAsset({
          url: data.url,
          s3Key: data.s3Key || extractS3Key(data.url),
          name: file.name,
          type: fileType
        });
        setShowStorageModal(true);
        
        // Also notify parent to add to timeline
        onUploadComplete(data.url, data.s3Key, fileType, file.name);
        
        toast.success('✅ File uploaded! Choose where to save it.');
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('[UploadModal] Upload failed:', error);
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Media to Timeline</DialogTitle>
            <DialogDescription>
              Upload video, audio, or image files
            </DialogDescription>
          </DialogHeader>
          
          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              isDragging ? 'border-primary bg-primary/10' : 'border-border'
            }`}
            onClick={() => {
              if (isUploading) return;
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = [
                ...SUPPORTED_VIDEO_TYPES,
                ...SUPPORTED_AUDIO_TYPES,
                ...SUPPORTED_IMAGE_TYPES
              ].join(',');
              input.onchange = (e: any) => {
                if (e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              };
              input.click();
            }}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-12 h-12 text-muted-foreground" />
                <p className="font-medium">Drop files here or click to browse</p>
                <p className="text-sm text-muted-foreground">
                  Supports video, audio, and images
                </p>
                <div className="text-xs text-muted-foreground mt-2">
                  <p>Video: MP4, MOV, WebM, MKV (max {MAX_VIDEO_SIZE_MB}MB)</p>
                  <p>Audio: MP3, WAV, AAC, OGG (max {MAX_AUDIO_SIZE_MB}MB)</p>
                  <p>Images: JPG, PNG, GIF, WebP (max {MAX_IMAGE_SIZE_MB}MB)</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Storage Decision Modal */}
      {showStorageModal && selectedAsset && (
        <StorageDecisionModal
          isOpen={showStorageModal}
          onClose={() => {
            setShowStorageModal(false);
            setSelectedAsset(null);
            onClose(); // Close upload modal too
          }}
          assetType={selectedAsset.type}
          assetName={selectedAsset.name}
          s3TempUrl={selectedAsset.url}
          s3Key={selectedAsset.s3Key}
          fileSize={undefined}
          metadata={{}}
        />
      )}
    </>
  );
}

