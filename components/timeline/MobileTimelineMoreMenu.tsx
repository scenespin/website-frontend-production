/**
 * Mobile Timeline More Menu
 * 
 * Drawer with all advanced timeline features
 * Organized by category: Video Tools, Audio Tools, Timeline Settings
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Film,
  Music,
  Settings as SettingsIcon,
  Shuffle,
  Palette,
  Gauge,
  RotateCcw,
  Wand2,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Link,
  Link2Off,
  Grid3x3,
  Info,
  Maximize2,
  Minimize2,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptic } from '@/lib/haptics';

interface MobileTimelineMoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  
  // Video Tools
  onTransitions: () => void;
  onColorFilters: () => void;
  onSpeed: () => void;
  onReverse: () => void;
  onEffects: () => void;
  onPreviewMode: () => void;
  previewMode: boolean;
  
  // Audio Tools
  onVolume: () => void;
  onFade: () => void;
  
  // Timeline Settings
  onRippleMode: () => void;
  onSnapGrid: () => void;
  onShowInfo: () => void;
  onToggleAudioTracks: () => void;
  rippleMode: boolean;
  snapGrid: boolean;
  showAudioTracks: boolean;
}

export function MobileTimelineMoreMenu({
  isOpen,
  onClose,
  selectedCount,
  onTransitions,
  onColorFilters,
  onSpeed,
  onReverse,
  onEffects,
  onPreviewMode,
  previewMode,
  onVolume,
  onFade,
  onRippleMode,
  onSnapGrid,
  onShowInfo,
  onToggleAudioTracks,
  rippleMode,
  snapGrid,
  showAudioTracks
}: MobileTimelineMoreMenuProps) {
  const haptic = useHaptic();
  
  const withHaptic = (callback: () => void) => () => {
    haptic.medium();
    callback();
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
            className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 rounded-t-3xl shadow-2xl z-50 max-h-[85vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white">Timeline Tools</h3>
                {selectedCount > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedCount} clip{selectedCount > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-10 w-10 p-0 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              
              {/* Video Tools Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Film className="w-4 h-4 text-[#DC143C]" />
                  <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                    Video Tools
                  </h4>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={withHaptic(() => {
                      onTransitions();
                      onClose();
                    })}
                    disabled={selectedCount !== 1}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2 border-slate-700 bg-slate-800 hover:bg-slate-700 touch-manipulation disabled:opacity-40"
                  >
                    <Shuffle className="w-6 h-6 text-[#DC143C]" />
                    <span className="text-xs font-medium text-slate-200">Transitions</span>
                  </Button>

                  <Button
                    onClick={withHaptic(() => {
                      onColorFilters();
                      onClose();
                    })}
                    disabled={selectedCount !== 1}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2 border-slate-700 bg-slate-800 hover:bg-slate-700 touch-manipulation disabled:opacity-40"
                  >
                    <Palette className="w-6 h-6 text-orange-500" />
                    <span className="text-xs font-medium text-slate-200">Color Filters</span>
                  </Button>

                  <Button
                    onClick={withHaptic(() => {
                      onSpeed();
                      onClose();
                    })}
                    disabled={selectedCount !== 1}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2 border-slate-700 bg-slate-800 hover:bg-slate-700 touch-manipulation disabled:opacity-40"
                  >
                    <Gauge className="w-6 h-6 text-blue-500" />
                    <span className="text-xs font-medium text-slate-200">Speed</span>
                  </Button>

                  <Button
                    onClick={withHaptic(() => {
                      onReverse();
                      onClose();
                    })}
                    disabled={selectedCount !== 1}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2 border-slate-700 bg-slate-800 hover:bg-slate-700 touch-manipulation disabled:opacity-40"
                  >
                    <RotateCcw className="w-6 h-6 text-cyan-500" />
                    <span className="text-xs font-medium text-slate-200">Reverse</span>
                  </Button>

                  <Button
                    onClick={withHaptic(() => {
                      onEffects();
                      onClose();
                    })}
                    disabled={selectedCount !== 1}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2 border-slate-700 bg-slate-800 hover:bg-slate-700 touch-manipulation disabled:opacity-40"
                  >
                    <Wand2 className="w-6 h-6 text-purple-500" />
                    <span className="text-xs font-medium text-slate-200">Effects</span>
                  </Button>

                  <Button
                    onClick={withHaptic(() => {
                      onPreviewMode();
                      onClose();
                    })}
                    variant="outline"
                    className={`h-20 flex flex-col items-center justify-center gap-2 border-slate-700 hover:bg-slate-700 touch-manipulation ${
                      previewMode ? 'bg-[#DC143C]/20 border-[#DC143C]' : 'bg-slate-800'
                    }`}
                  >
                    {previewMode ? (
                      <Eye className="w-6 h-6 text-[#DC143C]" />
                    ) : (
                      <EyeOff className="w-6 h-6 text-slate-400" />
                    )}
                    <span className="text-xs font-medium text-slate-200">Preview</span>
                  </Button>
                </div>
              </div>

              {/* Audio Tools Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Music className="w-4 h-4 text-green-500" />
                  <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                    Audio Tools
                  </h4>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={withHaptic(() => {
                      onVolume();
                      onClose();
                    })}
                    disabled={selectedCount !== 1}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2 border-slate-700 bg-slate-800 hover:bg-slate-700 touch-manipulation disabled:opacity-40"
                  >
                    <Volume2 className="w-6 h-6 text-green-500" />
                    <span className="text-xs font-medium text-slate-200">Volume</span>
                  </Button>

                  <Button
                    onClick={withHaptic(() => {
                      onFade();
                      onClose();
                    })}
                    disabled={selectedCount !== 1}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2 border-slate-700 bg-slate-800 hover:bg-slate-700 touch-manipulation disabled:opacity-40"
                  >
                    <Zap className="w-6 h-6 text-yellow-500" />
                    <span className="text-xs font-medium text-slate-200">Fade</span>
                  </Button>
                </div>
              </div>

              {/* Timeline Settings Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <SettingsIcon className="w-4 h-4 text-slate-400" />
                  <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                    Timeline Settings
                  </h4>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={withHaptic(() => {
                      onRippleMode();
                      onClose();
                    })}
                    variant="outline"
                    className={`h-20 flex flex-col items-center justify-center gap-2 border-slate-700 hover:bg-slate-700 touch-manipulation ${
                      rippleMode ? 'bg-[#DC143C]/20 border-[#DC143C]' : 'bg-slate-800'
                    }`}
                  >
                    {rippleMode ? (
                      <Link className="w-6 h-6 text-[#DC143C]" />
                    ) : (
                      <Link2Off className="w-6 h-6 text-slate-400" />
                    )}
                    <span className="text-xs font-medium text-slate-200">Ripple</span>
                  </Button>

                  <Button
                    onClick={withHaptic(() => {
                      onSnapGrid();
                      onClose();
                    })}
                    variant="outline"
                    className={`h-20 flex flex-col items-center justify-center gap-2 border-slate-700 hover:bg-slate-700 touch-manipulation ${
                      snapGrid ? 'bg-blue-500/20 border-blue-500' : 'bg-slate-800'
                    }`}
                  >
                    <Grid3x3 className={`w-6 h-6 ${snapGrid ? 'text-blue-500' : 'text-slate-400'}`} />
                    <span className="text-xs font-medium text-slate-200">Snap</span>
                  </Button>

                  <Button
                    onClick={withHaptic(() => {
                      onShowInfo();
                      onClose();
                    })}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2 border-slate-700 bg-slate-800 hover:bg-slate-700 touch-manipulation"
                  >
                    <Info className="w-6 h-6 text-blue-400" />
                    <span className="text-xs font-medium text-slate-200">Info</span>
                  </Button>

                  <Button
                    onClick={withHaptic(() => {
                      onToggleAudioTracks();
                      onClose();
                    })}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2 border-slate-700 bg-slate-800 hover:bg-slate-700 touch-manipulation"
                  >
                    {showAudioTracks ? (
                      <Minimize2 className="w-6 h-6 text-slate-400" />
                    ) : (
                      <Maximize2 className="w-6 h-6 text-slate-400" />
                    )}
                    <span className="text-xs font-medium text-slate-200">Audio</span>
                  </Button>
                </div>
              </div>

              {/* Help Text */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  💡 <span className="font-semibold text-slate-300">Tip:</span> Select a clip to access editing tools like Transitions, Color Filters, and Effects.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

