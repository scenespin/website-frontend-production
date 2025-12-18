'use client';

/**
 * CharacterPoseCropModal - Interactive crop tool for character pose images
 * 
 * Allows users to crop character poses to remove artifacts (e.g., multiple people)
 * Maintains aspect ratio, no zoom (prevents quality loss), allows panning
 * Uses react-easy-crop for interactive crop selection
 */

import React, { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Cropper from 'react-easy-crop';
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

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
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
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom] = useState(1); // Locked at 1 (no zoom to prevent quality loss)
  const [isCropping, setIsCropping] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(1); // Will be calculated from image

  // Fetch image URL from S3 key
  useEffect(() => {
    if (isOpen && poseS3Key) {
      const fetchImageUrl = async () => {
        setImageLoaded(false);
        setImageError(false);
        setCrop({ x: 0, y: 0 });
        setCroppedAreaPixels(null);

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

  // Calculate aspect ratio from image when loaded
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    setImageAspectRatio(aspectRatio);
    setImageLoaded(true);
    console.log('[CharacterPoseCropModal] ✅ Image loaded', {
      width: img.naturalWidth,
      height: img.naturalHeight,
      aspectRatio
    });
  }, []);

  const onCropCompleteCallback = useCallback((croppedArea: CropArea, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = useCallback(async () => {
    if (!croppedAreaPixels || !poseS3Key) {
      toast.error('Please select a crop area');
      return;
    }

    setIsCropping(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        throw new Error('Not authenticated');
      }

      const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
      const response = await fetch(
        `${BACKEND_API_URL}/api/screenplays/${screenplayId}/characters/${characterId}/crop-pose`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            poseId,
            poseS3Key,
            screenplayId,
            cropX: Math.round(croppedAreaPixels.x),
            cropY: Math.round(croppedAreaPixels.y),
            cropWidth: Math.round(croppedAreaPixels.width),
            cropHeight: Math.round(croppedAreaPixels.height)
          })
        }
      );

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
  }, [croppedAreaPixels, poseId, poseS3Key, characterId, screenplayId, getToken, onCropComplete, onClose]);

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
                    <span>Click and drag the image to pan and select crop area</span>
                    <span className="text-[#DC143C]">•</span>
                    <span>Maintains aspect ratio</span>
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
              <div className="flex-1 relative bg-[#141414] min-h-[500px] h-[500px]">
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
                  <>
                    {/* Hidden image to detect load errors and calculate aspect ratio */}
                    <img
                      src={imageUrl}
                      alt=""
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
                      onLoad={handleImageLoad}
                      style={{ display: 'none' }}
                    />
                    {imageLoaded && imageUrl && (
                      <div className="absolute inset-0">
                        <Cropper
                          image={imageUrl}
                          crop={crop}
                          zoom={zoom}
                          aspect={imageAspectRatio} // Maintain original aspect ratio
                          onCropChange={setCrop}
                          onCropComplete={onCropCompleteCallback}
                          cropShape="rect"
                          showGrid={true}
                          restrictPosition={true}
                          style={{
                            containerStyle: {
                              width: '100%',
                              height: '100%',
                              position: 'relative',
                              cursor: 'grab'
                            },
                            cropAreaStyle: {
                              border: '2px solid #DC143C',
                              borderRadius: '4px',
                              cursor: 'move'
                            },
                            mediaStyle: {
                              cursor: 'grab'
                            }
                          }}
                        />
                        {/* Helper text overlay */}
                        {!croppedAreaPixels && (
                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-2 rounded-lg pointer-events-none">
                            Click and drag the image to position it
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-4 border-t border-[#3F3F46]">
                <button
                  onClick={onClose}
                  disabled={isCropping}
                  className="px-4 py-2 text-[#808080] hover:text-[#FFFFFF] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCrop}
                  disabled={isCropping || !croppedAreaPixels}
                  className="px-4 py-2 bg-[#DC143C] text-white rounded-lg hover:bg-[#B91C1C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCropping ? 'Cropping...' : 'Apply Crop'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

