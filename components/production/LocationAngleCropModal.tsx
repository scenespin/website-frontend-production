'use client';

/**
 * LocationAngleCropModal - Interactive crop tool for location angle images
 * 
 * Allows users to set custom 16:9 crop area from square (4096x4096) images
 * Uses react-image-crop for interactive crop selection
 * 
 * Rules:
 * - Fixed 16:9 aspect ratio (no free resize)
 * - No zoom (preserves 4K quality, no downscaling)
 * - Output: 4096x2160 (4K 16:9) from 4096x4096 square source
 * - Future: Support for 21:9 ultrawide and 8K resolution
 * 
 * NOTE: This modal is ONLY shown for Nano Banana Pro images (4096x4096 square, High Quality).
 * Runway Gen-4 images (1920x1080, already 16:9, Standard Quality) cannot be cropped and this option is hidden.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactCrop, { Crop, PixelCrop, makeAspectCrop, centerCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';

interface LocationAngleCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  angleId: string;
  originalImageUrl: string; // Square 4096x4096 image (only square images can be cropped)
  originalS3Key?: string; // S3 key to fetch original if URL not available
  locationId: string;
  screenplayId: string;
  onCropComplete: () => void; // Callback to refresh location data
  // 🔥 FUTURE: 21:9 support - commented out until ultrawide is fully supported
  // defaultAspectRatio?: '16:9' | '21:9'; // Default aspect ratio (defaults to 16:9)
}

export function LocationAngleCropModal({
  isOpen,
  onClose,
  angleId,
  originalImageUrl,
  originalS3Key,
  locationId,
  screenplayId,
  onCropComplete
  // 🔥 FUTURE: defaultAspectRatio = '16:9' - commented out until 21:9 is fully supported
}: LocationAngleCropModalProps) {
  const { getToken } = useAuth();
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  
  // Fixed 16:9 aspect ratio (no zoom, prevents quality loss)
  const aspectRatio = 16 / 9;

  // 🔥 CRITICAL: Always fetch the original 4096x4096 square image from originalS3Key
  // Never use the cropped version - users need to crop from the full square image
  useEffect(() => {
    if (isOpen) {
      const fetchImageUrl = async () => {
        console.log('[LocationAngleCropModal] 🔍 DEBUG: Starting fetchImageUrl', {
          hasOriginalImageUrl: !!originalImageUrl,
          hasOriginalS3Key: !!originalS3Key
        });
        
        setImageLoaded(false);
        setImageError(false);
        setCrop(undefined);
        setCompletedCrop(undefined);

        // 🔥 CRITICAL: Always fetch from originalS3Key to get the original 4096x4096 square image
        // originalImageUrl might be expired, wrong (pointing to cropped version), or missing
        // We MUST use the original square image for cropping, not the pre-cropped 16:9 version
        if (originalS3Key) {
          console.log('[LocationAngleCropModal] 🔍 DEBUG: Fetching ORIGINAL 4096x4096 square image from S3 with key:', originalS3Key.substring(0, 100));
          try {
            const token = await getToken({ template: 'wryda-backend' });
            if (!token) {
              console.error('[LocationAngleCropModal] ❌ Failed to get auth token');
              setImageError(true);
              return;
            }

            const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
            // Use S3 download-url endpoint to get fresh presigned URL for ORIGINAL square image
            const response = await fetch(
              `${BACKEND_API_URL}/api/s3/download-url`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  s3Key: originalS3Key,
                  expiresIn: 3600 // 1 hour expiration for cropping
                })
              }
            );

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              console.error('[LocationAngleCropModal] ❌ Failed to fetch presigned URL:', errorData.message || response.statusText);
              setImageError(true);
              return;
            }

            const data = await response.json();
            if (data.downloadUrl) {
              console.log('[LocationAngleCropModal] ✅ DEBUG: Got presigned URL from S3:', data.downloadUrl.substring(0, 100));
              setImageUrl(data.downloadUrl);
              setImageError(false);
            } else {
              throw new Error('No download URL in response');
            }
          } catch (error: any) {
            console.error('[LocationAngleCropModal] ❌ Failed to fetch image URL:', error);
            setImageError(true);
          }
        } else if (originalImageUrl) {
          // Fallback to originalImageUrl if no S3 key (shouldn't happen, but handle gracefully)
          console.warn('[LocationAngleCropModal] ⚠️ No originalS3Key provided, using originalImageUrl (may be expired or wrong)');
          setImageUrl(originalImageUrl);
        } else {
          console.error('[LocationAngleCropModal] ❌ No originalS3Key or originalImageUrl provided');
          setImageError(true);
        }
      };

      fetchImageUrl();
    }
  }, [isOpen, originalImageUrl, originalS3Key, getToken]);

  // Initialize crop area when image loads (16:9 aspect ratio, centered, 80% of image)
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const { naturalWidth, naturalHeight } = img;
    setImageSize({ width: naturalWidth, height: naturalHeight });
    setImageLoaded(true);
    
    console.log('[LocationAngleCropModal] ✅ Image loaded', {
      width: naturalWidth,
      height: naturalHeight
    });

    // Initialize 16:9 crop area (centered, 80% of image size)
    const crop = makeAspectCrop(
      {
        unit: '%',
        width: 80,
      },
      aspectRatio,
      naturalWidth,
      naturalHeight
    );
    setCrop(centerCrop(crop, naturalWidth, naturalHeight));
  }, [aspectRatio]);

  // Handle save crop button click
  const handleSaveCrop = useCallback(async () => {
    if (!completedCrop || !originalS3Key) {
      toast.error('Please adjust the crop area first');
      return;
    }

    setIsCropping(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
      
      // Convert pixel coordinates (already in pixels from react-image-crop)
      const cropX = Math.round(completedCrop.x);
      const cropY = Math.round(completedCrop.y);
      const cropWidth = Math.round(completedCrop.width);
      const cropHeight = Math.round(completedCrop.height);

      const response = await fetch(
        `${BACKEND_API_URL}/api/location-bank/${locationId}/crop-angle?screenplayId=${screenplayId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            angleId,
            cropX,
            cropY,
            cropWidth,
            cropHeight
            // 🔥 FUTURE: aspectRatio - commented out until 21:9 is fully supported
            // aspectRatio
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to crop image');
      }

      toast.success('Image cropped successfully!');
      onCropComplete();
      onClose();
    } catch (error: any) {
      console.error('Crop failed:', error);
      toast.error(error.message || 'Failed to crop image');
    } finally {
      setIsCropping(false);
    }
  }, [completedCrop, angleId, locationId, screenplayId, originalS3Key, getToken, onCropComplete, onClose]);

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
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#3F3F46]">
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold text-[#FFFFFF]">
                    Custom Crop - 16:9
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-[#808080]">
                    <span>Drag corners/edges to resize • Drag crop area to move</span>
                    <span className="text-[#DC143C]">•</span>
                    <span>No zoom (preserves 4K quality)</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors text-[#808080] hover:text-[#FFFFFF]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Crop Area */}
              <div className="flex-1 relative bg-[#141414] min-h-[500px] h-[500px] overflow-auto">
                {imageError && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-[#DC143C]">
                      Failed to load image. Please try again.
                      <br />
                      <span className="text-xs text-[#808080] mt-2 block">
                        S3 Key: {originalS3Key ? originalS3Key.substring(0, 50) : 'None'}
                      </span>
                    </div>
                  </div>
                )}
                {!imageLoaded && !imageError && !imageUrl && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-[#808080]">Loading image...</div>
                  </div>
                )}
                {imageUrl && !imageError && (
                  <div className="flex items-center justify-center p-4 min-h-full">
                    {!imageLoaded && (
                      <div className="text-[#808080]">Loading image...</div>
                    )}
                    {/* Always render image (hidden if not loaded) to trigger onLoad */}
                    <img
                      ref={imgRef}
                      src={imageUrl}
                      alt="Crop"
                      onLoad={onImageLoad}
                      onError={async () => {
                        console.error('Failed to load image, attempting to fetch fresh presigned URL:', imageUrl);
                        if (originalS3Key) {
                          try {
                            const token = await getToken({ template: 'wryda-backend' });
                            if (token) {
                              const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
                              const response = await fetch(
                                `${BACKEND_API_URL}/api/s3/download-url`,
                                {
                                  method: 'POST',
                                  headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                  },
                                  body: JSON.stringify({
                                    s3Key: originalS3Key,
                                    expiresIn: 3600
                                  })
                                }
                              );

                              if (response.ok) {
                                const data = await response.json();
                                setImageUrl(data.downloadUrl || '');
                                setImageError(false);
                                return;
                              }
                            }
                          } catch (error) {
                            console.error('Error fetching fresh presigned URL:', error);
                          }
                        }
                        setImageError(true);
                        setImageLoaded(false);
                      }}
                      style={{ 
                        maxWidth: imageLoaded ? '100%' : '0',
                        maxHeight: imageLoaded ? '500px' : '0',
                        display: imageLoaded ? 'block' : 'none'
                      }}
                    />
                    {/* Show ReactCrop once image is loaded and crop is initialized */}
                    {imageLoaded && crop && (
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <ReactCrop
                          crop={crop}
                          onChange={(_, percentCrop) => setCrop(percentCrop)}
                          onComplete={(c) => setCompletedCrop(c)}
                          aspect={aspectRatio}
                          className="max-w-full max-h-full"
                        >
                          <img
                            src={imageUrl}
                            alt="Crop"
                            style={{ maxWidth: '100%', maxHeight: '500px', display: 'block' }}
                          />
                        </ReactCrop>
                      </div>
                    )}
                  </div>
                )}
                {/* Helper text overlay */}
                {imageLoaded && !completedCrop && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-2 rounded-lg pointer-events-none text-center z-10">
                    <div>Drag crop corners/edges to resize • Drag crop area to move</div>
                    <div className="text-[#DC143C] mt-1">16:9 aspect ratio • Output: 4096x2160 (4K)</div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#3F3F46] space-y-4">
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-[#141414] border border-[#3F3F46] hover:bg-[#1F1F1F] text-[#FFFFFF] rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCrop}
                    disabled={isCropping || !imageLoaded || !completedCrop}
                    className="flex-1 px-4 py-2 bg-[#DC143C] hover:bg-[#DC143C]/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCropping ? 'Cropping...' : 'Save Crop'}
                  </button>
                </div>
                <p className="text-xs text-[#6B7280] text-center">
                  Drag to reposition • Drag corners/edges to resize • Crop area: 16:9 (Widescreen) • Output: 4K (4096x2160)
                  {/* 🔥 FUTURE: {aspectRatio === '21:9' ? 'Ultrawide' : 'Widescreen'} • Future: 8K support */}
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
