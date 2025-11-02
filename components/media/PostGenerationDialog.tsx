'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Save, Trash2, Film, Image as ImageIcon, X } from 'lucide-react';

interface PostGenerationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  itemUrl: string;
  itemType: 'image' | 'video';
  itemName: string;
  onSaveToGallery: () => void;
  onDownload: () => void;
  onDiscard: () => void;
}

/**
 * Dialog shown after generating an image or video
 * Gives user choice: Save to Gallery, Download, or Discard
 */
export function PostGenerationDialog({
  isOpen,
  onClose,
  itemUrl,
  itemType,
  itemName,
  onSaveToGallery,
  onDownload,
  onDiscard
}: PostGenerationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Preview */}
        <div className="relative bg-slate-100 dark:bg-slate-800 aspect-video">
          {itemType === 'image' ? (
            <img
              src={itemUrl}
              alt={itemName}
              className="w-full h-full object-contain"
            />
          ) : (
            <video
              src={itemUrl}
              controls
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              {itemType === 'image' ? (
                <ImageIcon className="w-6 h-6 text-base-content" />
              ) : (
                <Film className="w-6 h-6 text-base-content" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-base-content">
                {itemType === 'image' ? 'Image' : 'Video'} Generated!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                What would you like to do with this {itemType}?
              </p>
            </div>
          </div>

          {/* File Info */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {itemName}
            </p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Save to Gallery */}
            <button
              onClick={() => {
                onSaveToGallery();
                onClose();
              }}
              className="group flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Save className="w-6 h-6 text-base-content" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-900 dark:text-base-content">Save to Gallery</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Use in Timeline/Composition
                </p>
              </div>
            </button>

            {/* Download Only */}
            <button
              onClick={() => {
                onDownload();
                onClose();
              }}
              className="group flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-slate-600 dark:bg-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Download className="w-6 h-6 text-base-content" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-900 dark:text-base-content">Download</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Save to device only
                </p>
              </div>
            </button>

            {/* Discard */}
            <button
              onClick={() => {
                onDiscard();
                onClose();
              }}
              className="group flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-slate-400 dark:bg-slate-600 group-hover:bg-red-500 flex items-center justify-center group-hover:scale-110 transition-all">
                <Trash2 className="w-6 h-6 text-base-content" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-900 dark:text-base-content group-hover:text-red-600 dark:group-hover:text-red-400">
                  Discard
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Don&apos;t save or download
                </p>
              </div>
            </button>
          </div>

          {/* Info Banner */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              💡 <strong>Tip:</strong> Save to Gallery to easily reuse this {itemType} in Timeline or Composition later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

