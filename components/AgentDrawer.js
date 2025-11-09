'use client';

/**
 * AgentDrawer - Unified AI Drawer Component
 * Slides from right (desktop) or bottom (mobile)
 * Wraps UnifiedChatPanel and shows dynamic agent labels
 * Build: 2024-11-09-17:30 UTC (cache bust - audio label fix)
 */

import { useState, useRef, useEffect } from 'react';
import { X, GripHorizontal, ChevronRight } from 'lucide-react';
import { useDrawer } from '@/contexts/DrawerContext';
import { useChatContext } from '@/contexts/ChatContext';

// Mode labels for drawer header
const MODE_LABELS = {
  chat: 'Screenwriter',
  director: 'Director',
  image: 'Image Generation',
  'quick-video': 'Video Generation',
  audio: 'Audio',
  'try-on': 'Virtual Try-On',
  workflows: 'AI Workflow Selector'
};

export default function AgentDrawer({ children }) {
  const { isDrawerOpen, closeDrawer, openDrawer } = useDrawer();
  const { state } = useChatContext();
  const [height, setHeight] = useState(500);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  
  // Get current mode label
  const currentModeLabel = MODE_LABELS[state?.activeMode] || 'AI Assistant';

  // Detect mobile vs desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile: Calculate height (70px collapsed, variable when open)
  const mobileHeight = isDrawerOpen ? height : 70;

  // Desktop: Fixed width
  const desktopWidth = isDrawerOpen ? 480 : 0;

  // Handle drag gestures (MOBILE ONLY)
  const handleDragStart = (clientY) => {
    if (!isMobile) return;
    setIsDragging(true);
    dragStartY.current = clientY;
    dragStartHeight.current = height;
  };

  useEffect(() => {
    if (!isDragging || !isMobile) return;

    const handleMove = (clientY) => {
      const deltaY = dragStartY.current - clientY;
      const newHeight = Math.max(300, Math.min(window.innerHeight * 0.9, dragStartHeight.current + deltaY));

      // If swiping down significantly, close the drawer
      if (deltaY < -100 && clientY > dragStartY.current) {
        closeDrawer();
        setIsDragging(false);
        return;
      }

      setHeight(newHeight);
    };

    const handleMouseMove = (e) => {
      e.preventDefault();
      handleMove(e.clientY);
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientY);
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, isMobile, closeDrawer]);

  // MOBILE RENDER
  if (isMobile) {
    return (
      <>
        {/* Backdrop - Mobile Only */}
        {isDrawerOpen && (
          <div 
            className="fixed inset-0 bg-black/40 z-40 transition-opacity md:hidden"
            onClick={closeDrawer}
          />
        )}

        {/* Mobile Drawer - Slides up from bottom */}
        <div
          className="fixed bottom-0 left-0 right-0 bg-base-200 shadow-xl z-50 transition-all duration-300 ease-out md:hidden"
          style={{ height: `${mobileHeight}px` }}
        >
          {/* Drag Handle (Mobile) */}
          <div
            className="w-full h-16 flex items-center justify-center cursor-grab active:cursor-grabbing bg-base-300 border-b border-cinema-red/20 relative"
            onMouseDown={(e) => handleDragStart(e.clientY)}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          >
            {isDrawerOpen && (
              <>
                <GripHorizontal className="w-8 h-8 text-base-content/40" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeDrawer();
                  }}
                  className="absolute right-4 btn btn-sm btn-ghost btn-circle z-10"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            )}
            {!isDrawerOpen && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openDrawer();
                }}
                className="text-sm font-medium text-base-content"
              >
                AI Assistant
              </button>
            )}
          </div>

          {/* Content */}
          {isDrawerOpen && (
            <div className="h-[calc(100%-64px)] overflow-auto pb-6">
              {children}
            </div>
          )}
        </div>
      </>
    );
  }

  // DESKTOP RENDER
  return (
    <>
      {/* Backdrop - Desktop */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 transition-opacity hidden md:block"
          onClick={closeDrawer}
        />
      )}

      {/* Desktop Drawer - Slides in from right */}
      <div
        className={`fixed top-0 right-0 h-full bg-base-200 shadow-xl z-40 transition-all duration-300 ease-out hidden md:block ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '480px' }}
      >
             {/* Header (Desktop) */}
             <div className="h-14 flex items-center justify-between px-4 bg-base-300 border-b border-cinema-red/20">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-cinema-red rounded-full animate-pulse"></div>
                 <h3 className="text-base font-semibold text-base-content">Wryda AI</h3>
               </div>
               <button
                 onClick={closeDrawer}
                 className="btn btn-sm btn-ghost btn-circle"
               >
                 <ChevronRight className="w-5 h-5" />
               </button>
             </div>

        {/* Content */}
        <div className="h-[calc(100%-64px)] overflow-auto pb-6">
          {children}
        </div>
      </div>

      {/* Floating Open Button (Desktop - when closed) */}
      {!isDrawerOpen && (
        <button
          onClick={() => openDrawer()}
          className="fixed top-1/2 right-0 -translate-y-1/2 btn bg-cinema-red hover:opacity-90 text-base-content btn-sm rounded-l-lg rounded-r-none shadow-lg hidden md:flex z-30 border-none"
          style={{ writingMode: 'vertical-rl' }}
        >
          AI Assistant
        </button>
      )}
    </>
  );
}

