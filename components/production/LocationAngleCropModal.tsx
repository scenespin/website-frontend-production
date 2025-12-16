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

  // Reset state when modal opens/closes or image URL changes
  useEffect(() => {
    if (isOpen) {
      setImageUrl(originalImageUrl || '');
      setImageLoaded(false);
      setImageError(false);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [isOpen, originalImageUrl]);

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
                {imageError && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-[#DC143C]">Failed to load image. Please try again.</div>
                  </div>
                )}
                {!imageLoaded && !imageError && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-[#808080]">Loading image...</div>
                  </div>
                )}
                {imageUrl && !imageError && (
                  <Cropper
                    image={imageUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={16 / 9} // Fixed 16:9 aspect ratio (21:9 commented out)
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropCompleteCallback}
                    onMediaLoaded={() => setImageLoaded(true)}
                    onError={() => {
                      console.error('Cropper failed to load image:', imageUrl);
                      setImageError(true);
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

