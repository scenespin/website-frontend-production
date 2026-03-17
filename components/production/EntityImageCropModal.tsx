'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { toast } from 'sonner';

interface EntityImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageS3Key: string;
  endpointUrl: string;
  payload: Record<string, unknown>;
  title: string;
  onCropComplete: () => Promise<void> | void;
}

export function EntityImageCropModal({
  isOpen,
  onClose,
  imageS3Key,
  endpointUrl,
  payload,
  title,
  onCropComplete,
}: EntityImageCropModalProps) {
  const { getToken } = useAuth();
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!isOpen || !imageS3Key) return;
    const load = async () => {
      setIsLoadingImage(true);
      setImageError(false);
      setCrop(undefined);
      setCompletedCrop(undefined);
      try {
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) throw new Error('Authentication required');
        const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
        const response = await fetch(`${BACKEND_API_URL}/api/s3/download-url`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ s3Key: imageS3Key, expiresIn: 3600 }),
        });
        if (!response.ok) throw new Error(`Failed to load image: ${response.status}`);
        const data = await response.json();
        if (!data.downloadUrl) throw new Error('No download URL');
        setImageUrl(data.downloadUrl);
      } catch (error) {
        setImageError(true);
      } finally {
        setIsLoadingImage(false);
      }
    };
    void load();
  }, [getToken, imageS3Key, isOpen]);

  const handleApplyCrop = useCallback(async () => {
    if (!completedCrop || completedCrop.width < 1 || completedCrop.height < 1 || !imgRef.current) {
      toast.error('Select a crop area first');
      return;
    }
    const img = imgRef.current;
    const scaleX = img.naturalWidth / Math.max(1, img.width);
    const scaleY = img.naturalHeight / Math.max(1, img.height);
    const cropX = Math.round(completedCrop.x * scaleX);
    const cropY = Math.round(completedCrop.y * scaleY);
    const cropWidth = Math.max(1, Math.round(completedCrop.width * scaleX));
    const cropHeight = Math.max(1, Math.round(completedCrop.height * scaleY));

    setIsCropping(true);
    try {
      const token = await getToken({ template: 'wryda-backend' });
      if (!token) throw new Error('Authentication required');
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          imageS3Key,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Crop failed (${response.status})`);
      }

      toast.success('Image cropped successfully');
      await onCropComplete();
      onClose();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to crop image');
    } finally {
      setIsCropping(false);
    }
  }, [completedCrop, endpointUrl, getToken, imageS3Key, onClose, onCropComplete, payload]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-[#3F3F46]">
            <h2 className="text-lg font-semibold text-[#FFFFFF]">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors text-[#808080] hover:text-[#FFFFFF]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 relative bg-[#141414] min-h-[500px] overflow-hidden flex items-center justify-center">
            {isLoadingImage && <div className="text-[#808080]">Loading image...</div>}
            {imageError && (
              <div className="text-[#DC143C] text-sm text-center px-6">
                Failed to load image. Please close and try again.
              </div>
            )}
            {!isLoadingImage && !imageError && imageUrl && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
                aspect={aspectRatio}
                className="max-w-full max-h-full"
              >
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Crop preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </ReactCrop>
            )}
          </div>

          <div className="flex items-center justify-between p-4 border-t border-[#3F3F46]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#808080]">Aspect:</span>
              <select
                value={
                  aspectRatio === undefined
                    ? 'free'
                    : aspectRatio === 1
                      ? '1'
                      : aspectRatio === 16 / 9
                        ? '16/9'
                        : aspectRatio === 4 / 3
                          ? '4/3'
                          : 'free'
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'free') setAspectRatio(undefined);
                  if (value === '1') setAspectRatio(1);
                  if (value === '16/9') setAspectRatio(16 / 9);
                  if (value === '4/3') setAspectRatio(4 / 3);
                  setCompletedCrop(undefined);
                }}
                className="select select-bordered bg-[#1F1F1F] border border-[#3F3F46] text-[#FFFFFF] text-xs h-7 px-2 focus:outline-none focus:ring-2 focus:ring-[#DC143C] focus:border-[#DC143C]"
              >
                <option value="free" className="bg-[#1F1F1F] text-[#FFFFFF]">Free</option>
                <option value="1" className="bg-[#1F1F1F] text-[#FFFFFF]">1:1</option>
                <option value="16/9" className="bg-[#1F1F1F] text-[#FFFFFF]">16:9</option>
                <option value="4/3" className="bg-[#1F1F1F] text-[#FFFFFF]">4:3</option>
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
                onClick={handleApplyCrop}
                disabled={isCropping || !completedCrop}
                className="px-4 py-2 bg-[#DC143C] text-white rounded-lg hover:bg-[#B91C1C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCropping ? 'Cropping...' : 'Apply Crop'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
