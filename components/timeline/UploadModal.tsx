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
import { useAuth } from '@clerk/nextjs';

const MAX_VIDEO_SIZE_MB = 100;
const MAX_AUDIO_SIZE_MB = 500; // Increased for long audio files (podcasts, etc)
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
  const { getToken } = useAuth();
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
  /**
   * Handle file upload using direct S3 upload (industry standard)
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
      const fileType = file.type.startsWith('video/') ? 'video' : 
                       file.type.startsWith('audio/') ? 'audio' : 'image';
      
      toast.info('Uploading...');
      
      // Step 1: Get pre-signed URL
      const token = await getToken({ template: 'wryda-backend' });
      const presignedResponse = await fetch(
        `/api/video/upload/get-presigned-url?` +
        `fileName=${encodeURIComponent(file.name)}` +
        `&fileType=${encodeURIComponent(file.type)}` +
        `&fileSize=${file.size}` +
        `&projectId=${encodeURIComponent(projectId || 'default')}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!presignedResponse.ok) {
        if (presignedResponse.status === 413) {
          throw new Error('File too large. Maximum size is 50GB.');
        } else if (presignedResponse.status === 401) {
          throw new Error('Please sign in to upload files.');
        } else {
          const errorData = await presignedResponse.json();
          throw new Error(errorData.error || `Upload failed: ${presignedResponse.status}`);
        }
      }
      
      const { url, fields, s3Key } = await presignedResponse.json();
      
      if (!url || !fields || !s3Key) {
        throw new Error('Invalid response from server');
      }
      
      toast.info('Uploading to S3...');
      
      // Step 2: Upload directly to S3 using FormData POST (presigned POST)
      // This is the recommended approach for browser uploads - Content-Type is handled
      // as form data, not headers, preventing 403 Forbidden errors
      const formData = new FormData();
      
      // Add all the fields returned from createPresignedPost
      // NOTE: Do NOT include 'bucket' field in FormData - it's only for policy validation
      Object.entries(fields).forEach(([key, value]) => {
        // Skip 'bucket' field - it's only used in the policy, not in FormData
        if (key.toLowerCase() === 'bucket') {
          return;
        }
        formData.append(key, value as string);
      });
      
      // Add the file last (must be last field in FormData)
      formData.append('file', file);
      
      const s3Response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      
      if (!s3Response.ok) {
        throw new Error(`S3 upload failed: ${s3Response.statusText}`);
      }
      
      // Step 3: Generate S3 URL
      const S3_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || 'screenplay-assets-043309365215';
      const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
      const s3Url = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
      
      // Show storage decision modal
      setSelectedAsset({
        url: s3Url,
        s3Key: s3Key,
        name: file.name,
        type: fileType
      });
      setShowStorageModal(true);
      
      // Also notify parent to add to timeline
      onUploadComplete(s3Url, s3Key, fileType, file.name);
      
      toast.success('✅ File uploaded! Choose where to save it.');
      
    } catch (error: any) {
      console.error('[UploadModal] Upload failed:', error);
      const errorMessage = error?.message || 'Upload failed';
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Add Media to Timeline</DialogTitle>
            <DialogDescription className="text-slate-400">
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
              isDragging ? 'border-[#DC143C] bg-[#DC143C]/10' : 'border-slate-600 bg-slate-700/50'
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
                <Loader2 className="w-8 h-8 animate-spin text-[#DC143C]" />
                <p className="text-sm text-slate-300">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-12 h-12 text-slate-400" />
                <p className="font-medium text-slate-200">Drop files here or click to browse</p>
                <p className="text-sm text-slate-400">
                  Supports video, audio, and images
                </p>
                <div className="text-xs text-slate-500 mt-2 space-y-0.5">
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

