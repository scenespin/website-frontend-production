'use client';

/**
 * CharacterStudioModal - Main modal for Character Studio
 * 
 * Features:
 * - Two tabs: AI Generation and Upload Images
 * - Outfit management
 * - Image upload and Media Library browsing
 * - Pose guidance system
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIGenerationTab } from './AIGenerationTab';
import { UploadImagesTab } from './UploadImagesTab';
import type { CharacterReference } from '../types';

interface CharacterStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string;
  characterName: string;
  screenplayId: string;
  existingReferences?: CharacterReference[];
  onComplete?: (result: { outfitName: string; images: string[] }) => void;
}

export function CharacterStudioModal({
  isOpen,
  onClose,
  characterId,
  characterName,
  screenplayId,
  existingReferences = [],
  onComplete
}: CharacterStudioModalProps) {
  const [activeTab, setActiveTab] = useState<'ai-generation' | 'upload-images'>('upload-images');

  const handleComplete = (result: { outfitName: string; images: string[] }) => {
    if (onComplete) {
      onComplete(result);
    }
    // Close modal after completion
    onClose();
  };

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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-4xl max-h-[90vh] bg-[#0A0A0A] border border-[#3F3F46] rounded-lg shadow-xl flex flex-col pointer-events-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#3F3F46]">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Character Studio</h2>
                  <p className="text-sm text-[#808080] mt-1">
                    Upload and organize character images for {characterName}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-[#808080] hover:text-white transition-colors p-2 hover:bg-[#1F1F1F] rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 px-6 pt-4 border-b border-[#3F3F46]">
                <button
                  onClick={() => setActiveTab('ai-generation')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'ai-generation'
                      ? 'bg-[#DC143C] text-white'
                      : 'bg-[#1F1F1F] text-[#808080] hover:bg-[#2A2A2A] hover:text-[#FFFFFF]'
                  }`}
                >
                  AI Generation
                </button>
                <button
                  onClick={() => setActiveTab('upload-images')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'upload-images'
                      ? 'bg-[#DC143C] text-white'
                      : 'bg-[#1F1F1F] text-[#808080] hover:bg-[#2A2A2A] hover:text-[#FFFFFF]'
                  }`}
                >
                  Upload Images
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'ai-generation' && (
                  <AIGenerationTab
                    characterId={characterId}
                    characterName={characterName}
                    screenplayId={screenplayId}
                    onComplete={handleComplete}
                  />
                )}
                
                {activeTab === 'upload-images' && (
                  <UploadImagesTab
                    characterId={characterId}
                    characterName={characterName}
                    screenplayId={screenplayId}
                    existingReferences={existingReferences}
                    onComplete={handleComplete}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

