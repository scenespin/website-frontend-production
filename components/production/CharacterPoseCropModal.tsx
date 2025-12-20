'use client';

/**
 * CharacterPoseCropModal - Interactive crop tool for character pose images
 * 
 * Allows users to crop character poses to remove artifacts (e.g., multiple people)
 * Supports free resizing (no aspect ratio lock), no zoom (prevents quality loss)
 * Uses react-image-crop for interactive crop selection with free resize support
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactCrop, { Crop, PixelCrop, makeAspectCrop, centerCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';

interface CharacterPoseCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  poseId: string; // Pose reference ID
  poseS3Key: string; // S3 key of the pose image to crop
  characterId: string;
  screenplayId: string;
  onCropComplete: () => void; // Callback to refresh character data
}

export function CharacterPoseCropModal({
  isOpen,
  onClose,
  poseId,
  poseS3Key,
  characterId,
  screenplayId,
  onCropComplete
}: CharacterPoseCropModalProps) {
  const { getToken } = useAuth();
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined); // undefined = free resize
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // Fetch image URL from S3 key
  useEffect(() => {
    if (isOpen && poseS3Key) {
      const fetchImageUrl = async () => {
        setImageLoaded(false);
        setImageError(false);
        setCrop(undefined);
        setCompletedCrop(undefined);

        try {
          const token = await getToken({ template: 'wryda-backend' });
          if (!token) {
            console.error('[CharacterPoseCropModal] ❌ Failed to get auth token');
            setImageError(true);
            return;
          }

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
                s3Key: poseS3Key,
                expiresIn: 3600
              })
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to get image URL: ${response.status}`);
          }

          const data = await response.json();
          if (data.downloadUrl) {
            setImageUrl(data.downloadUrl);
          } else {
            throw new Error('No download URL in response');
          }
        } catch (error: any) {
          console.error('[CharacterPoseCropModal] ❌ Failed to fetch image URL:', error);
          setImageError(true);
        }
      };

      fetchImageUrl();
    }
  }, [isOpen, poseS3Key, getToken]);

  // Initialize crop area when image loads
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const { naturalWidth, naturalHeight } = img;
    setImageSize({ width: naturalWidth, height: naturalHeight });
    setImageLoaded(true);
    
    console.log('[CharacterPoseCropModal] ✅ Image loaded', {
      width: naturalWidth,
      height: naturalHeight
    });

    // Initialize crop area (center, 80% of image size)
    if (aspectRatio) {
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
    } else {
      // Free resize - start with 80% centered crop
      setCrop({
        unit: '%',
        x: 10,
        y: 10,
        width: 80,
        height: 80
      });
    }
  }, [aspectRatio]);

  const handleCrop = useCallback(async () => {
    if (!completedCrop || !poseS3Key || !imgRef.current) {
      toast.error('Please select a crop area');
      return;
    }

    // Validate crop coordinates
    if (!imageSize.width || !imageSize.height) {
      toast.error('Image dimensions not loaded. Please try again.');
      return;
    }

    // PixelCrop coordinates are already relative to natural image size
    // But we need to ensure they're valid
    const cropX = Math.max(0, Math.min(Math.round(completedCrop.x), imageSize.width - 1));
    const cropY = Math.max(0, Math.min(Math.round(completedCrop.y), imageSize.height - 1));
    const cropWidth = Math.max(1, Math.min(Math.round(completedCrop.width), imageSize.width - cropX));
    const cropHeight = Math.max(1, Math.min(Math.round(completedCrop.height), imageSize.height - cropY));

    // Get current image dimensions for verification
    const img = imgRef.current;
    const displayWidth = img?.width || 0;
    const displayHeight = img?.height || 0;
    const naturalWidth = img?.naturalWidth || imageSize.width;
    const naturalHeight = img?.naturalHeight || imageSize.height;
    const scaleX = naturalWidth / (displayWidth || 1);
    const scaleY = naturalHeight / (displayHeight || 1);
    
    console.log('[CharacterPoseCropModal] Crop coordinates:', {
      original: {
        x: completedCrop.x,
        y: completedCrop.y,
        width: completedCrop.width,
        height: completedCrop.height
      },
      validated: {
        x: cropX,
        y: cropY,
        width: cropWidth,
        height: cropHeight
      },
      imageDimensions: {
        natural: { width: naturalWidth, height: naturalHeight },
        display: { width: displayWidth, height: displayHeight },
        scale: { x: scaleX, y: scaleY }
      },
      imageSize,
      // Verify coordinates make sense
      coordinateCheck: {
        cropXPercent: (cropX / naturalWidth * 100).toFixed(2) + '%',
        cropYPercent: (cropY / naturalHeight * 100).toFixed(2) + '%',
        cropWidthPercent: (cropWidth / naturalWidth * 100).toFixed(2) + '%',
        cropHeightPercent: (cropHeight / naturalHeight * 100).toFixed(2) + '%',
        fitsInImage: cropX + cropWidth <= naturalWidth && cropY + cropHeight <= naturalHeight
      }
    });

    setIsCropping(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        throw new Error('Not authenticated');
      }

      const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
      
      const requestBody = {
        poseId,
        poseS3Key,
        screenplayId,
        cropX,
        cropY,
        cropWidth,
        cropHeight
      };
      
      console.log('[CharacterPoseCropModal] Sending crop request:', {
        url: `${BACKEND_API_URL}/api/screenplays/${screenplayId}/characters/${characterId}/crop-pose`,
        body: requestBody,
        imageSize
      });
      
      const response = await fetch(
        `${BACKEND_API_URL}/api/screenplays/${screenplayId}/characters/${characterId}/crop-pose`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );
      
      console.log('[CharacterPoseCropModal] Crop response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to crop pose: ${response.status}`);
      }

      toast.success('Pose cropped successfully');
      onCropComplete();
      onClose();
    } catch (error: any) {
      console.error('[CharacterPoseCropModal] ❌ Crop failed:', error);
      toast.error(error.message || 'Failed to crop pose');
    } finally {
      setIsCropping(false);
    }
  }, [completedCrop, poseId, poseS3Key, characterId, screenplayId, getToken, onCropComplete, onClose]);

  // Update crop when aspect ratio changes
  useEffect(() => {
    if (imageLoaded && imgRef.current && imageSize.width > 0 && imageSize.height > 0) {
      if (aspectRatio) {
        const newCrop = makeAspectCrop(
          {
            unit: '%',
            width: 80,
          },
          aspectRatio,
          imageSize.width,
          imageSize.height
        );
        setCrop(centerCrop(newCrop, imageSize.width, imageSize.height));
      } else {
        // Free resize - reset to 80% centered
        setCrop({
          unit: '%',
          x: 10,
          y: 10,
          width: 80,
          height: 80
        });
      }
      setCompletedCrop(undefined);
    }
  }, [aspectRatio, imageLoaded, imageSize]);

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
                    Crop Pose
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-[#808080]">
                    <span>Drag corners/edges to resize crop area</span>
                    <span className="text-[#DC143C]">•</span>
                    <span>Drag crop area to move it</span>
                    <span className="text-[#DC143C]">•</span>
                    <span>No zoom (prevents quality loss)</span>
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
                        S3 Key: {poseS3Key ? poseS3Key.substring(0, 50) : 'None'}
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
                    {/* Render image once - ReactCrop will wrap it when loaded */}
                    {imageLoaded && crop ? (
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <ReactCrop
                          crop={crop}
                          onChange={(_, percentCrop) => setCrop(percentCrop)}
                          onComplete={(c) => {
                            const img = imgRef.current;
                            if (!img) {
                              console.error('[CharacterPoseCropModal] ❌ imgRef.current is null in onComplete');
                              return;
                            }
                            
                            // Verify coordinates are in natural image space
                            const scaleX = img.naturalWidth / (img.width || 1);
                            const scaleY = img.naturalHeight / (img.height || 1);
                            
                            // CRITICAL: Verify ReactCrop is using natural coordinates
                            // PixelCrop should already be in natural image coordinates
                            // But let's verify the image dimensions match
                            const dimensionMismatch = 
                              Math.abs(img.naturalWidth - imageSize.width) > 1 ||
                              Math.abs(img.naturalHeight - imageSize.height) > 1;
                            
                            console.log('[CharacterPoseCropModal] Crop completed:', {
                              pixelCrop: c,
                              naturalSize: {
                                width: img.naturalWidth,
                                height: img.naturalHeight
                              },
                              displaySize: {
                                width: img.width,
                                height: img.height
                              },
                              scale: { x: scaleX, y: scaleY },
                              imageSize,
                              dimensionMismatch,
                              // Verify: PixelCrop should already be in natural coordinates
                              verification: {
                                cropXInBounds: c.x >= 0 && c.x <= img.naturalWidth,
                                cropYInBounds: c.y >= 0 && c.y <= img.naturalHeight,
                                cropWidthInBounds: c.width > 0 && c.width <= img.naturalWidth,
                                cropHeightInBounds: c.height > 0 && c.height <= img.naturalHeight,
                                // Check if coordinates seem reasonable (not zoomed/scaled incorrectly)
                                cropAreaPercent: {
                                  x: (c.x / img.naturalWidth * 100).toFixed(1) + '%',
                                  y: (c.y / img.naturalHeight * 100).toFixed(1) + '%',
                                  width: (c.width / img.naturalWidth * 100).toFixed(1) + '%',
                                  height: (c.height / img.naturalHeight * 100).toFixed(1) + '%'
                                }
                              }
                            });
                            
                            if (dimensionMismatch) {
                              console.warn('[CharacterPoseCropModal] ⚠️ Image dimension mismatch detected!', {
                                naturalSize: { width: img.naturalWidth, height: img.naturalHeight },
                                imageSize
                              });
                            }
                            
                            setCompletedCrop(c);
                          }}
                          aspect={aspectRatio}
                          className="max-w-full max-h-full"
                        >
                          <img
                            ref={imgRef}
                            src={imageUrl}
                            alt="Crop"
                            onError={async () => {
                              console.error('Failed to load image, attempting to fetch fresh presigned URL:', imageUrl);
                              if (poseS3Key) {
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
                                          s3Key: poseS3Key,
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
                              maxWidth: '100%', 
                              maxHeight: '500px', 
                              display: 'block',
                              width: 'auto',
                              height: 'auto'
                            }}
                          />
                        </ReactCrop>
                      </div>
                    ) : (
                      <img
                        ref={imgRef}
                        src={imageUrl}
                        alt="Crop"
                        onLoad={onImageLoad}
                        onError={async () => {
                          console.error('Failed to load image, attempting to fetch fresh presigned URL:', imageUrl);
                          if (poseS3Key) {
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
                                      s3Key: poseS3Key,
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
                          maxWidth: '100%', 
                          maxHeight: '500px', 
                          display: 'block',
                          width: 'auto',
                          height: 'auto'
                        }}
                      />
                    )}
                  </div>
                )}
                {/* Helper text overlay */}
                {imageLoaded && !completedCrop && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-2 rounded-lg pointer-events-none text-center z-10">
                    <div>Drag crop corners/edges to resize • Drag crop area to move</div>
                    <div className="text-[#DC143C] mt-1">Select exactly what you want to keep</div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-4 border-t border-[#3F3F46]">
                {/* Aspect Ratio Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#808080]">Aspect:</span>
                  <select
                    value={aspectRatio === undefined ? 'free' : (aspectRatio === 1 ? '1' : aspectRatio === 16/9 ? '16/9' : aspectRatio === 4/3 ? '4/3' : aspectRatio === 3/4 ? '3/4' : 'free')}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'free') {
                        setAspectRatio(undefined);
                      } else if (value === '1') {
                        setAspectRatio(1);
                      } else if (value === '16/9') {
                        setAspectRatio(16 / 9);
                      } else if (value === '4/3') {
                        setAspectRatio(4 / 3);
                      } else if (value === '3/4') {
                        setAspectRatio(3 / 4);
                      }
                    }}
                    className="bg-[#1F1F1F] border border-[#3F3F46] text-[#FFFFFF] text-xs px-2 py-1 rounded"
                  >
                    <option value="free">Free (resize freely)</option>
                    <option value="1">1:1 (Square)</option>
                    <option value="16/9">16:9 (Widescreen)</option>
                    <option value="4/3">4:3 (Standard)</option>
                    <option value="3/4">3:4 (Portrait)</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    disabled={isCropping}
                    className="px-4 py-2 text-[#808080] hover:text-[#FFFFFF] transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCrop}
                    disabled={isCropping || !completedCrop}
                    className="px-4 py-2 bg-[#DC143C] text-white rounded-lg hover:bg-[#B91C1C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCropping ? 'Cropping...' : 'Apply Crop'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
