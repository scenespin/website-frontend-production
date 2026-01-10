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

export default function AgentDrawer({ children }) {
  const { isDrawerOpen, closeDrawer, openDrawer } = useDrawer();
  const { state } = useChatContext();
  const [isMobile, setIsMobile] = useState(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const previousMessageCount = useRef(0);
  
  // Calculate default height: 60% of screen
  const getDefaultHeight = () => {
    if (typeof window === 'undefined') return 400;
    return Math.floor(window.innerHeight * 0.6);
  };
  
  // Initialize height to 60% of screen
  const [height, setHeight] = useState(() => getDefaultHeight());
  const [isDragging, setIsDragging] = useState(false);

  // Detect mobile vs desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-expand on response: If height < 70%, expand to 70% when new message arrives
  useEffect(() => {
    if (!isMobile || !isDrawerOpen || typeof window === 'undefined') return;
    
    const chatMessages = state.messages.filter(m => m.mode === 'chat');
    const currentMessageCount = chatMessages.length;
    
    // Check if a new assistant message arrived
    if (currentMessageCount > previousMessageCount.current) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      // Only auto-expand if it's an assistant message (response)
      if (lastMessage && lastMessage.role === 'assistant') {
        const targetHeight = Math.floor(window.innerHeight * 0.7);
        // Only expand if current height is less than 70%
        if (height < targetHeight) {
          setHeight(targetHeight);
        }
      }
    }
    
    previousMessageCount.current = currentMessageCount;
  }, [state.messages, isMobile, isDrawerOpen, height]);

  // Mobile: Calculate height (40px collapsed)
  const mobileHeight = isDrawerOpen ? height : 40;

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
          className="fixed bottom-0 left-0 right-0 bg-base-200 border-t border-base-300 z-50 transition-all duration-300 ease-out md:hidden rounded-t-2xl"
          style={{ 
            height: `${mobileHeight}px`,
            transition: 'height 300ms ease-out' // Smooth height transitions
          }}
        >
          {/* Drag Handle (Mobile) - Compact like debug panel */}
          <div
            className="w-full py-1.5 flex items-center justify-center cursor-grab active:cursor-grabbing border-b border-cinema-red/20 relative transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, rgba(220, 20, 60, 0.15) 0%, rgba(220, 20, 60, 0.15) 100%)'
            }}
            onMouseDown={(e) => handleDragStart(e.clientY)}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          >
            {isDrawerOpen && (
              <>
                <GripHorizontal className="w-6 h-6 text-base-content/40" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeDrawer();
                  }}
                  className="absolute right-4 btn btn-sm btn-ghost btn-circle z-10"
                  aria-label="Close drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
            {!isDrawerOpen && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openDrawer();
                }}
                className="w-full h-full text-xs font-medium text-base-content"
              >
                Story Advisor
              </button>
            )}
          </div>

          {/* Content - Only render when drawer is open to prevent unnecessary re-renders */}
          {isDrawerOpen && (
            <div className="h-[calc(100%-48px)] overflow-auto pb-6">
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
             {/* Header (Desktop) - Always shows "Wryda AI" with pulsing red dot */}
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

        {/* Content - Only render when drawer is open to prevent unnecessary re-renders */}
        {isDrawerOpen ? (
          <div className="h-[calc(100%-64px)] overflow-auto pb-6">
            {children}
          </div>
        ) : (
          <div className="h-[calc(100%-64px)] flex items-center justify-center">
            <span className="text-sm text-base-content/60">Click to open Story Advisor</span>
          </div>
        )}
      </div>

      {/* Floating Open Button (Desktop - when closed) */}
      {!isDrawerOpen && (
        <button
          onClick={() => openDrawer()}
          className="fixed top-1/2 right-0 -translate-y-1/2 bg-cinema-red hover:opacity-90 text-base-content text-sm font-medium rounded-l-lg rounded-r-none shadow-lg hidden md:flex z-30 border-none px-4 py-3 transition-all duration-300"
          style={{ 
            writingMode: 'vertical-rl', 
            textOrientation: 'mixed',
            animation: 'pulse-subtle 3s ease-in-out infinite'
          }}
        >
          STORY ADVISOR
        </button>
      )}
    </>
  );
}

