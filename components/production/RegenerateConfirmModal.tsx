'use client';

/**
 * RegenerateConfirmModal - Warning modal before regenerating images
 * 
 * Shows a warning that regeneration will replace the existing image.
 * User can cancel or proceed with regeneration.
 */

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RegenerateConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  imageType?: 'pose' | 'angle' | 'asset'; // Type of image being regenerated
}

export function RegenerateConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  imageType = 'angle'
}: RegenerateConfirmModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#1A1A1A] border border-[#3F3F46] rounded-lg shadow-xl max-w-md w-full p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#DC143C]/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-[#DC143C]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Regenerate {imageType === 'pose' ? 'Pose' : imageType === 'angle' ? 'Angle' : imageType === 'asset' ? 'Asset' : 'Image'}?
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-[#9CA3AF] hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Message */}
              <div className="mb-6">
                <p className="text-[#D1D5DB] text-sm leading-relaxed">
                  ⚠️ Regenerating this {imageType === 'pose' ? 'pose' : imageType === 'angle' ? 'angle' : imageType === 'asset' ? 'asset angle' : 'image'} will replace the existing one. The current image will be overwritten.
                </p>
                <p className="text-[#9CA3AF] text-sm mt-3">
                  If you'd like to keep it, please download it before regenerating.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-[#D1D5DB] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 text-sm font-medium bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg transition-colors"
                >
                  Continue & Regenerate
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

