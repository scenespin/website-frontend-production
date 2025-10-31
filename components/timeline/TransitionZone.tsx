/**
 * Transition Zone Component
 * 
 * Appears between clips on the timeline
 * Allows users to add/edit/remove transitions
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Film, Sparkles, Eye } from 'lucide-react';

interface TransitionZoneProps {
  beforeClipId: string;
  afterClipId: string;
  existingTransition?: {
    id: string;
    name: string;
    thumbnailUrl: string;
    duration: number;
  };
  onAddTransition: () => void;
  onRemoveTransition: () => void;
  onPreviewTransition: () => void;
}

export function TransitionZone({
  beforeClipId,
  afterClipId,
  existingTransition,
  onAddTransition,
  onRemoveTransition,
  onPreviewTransition,
}: TransitionZoneProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (existingTransition) {
    // Show existing transition
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
      >
        <div className="relative group">
          {/* Transition Preview */}
          <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-indigo-600 shadow-lg cursor-pointer">
            <img
              src={existingTransition.thumbnailUrl}
              alt={existingTransition.name}
              className="w-full h-full object-cover"
            />
            {/* Duration Badge */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1">
              <div className="text-xs text-white font-medium text-center">
                {existingTransition.duration}s
              </div>
            </div>
          </div>

          {/* Hover Actions */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full mt-2 left-1/2 -translate-x-1/2 flex gap-1 bg-white dark:bg-slate-800 rounded-lg shadow-xl p-1 border-2 border-slate-200 dark:border-slate-700"
              >
                <button
                  onClick={onPreviewTransition}
                  className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded text-indigo-600 dark:text-indigo-400 transition-colors"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={onAddTransition}
                  className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400 transition-colors"
                  title="Change"
                >
                  <Film className="w-4 h-4" />
                </button>
                <button
                  onClick={onRemoveTransition}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400 transition-colors"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tooltip */}
          {isHovered && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap">
              {existingTransition.name}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Show "Add Transition" button
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isHovered ? 1 : 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
    >
      <button
        onClick={onAddTransition}
        className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex items-center justify-center shadow-lg transition-all hover:scale-110"
        title="Add Transition"
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* Tooltip */}
      {isHovered && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap">
          Add Transition
        </div>
      )}
    </motion.div>
  );
}

