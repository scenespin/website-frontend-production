'use client';

/**
 * AgentFABGroup - Floating Action Buttons for Quick Agent Launch
 * 
 * Four stacked FABs for instant access to Screenwriter, Director, Dialogue, and Rewrite agents.
 * Mobile: Positioned bottom-right, larger buttons (56px)
 * Desktop: Positioned bottom-right, smaller buttons (48px), more subtle
 * Hidden when drawer is open.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AgentFABGroup({
  onLaunchScreenwriter,
  onLaunchDirector,
  onLaunchDialogue,
  onLaunchRewrite,
  hasSelection,
  selectedText, // Add selectedText prop to validate actual text selection
  isDrawerOpen,
  isMobile
}) {
  
  // Hide FABs when drawer is open
  if (isDrawerOpen) return null;
  
  // Size and positioning based on device
  const buttonSize = isMobile ? 'h-14 w-14' : 'h-12 w-12';
  const iconSize = isMobile ? 'w-6 h-6' : 'w-5 h-5';
  const bottomOffset = isMobile ? '80px' : '24px';
  const rightOffset = isMobile ? '16px' : '24px';
  const gap = isMobile ? 'gap-2' : 'gap-1.5';
  
  return (
    <AnimatePresence>
      <div 
        className={`fixed z-50 flex flex-col ${gap}`}
        style={{
          bottom: bottomOffset,
          right: rightOffset
        }}
      >
        {/* Rewrite FAB - Only show when text is actually selected (not just cursor position) */}
        {hasSelection && selectedText && selectedText.trim().length > 0 && (
          <motion.button
            onClick={onLaunchRewrite}
            className={`${buttonSize} rounded-full flex items-center justify-center text-white relative overflow-hidden backdrop-blur-lg border-2 border-white/30 ${
              isMobile ? 'shadow-2xl' : 'shadow-lg'
            }`}
            style={{
              // Glassmorphic effect: gradient background with glass overlay
              background: 'linear-gradient(135deg, rgba(220, 20, 60, 0.85) 0%, rgba(139, 0, 0, 0.85) 100%)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              boxShadow: isMobile ? [
                '0 4px 20px rgba(220, 20, 60, 0.4)',
                '0 4px 30px rgba(220, 20, 60, 0.6)',
                '0 4px 20px rgba(220, 20, 60, 0.4)',
              ] : [
                '0 2px 12px rgba(220, 20, 60, 0.3)',
                '0 2px 18px rgba(220, 20, 60, 0.5)',
                '0 2px 12px rgba(220, 20, 60, 0.3)',
              ]
            }}
            transition={{ 
              scale: { delay: 0.2, type: 'spring', stiffness: 260, damping: 20 },
              opacity: { delay: 0.2 },
              boxShadow: { repeat: Infinity, duration: 1.5 }
            }}
            whileTap={{ scale: 0.9 }}
            whileHover={!isMobile ? { scale: 1.05 } : {}}
            title="Rewrite & Polish: Improve selected text with AI. Quick actions: Make concise, expand detail, more dramatic, polish dialogue, fix grammar"
            aria-label="Launch Rewrite Agent"
          >
            {/* Glass overlay with shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-1/4 w-1/2 h-1/3 bg-white/20 rounded-full blur-xl pointer-events-none" />
            <span className="text-2xl relative z-10">💫</span>
          </motion.button>
        )}

        {/* Dialogue FAB */}
        <motion.button
          onClick={onLaunchDialogue}
          className={`${buttonSize} rounded-full flex items-center justify-center text-white relative overflow-hidden backdrop-blur-lg border-2 border-white/30 ${
            isMobile ? 'shadow-2xl' : 'shadow-lg'
          }`}
          style={{
            // Glassmorphic effect: gradient background with glass overlay
            background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.85) 0%, rgba(124, 58, 237, 0.85) 100%)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            delay: hasSelection ? 0.1 : 0.2, 
            type: 'spring', 
            stiffness: 260, 
            damping: 20 
          }}
          whileTap={{ scale: 0.9 }}
          whileHover={!isMobile ? { scale: 1.05 } : {}}
          title="Launch Dialogue Agent"
          aria-label="Launch Dialogue Agent"
        >
          {/* Glass overlay with shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
          <div className="absolute top-0 left-1/4 w-1/2 h-1/3 bg-white/20 rounded-full blur-xl pointer-events-none" />
          <span className="text-2xl relative z-10">💬</span>
        </motion.button>

        {/* Director FAB */}
        {onLaunchDirector && (
          <motion.button
            onClick={onLaunchDirector}
            className={`${buttonSize} rounded-full flex items-center justify-center text-white relative overflow-hidden backdrop-blur-lg border-2 border-white/30 ${
              isMobile ? 'shadow-2xl' : 'shadow-lg'
            }`}
            style={{
              // Glassmorphic effect: gradient background with glass overlay
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.85) 0%, rgba(234, 88, 12, 0.85) 100%)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              delay: hasSelection ? 0.05 : 0.15, 
              type: 'spring', 
              stiffness: 260, 
              damping: 20 
            }}
            whileTap={{ scale: 0.9 }}
            whileHover={!isMobile ? { scale: 1.05 } : {}}
            title="Launch Director Agent: Generate complete scenes with scene headings"
            aria-label="Launch Director Agent"
          >
            {/* Glass overlay with shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-1/4 w-1/2 h-1/3 bg-white/20 rounded-full blur-xl pointer-events-none" />
            <span className="text-2xl relative z-10">🎬</span>
          </motion.button>
        )}

        {/* Screenwriter FAB */}
        <motion.button
          onClick={onLaunchScreenwriter}
          className={`${buttonSize} rounded-full flex items-center justify-center text-white relative overflow-hidden backdrop-blur-lg border-2 border-white/30 ${
            isMobile ? 'shadow-2xl' : 'shadow-lg'
          }`}
          style={{
            // Glassmorphic effect: gradient background with glass overlay
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.85) 0%, rgba(79, 70, 229, 0.85) 100%)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            delay: hasSelection ? 0 : 0.1, 
            type: 'spring', 
            stiffness: 260, 
            damping: 20 
          }}
          whileTap={{ scale: 0.9 }}
          whileHover={!isMobile ? { scale: 1.05 } : {}}
          title="Launch Screenwriter Agent"
          aria-label="Launch Screenwriter Agent"
        >
          {/* Glass overlay with shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
          <div className="absolute top-0 left-1/4 w-1/2 h-1/3 bg-white/20 rounded-full blur-xl pointer-events-none" />
          <span className="text-2xl relative z-10">✍️</span>
        </motion.button>
      </div>
    </AnimatePresence>
  );
}

