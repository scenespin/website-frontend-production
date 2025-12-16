'use client';

/**
 * LocationAngleCropModal - Interactive crop tool for location angle images
 * 
 * Allows users to set custom 16:9 crop area from square (4096x4096) images
 * Uses react-easy-crop for interactive crop selection
 */

import React, { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Cropper from 'react-easy-crop';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';

interface LocationAngleCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  angleId: string;
  originalImageUrl: string; // Square 4096x4096 image
  originalS3Key?: string; // S3 key to fetch original if URL not available
  locationId: string;
  screenplayId: string;
  onCropComplete: () => void; // Callback to refresh location data
  // 🔥 FUTURE: 21:9 support - commented out until ultrawide is fully supported
  // defaultAspectRatio?: '16:9' | '21:9'; // Default aspect ratio (defaults to 16:9)
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
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
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isCropping, setIsCropping] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageUrl, setImageUrl] = useState(originalImageUrl);
  const [imageError, setImageError] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  // 🔥 FUTURE: 21:9 support - commented out until ultrawide is fully supported
  // const [aspectRatio, setAspectRatio] = useState<'16:9' | '21:9'>(defaultAspectRatio);
  const aspectRatio: '16:9' | '21:9' = '16:9'; // Only 16:9 supported for now

  // Fetch fresh presigned URL from S3 if originalImageUrl is missing or expired
  useEffect(() => {
    if (isOpen) {
      const fetchImageUrl = async () => {
        console.log('[LocationAngleCropModal] 🔍 DEBUG: Starting fetchImageUrl', {
          hasOriginalImageUrl: !!originalImageUrl,
          hasOriginalS3Key: !!originalS3Key
        });
        
        setImageLoaded(false);
        setImageError(false);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);

        // 🔥 FIX: Always try to fetch from S3 if we have originalS3Key, even if originalImageUrl exists
        // originalImageUrl might be expired or empty, so prefer fetching fresh URL from S3
        if (originalS3Key) {
          console.log('[LocationAngleCropModal] 🔍 DEBUG: Fetching from S3 with key:', originalS3Key.substring(0, 100));
          try {
            const token = await getToken({ template: 'wryda-backend' });
            if (!token) {
              // Fallback to originalImageUrl if token fetch fails
              if (originalImageUrl && originalImageUrl.startsWith('http')) {
                setImageUrl(originalImageUrl);
                return;
              }
              setImageError(true);
              return;
            }

            const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
            // Use S3 download-url endpoint to get fresh presigned URL
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
                  expiresIn: 3600 // 1 hour
                })
              }
            );

            if (response.ok) {
              const data = await response.json();
              const newUrl = data.downloadUrl || '';
              console.log('[LocationAngleCropModal] ✅ DEBUG: Got presigned URL from S3:', newUrl ? `${newUrl.substring(0, 50)}...` : 'empty');
              setImageUrl(newUrl);
            } else {
              const errorData = await response.json().catch(() => ({ message: 'Failed to fetch presigned URL' }));
              console.error('[LocationAngleCropModal] Failed to fetch presigned URL:', errorData.message || response.statusText);
              // Fallback to originalImageUrl if S3 fetch fails
              if (originalImageUrl && originalImageUrl.startsWith('http')) {
                console.log('[LocationAngleCropModal] Falling back to originalImageUrl');
                setImageUrl(originalImageUrl);
              } else {
                setImageError(true);
              }
            }
          } catch (error) {
            console.error('[LocationAngleCropModal] Error fetching presigned URL:', error);
            // Fallback to originalImageUrl if error occurs
            if (originalImageUrl && originalImageUrl.startsWith('http')) {
              console.log('[LocationAngleCropModal] Falling back to originalImageUrl after error');
              setImageUrl(originalImageUrl);
            } else {
              setImageError(true);
            }
          }
        } else if (originalImageUrl && originalImageUrl.startsWith('http')) {
          // No S3 key but we have a valid URL - use it
          console.log('[LocationAngleCropModal] 🔍 DEBUG: Using originalImageUrl directly:', originalImageUrl.substring(0, 50));
          setImageUrl(originalImageUrl);
        } else if (originalS3Key) {
          // 🔥 FIX: If we have originalS3Key but didn't try fetching yet (shouldn't happen, but safety check)
          console.log('[LocationAngleCropModal] 🔍 DEBUG: Retrying with originalS3Key:', originalS3Key.substring(0, 50));
          // This will be handled by the S3 fetch logic above, but adding as fallback
          // Actually, if we get here, originalS3Key should have been handled above
          // So this is just for safety - try to fetch one more time
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
              } else {
                setImageError(true);
              }
            } else {
              setImageError(true);
            }
          } catch (error) {
            console.error('[LocationAngleCropModal] Error in fallback fetch:', error);
            setImageError(true);
          }
        } else {
          // No URL and no S3 key - show error
          console.error('[LocationAngleCropModal] ❌ DEBUG: No image URL or S3 key available', {
            originalImageUrl: originalImageUrl || 'empty',
            originalS3Key: originalS3Key || 'empty',
            angleId
          });
          setImageError(true);
        }
      };

      fetchImageUrl();
    }
  }, [isOpen, originalImageUrl, originalS3Key, getToken]);

  // Store crop area when user adjusts it
  const onCropCompleteCallback = useCallback((croppedArea: CropArea, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Handle save crop button click
  const handleSaveCrop = useCallback(async () => {
    if (!croppedAreaPixels) {
      toast.error('Please adjust the crop area first');
      return;
    }

    setIsCropping(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Not authenticated');

      const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
      
      // Convert relative coordinates to absolute pixels
      const cropX = Math.round(croppedAreaPixels.x);
      const cropY = Math.round(croppedAreaPixels.y);
      const cropWidth = Math.round(croppedAreaPixels.width);
      const cropHeight = Math.round(croppedAreaPixels.height);

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
  }, [croppedAreaPixels, angleId, locationId, screenplayId, getToken, onCropComplete, onClose]);

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
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold text-[#FFFFFF]">
                    Custom Crop - 16:9
                  </h2>
                  {/* 🔥 FUTURE: Aspect Ratio Selector - commented out until 21:9 ultrawide is fully supported
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAspectRatio('16:9')}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        aspectRatio === '16:9'
                          ? 'bg-[#DC143C] text-white'
                          : 'bg-[#141414] text-[#808080] hover:text-[#FFFFFF]'
                      }`}
                    >
                      16:9
                    </button>
                    <button
                      onClick={() => setAspectRatio('21:9')}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        aspectRatio === '21:9'
                          ? 'bg-[#DC143C] text-white'
                          : 'bg-[#141414] text-[#808080] hover:text-[#FFFFFF]'
                      }`}
                    >
                      21:9
                    </button>
                  </div>
                  */}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors text-[#808080] hover:text-[#FFFFFF]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Crop Area */}
              <div className="flex-1 relative bg-[#141414] min-h-[400px]">
                {/* 🔥 DEBUG: Show state info */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="absolute top-2 left-2 z-50 bg-black/80 text-white text-xs p-2 rounded">
                    <div>imageUrl: {imageUrl ? 'SET' : 'EMPTY'}</div>
                    <div>imageLoaded: {imageLoaded ? 'YES' : 'NO'}</div>
                    <div>imageError: {imageError ? 'YES' : 'NO'}</div>
                    <div>originalS3Key: {originalS3Key ? 'SET' : 'EMPTY'}</div>
                    <div>originalImageUrl: {originalImageUrl ? 'SET' : 'EMPTY'}</div>
                  </div>
                )}
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
                  <>
                    {/* Hidden image to detect load errors and fetch fresh URL if expired */}
                    <img
                      src={imageUrl}
                      alt=""
                      onError={async () => {
                        console.error('Failed to load image, attempting to fetch fresh presigned URL:', imageUrl);
                        // If image fails to load and we have originalS3Key, try fetching fresh URL
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
                                return; // Retry with fresh URL
                              }
                            }
                          } catch (error) {
                            console.error('Error fetching fresh presigned URL:', error);
                          }
                        }
                        // If we get here, couldn't fetch fresh URL or no S3 key
                        setImageError(true);
                        setImageLoaded(false);
                      }}
                      onLoad={() => {
                        console.log('[LocationAngleCropModal] ✅ DEBUG: Hidden image loaded successfully');
                        setImageLoaded(true);
                      }}
                      style={{ display: 'none' }}
                    />
                    {imageLoaded && (
                      <Cropper
                          image={imageUrl}
                          crop={crop}
                          zoom={zoom}
                          aspect={16 / 9} // Fixed 16:9 aspect ratio (21:9 commented out)
                          onCropChange={setCrop}
                          onZoomChange={setZoom}
                          onCropComplete={onCropCompleteCallback}
                          onMediaLoaded={() => {
                            console.log('[LocationAngleCropModal] ✅ DEBUG: Cropper media loaded');
                            setImageLoaded(true);
                          }}
                          style={{
                            containerStyle: {
                              width: '100%',
                              height: '100%',
                              position: 'relative'
                            }
                          }}
                        />
                    )}
                    {!imageLoaded && imageUrl && !imageError && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-[#808080]">
                          Loading image... ({imageUrl ? 'URL set' : 'No URL'})
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Controls */}
              <div className="p-4 border-t border-[#3F3F46] space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-[#808080]">Zoom</label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-[#141414] border border-[#3F3F46] hover:bg-[#1F1F1F] text-[#FFFFFF] rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCrop}
                    disabled={isCropping || !imageLoaded || !croppedAreaPixels}
                    className="flex-1 px-4 py-2 bg-[#DC143C] hover:bg-[#DC143C]/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCropping ? 'Cropping...' : 'Save Crop'}
                  </button>
                </div>
                <p className="text-xs text-[#6B7280] text-center">
                  Drag to reposition • Use zoom to fine-tune • Crop area: 16:9 (Widescreen)
                  {/* 🔥 FUTURE: {aspectRatio === '21:9' ? 'Ultrawide' : 'Widescreen'} */}
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

