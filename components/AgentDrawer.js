'use client';

import { useState, useRef, useEffect } from 'react';
import { X, GripHorizontal, ChevronRight } from 'lucide-react';
import { useDrawer } from '@/contexts/DrawerContext';

export default function AgentDrawer({ children }) {
  const { isDrawerOpen, closeDrawer, openDrawer } = useDrawer();
  const [height, setHeight] = useState(500);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

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
            className="w-full h-16 flex items-center justify-center cursor-grab active:cursor-grabbing bg-base-300 border-b border-cinema-red/20"
            onMouseDown={(e) => handleDragStart(e.clientY)}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          >
            <GripHorizontal className="w-8 h-8 text-base-content/40" />
            <button
              onClick={closeDrawer}
              className="absolute right-4 btn btn-sm btn-ghost btn-circle"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          {isDrawerOpen && (
            <div className="h-[calc(100%-64px)] overflow-auto">
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
      {/* Desktop Drawer - Slides in from right */}
      <div
        className={`fixed top-0 right-0 h-full bg-base-200 shadow-xl z-40 transition-all duration-300 ease-out hidden md:block ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '480px' }}
      >
             {/* Header (Desktop) */}
             <div className="h-16 flex items-center justify-between px-4 bg-base-300 border-b border-cinema-red/20">
               <h3 className="text-lg font-bold text-base-content">Screenwriting Assistant</h3> {/* Changed from AI Assistant */}
               <button
                 onClick={closeDrawer}
                 className="btn btn-sm btn-ghost btn-circle"
               >
                 <ChevronRight className="w-5 h-5" />
               </button>
             </div>

        {/* Content */}
        <div className="h-[calc(100%-64px)] overflow-auto">
          {children}
        </div>
      </div>

      {/* Floating Open Button (Desktop - when closed) */}
      {!isDrawerOpen && (
        <button
          onClick={() => openDrawer('chat')}
          className="fixed top-1/2 right-0 -translate-y-1/2 btn bg-cinema-red hover:opacity-90 text-white btn-sm rounded-l-lg rounded-r-none shadow-lg hidden md:flex z-30 border-none"
          style={{ writingMode: 'vertical-rl' }}
        >
          AI Assistant
        </button>
      )}
    </>
  );
}

