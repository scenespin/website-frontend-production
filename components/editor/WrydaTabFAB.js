'use client';

/**
 * WrydaTabFAB - Floating Action Button for Wryda Smart Tab
 * 
 * Single FAB button positioned bottom-left for quick access to scene type selection.
 * Mobile: Positioned bottom-left, larger button (56px)
 * Desktop: Hidden (toolbar button used instead)
 * Hidden when drawer is open.
 * 
 * Mobile keyboard handling: Detects when keyboard is visible and adjusts position to stay above it.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function WrydaTabFAB({
  onWrydaTabClick,
  isDrawerOpen,
  isMobile
}) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Detect keyboard visibility on mobile
  useEffect(() => {
    if (!isMobile || typeof window === 'undefined') return;
    
    let initialViewportHeight = window.innerHeight;
    
    const detectKeyboard = () => {
      const windowHeight = window.innerHeight;
      const visualHeight = window.visualViewport?.height || windowHeight;
      
      // Keyboard is likely open if visual viewport is significantly smaller than window
      // Threshold: if viewport shrinks by more than 150px, assume keyboard is open
      if (visualHeight < windowHeight - 150) {
        const calculatedKeyboardHeight = windowHeight - visualHeight;
        // Cap at reasonable max (some devices have very tall keyboards)
        setKeyboardHeight(Math.min(calculatedKeyboardHeight, 400));
      } else {
        setKeyboardHeight(0);
      }
      
      // Update initial height for next comparison
      initialViewportHeight = windowHeight;
    };
    
    // Listen to visual viewport changes (best for keyboard detection)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', detectKeyboard);
      window.visualViewport.addEventListener('scroll', detectKeyboard);
      detectKeyboard(); // Initial check
      
      return () => {
        window.visualViewport?.removeEventListener('resize', detectKeyboard);
        window.visualViewport?.removeEventListener('scroll', detectKeyboard);
      };
    } else {
      // Fallback: Listen to window resize (less accurate but works on older browsers)
      window.addEventListener('resize', detectKeyboard);
      detectKeyboard();
      
      return () => {
        window.removeEventListener('resize', detectKeyboard);
      };
    }
  }, [isMobile]);
  
  // Hide FAB when drawer is open or not on mobile
  if (isDrawerOpen || !isMobile) return null;
  
  // Size and positioning based on device
  const buttonSize = 'h-14 w-14'; // Mobile only, so always 56px
  const iconSize = 'w-6 h-6';
  
  // Calculate bottom offset: base offset + keyboard height + extra padding
  // When keyboard is open, position FAB above the keyboard
  const baseBottomOffset = 80;
  const keyboardAwareBottom = keyboardHeight > 0 
    ? keyboardHeight + 20 // Position 20px above keyboard
    : baseBottomOffset;
  const bottomOffset = `${keyboardAwareBottom}px`;
  const leftOffset = '16px'; // Mirror the right-side FABs
  
  return (
    <motion.button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onWrydaTabClick(e);
      }}
      className={`${buttonSize} rounded-full flex items-center justify-center text-white relative overflow-hidden backdrop-blur-lg border-2 border-white/30 shadow-2xl fixed z-50`}
      style={{
        bottom: bottomOffset,
        left: leftOffset,
        // Glassmorphic effect: gradient background with glass overlay
        background: 'linear-gradient(135deg, rgba(220, 20, 60, 0.85) 0%, rgba(139, 0, 0, 0.85) 100%)',
        // Add safe area inset for iOS devices
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        transition: 'bottom 0.3s ease-in-out'
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: 'spring', 
        stiffness: 260, 
        damping: 20 
      }}
      whileTap={{ scale: 0.9 }}
      title="Wryda Smart Tab • Scene heading navigation"
      aria-label="Wryda Smart Tab"
    >
      {/* Glass overlay with shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-1/2 h-1/3 bg-white/20 rounded-full blur-xl pointer-events-none" />
      {/* White W icon with red text color for visibility */}
      <span className="text-xl font-bold relative z-10 text-white">W</span>
    </motion.button>
  );
}
