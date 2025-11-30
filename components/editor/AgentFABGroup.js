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
import { Edit3, MessageSquare, Sparkles, Film } from 'lucide-react';

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
            className={`${buttonSize} rounded-full flex items-center justify-center text-white ${
              isMobile ? 'shadow-2xl' : 'shadow-lg'
            }`}
            style={{
              // Option 1: Cinema Red (matches brand primary)
              background: 'linear-gradient(135deg, #DC143C 0%, #8B0000 100%)',
              // Option 2: Electric Blue (AI/Tech accent) - uncomment to use
              // background: 'linear-gradient(135deg, #00D9FF 0%, #0099CC 100%)',
              // Option 3: Teal (current, distinct from other agents)
              // background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
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
            <Sparkles className={iconSize} />
          </motion.button>
        )}

        {/* Dialogue FAB */}
        <motion.button
          onClick={onLaunchDialogue}
          className={`${buttonSize} rounded-full flex items-center justify-center text-white ${
            isMobile ? 'shadow-2xl' : 'shadow-lg'
          }`}
          style={{
            // Option 1: Electric Blue (AI/Tech accent, matches theme)
            background: 'linear-gradient(135deg, #00D9FF 0%, #0099CC 100%)',
            // Option 2: Premium Gold (premium feature feel)
            // background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            // Option 3: Pink (current, distinct)
            // background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
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
          <MessageSquare className={iconSize} />
        </motion.button>

        {/* Director FAB */}
        {onLaunchDirector && (
          <motion.button
            onClick={onLaunchDirector}
            className={`${buttonSize} rounded-full flex items-center justify-center text-white ${
              isMobile ? 'shadow-2xl' : 'shadow-lg'
            }`}
            style={{
              // Pink gradient (matches Director modal theme)
              background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
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
            <Film className={iconSize} />
          </motion.button>
        )}

        {/* Screenwriter FAB */}
        <motion.button
          onClick={onLaunchScreenwriter}
          className={`${buttonSize} rounded-full flex items-center justify-center text-white ${
            isMobile ? 'shadow-2xl' : 'shadow-lg'
          }`}
          style={{
            // Option 1: Premium Gold (matches premium gold theme)
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            // Option 2: Purple (current, matches MODE_CONFIG)
            // background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
            // Option 3: Electric Blue variant (lighter)
            // background: 'linear-gradient(135deg, #4DDBFF 0%, #00D9FF 100%)',
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
          <Edit3 className={iconSize} />
        </motion.button>
      </div>
    </AnimatePresence>
  );
}

