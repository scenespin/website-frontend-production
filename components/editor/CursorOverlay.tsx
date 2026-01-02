/**
 * CursorOverlay Component
 * Feature 0134: Cursor Position Sharing for Collaborative Editing
 * 
 * Container component that renders all other users' cursor indicators
 * positioned absolutely over the textarea editor.
 */

'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { CursorPosition } from '@/types/collaboration';
import { getCursorPixelPosition, getSelectionPixelRange } from '@/utils/cursorPositionToPixels';
import { getUserColor } from '@/utils/userColors';
import CursorIndicator from './CursorIndicator';

interface CursorOverlayProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  content: string; // Synced content (lastSyncedContent) - use this for all cursor calculations
  cursors: CursorPosition[];
}

function CursorOverlayInner({
  textareaRef,
  content,
  cursors
}: CursorOverlayProps) {
  const [cursorPositions, setCursorPositions] = useState<Map<string, { x: number; y: number; selectionStart?: { x: number; y: number }; selectionEnd?: { x: number; y: number } }>>(new Map());
  // 🔥 FIX: Add scroll state to force re-renders when scroll changes
  const [scrollState, setScrollState] = useState({ scrollTop: 0, scrollLeft: 0 });
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastCalculatedCursorsRef = useRef<string>(''); // Track last cursor set to avoid unnecessary recalculations
  const isCalculatingRef = useRef(false); // Prevent concurrent calculations
  const previousCursorsRef = useRef<CursorPosition[]>([]); // Track previous cursors array for stable comparison

  // Create stable key for cursors to detect actual changes (not just reference changes)
  // Compute the key string first, then use it as the dependency
  const cursorsKeyString = cursors.map(c => `${c.userId}:${c.position}`).join(',');
  const cursorsKey = useMemo(() => {
    return cursorsKeyString;
  }, [cursorsKeyString]);
  
  // Update cursor positions when cursors change
  // FIX: Use cursorsKey (stable key) instead of cursors array to prevent infinite loops
  // Content is NOT in dependencies - it's captured from closure to avoid recalculating on every keystroke
  useEffect(() => {
    // Check if cursors actually changed by comparing keys
    const currentKey = cursorsKey;
    const previousKey = lastCalculatedCursorsRef.current;
    
    // Skip if cursors haven't actually changed (deep comparison)
    if (previousKey === currentKey && previousKey !== '') {
      console.log('[CursorOverlay] Cursors unchanged (deep comparison), skipping recalculation');
      return;
    }
    
    // Update ref with new key
    lastCalculatedCursorsRef.current = currentKey;
    
    // Prevent concurrent calculations
    if (isCalculatingRef.current) {
      console.log('[CursorOverlay] Calculation already in progress, skipping');
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) {
      console.log('[CursorOverlay] Textarea ref is null, clearing positions');
      setCursorPositions(new Map());
      return;
    }

    if (cursors.length === 0) {
      console.log('[CursorOverlay] No cursors, clearing positions');
      setCursorPositions(new Map());
      return;
    }

    console.log('[CursorOverlay] Calculating positions for', cursors.length, 'cursor(s)', {
      contentLength: content.length,
      textareaExists: !!textarea,
      textareaValueLength: textarea.value?.length || 0
    });

    // Set flag to prevent concurrent calculations
    isCalculatingRef.current = true;

    // Calculate positions
    const calculatePositions = () => {
      const textarea = textareaRef.current;
      if (!textarea) {
        console.warn('[CursorOverlay] Textarea ref became null during calculation');
        isCalculatingRef.current = false;
        return;
      }

      // 🔥 FIX: Use synced content for all cursor position calculations
      // Collaborator cursor positions are based on the synced content from the server,
      // not the local textarea.value which may include unsaved changes from the current user.
      // Note: 'content' is captured from closure, not from dependencies, to avoid infinite loops
      const actualContent = content;

      const newPositions = new Map<string, { x: number; y: number; selectionStart?: { x: number; y: number }; selectionEnd?: { x: number; y: number } }>();

      for (const cursor of cursors) {
        try {
          // Calculate pixel position using the synced content
          const position = getCursorPixelPosition(textarea, actualContent, cursor.position);
          
          if (position) {
            let selectionStart: { x: number; y: number } | undefined;
            let selectionEnd: { x: number; y: number } | undefined;

            // Calculate selection range if selection exists
            if (cursor.selectionStart !== undefined && cursor.selectionEnd !== undefined &&
                cursor.selectionStart !== cursor.selectionEnd) {
              const selectionRange = getSelectionPixelRange(
                textarea,
                actualContent,
                cursor.selectionStart,
                cursor.selectionEnd
              );
              
              if (selectionRange) {
                selectionStart = selectionRange.start;
                selectionEnd = selectionRange.end;
              }
            }

            newPositions.set(cursor.userId, {
              ...position,
              selectionStart,
              selectionEnd
            });
          }
        } catch (error) {
          console.error('[CursorOverlay] Error calculating position for cursor', cursor.userId, error);
        }
      }

      console.log('[CursorOverlay] Position calculation complete', {
        cursorsProcessed: cursors.length,
        positionsCalculated: newPositions.size
      });
      
      setCursorPositions(newPositions);
      isCalculatingRef.current = false;
    };

    // Use requestAnimationFrame to batch the state update
    requestAnimationFrame(() => {
      calculatePositions();
    });
  }, [textareaRef, cursorsKey]); // Use stable cursorsKey - only changes when cursors actually change

  // Recalculate on window resize
  useEffect(() => {
    const handleResize = () => {
      // Trigger recalculation by updating a dummy state
      const textarea = textareaRef.current;
      if (textarea && cursors.length > 0) {
        // Force recalculation by temporarily clearing and resetting
        setCursorPositions(new Map());
        setTimeout(() => {
          // Recalculation will happen in the main effect
        }, 50);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [textareaRef, cursors]);

  // Note: Scroll handling is now in the overlay position effect to avoid duplicate handlers

  // Recalculate overlay position on resize or scroll
  // Position overlay to match textarea exactly
  const [overlayStyle, setOverlayStyle] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setOverlayStyle(null);
      return;
    }

    const updateOverlayPosition = () => {
      // Get textarea's position relative to its offset parent (the container div)
      const container = textarea.offsetParent as HTMLElement;
      if (!container) {
        // Fallback: use getBoundingClientRect if no offset parent
        const textareaRect = textarea.getBoundingClientRect();
        const containerRect = document.body.getBoundingClientRect();
        setOverlayStyle({
          left: textareaRect.left - containerRect.left,
          top: textareaRect.top - containerRect.top,
          width: textareaRect.width,
          height: textareaRect.height,
        });
        return;
      }

      // Use offsetLeft/offsetTop for positioning relative to offset parent
      // This matches the textarea's position within the container
      // Use clientHeight instead of offsetHeight to get the visible height (excludes scrollbar)
      setOverlayStyle({
        left: textarea.offsetLeft,
        top: textarea.offsetTop,
        width: textarea.clientWidth, // Use clientWidth to exclude scrollbar
        height: textarea.clientHeight, // Use clientHeight to get visible height only
      });
      
      console.log('[CursorOverlay] Overlay position updated', {
        left: textarea.offsetLeft,
        top: textarea.offsetTop,
        width: textarea.clientWidth,
        height: textarea.clientHeight,
        offsetWidth: textarea.offsetWidth,
        offsetHeight: textarea.offsetHeight,
        scrollHeight: textarea.scrollHeight,
        scrollWidth: textarea.scrollWidth
      });
    };

    // Initial calculation
    updateOverlayPosition();

    // Debounce updates to avoid excessive recalculations
    let resizeTimer: NodeJS.Timeout;
    let scrollTimer: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateOverlayPosition, 50);
    };

    const handleScroll = () => {
      // 🔥 FIX: Update scroll state to trigger re-render so cursor positions adjust for scroll
      const textarea = textareaRef.current;
      if (textarea) {
        setScrollState({
          scrollTop: textarea.scrollTop,
          scrollLeft: textarea.scrollLeft
        });
      }
    };

    window.addEventListener('resize', handleResize);
    textarea.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(resizeTimer);
      clearTimeout(scrollTimer);
      window.removeEventListener('resize', handleResize);
      textarea.removeEventListener('scroll', handleScroll);
    };
  }, [textareaRef]);

  // 🔥 FIX: Initialize scroll state from textarea on mount
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      setScrollState({
        scrollTop: textarea.scrollTop,
        scrollLeft: textarea.scrollLeft
      });
    }
  }, [textareaRef]);

  const textarea = textareaRef.current;
  if (!textarea || cursors.length === 0) {
    if (cursors.length > 0 && !textarea) {
      console.warn('[CursorOverlay] Textarea ref is null but cursors exist');
    }
    return null;
  }

  // Debug logging
  if (cursorPositions.size === 0 && cursors.length > 0) {
    console.warn('[CursorOverlay] Cursors exist but positions not calculated yet', {
      cursorCount: cursors.length,
      positionsCount: cursorPositions.size,
      contentLength: content.length
    });
  }

  if (cursorPositions.size === 0 || !overlayStyle) {
    return null;
  }

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${overlayStyle.left}px`,
        top: `${overlayStyle.top}px`,
        width: `${overlayStyle.width}px`,
        height: `${overlayStyle.height}px`,
        zIndex: 10,
        overflow: 'hidden', // Prevent cursors from showing outside textarea bounds
        // Ensure overlay doesn't affect layout
        margin: 0,
        padding: 0,
      }}
    >
      {cursors.map(cursor => {
        const position = cursorPositions.get(cursor.userId);
        if (!position) {
          console.warn('[CursorOverlay] No position calculated for cursor', { userId: cursor.userId, position: cursor.position });
          return null;
        }

        const color = cursor.color || getUserColor(cursor.userId);

        // getCursorPixelPosition returns coordinates relative to the top of the CONTENT
        // (not the viewport). The hidden div shows content from the top, so position.y
        // represents where the cursor is in the full content.
        // We need to subtract scroll to get the position relative to the visible viewport.
        // 🔥 FIX: Use scrollState to ensure we get the latest scroll values on every render
        const scrollY = scrollState.scrollTop;
        const scrollX = scrollState.scrollLeft;
        
        // Adjust coordinates for scroll: position is in content space, subtract scroll to get viewport space
        const adjustedX = position.x - scrollX;
        const adjustedY = position.y - scrollY;
        
        // Debug: Log if scroll adjustment seems wrong
        if (Math.abs(adjustedX - position.x) > 0.1 || Math.abs(adjustedY - position.y) > 0.1) {
          console.log('[CursorOverlay] Scroll adjustment applied', {
            raw: { x: position.x, y: position.y },
            adjusted: { x: adjustedX, y: adjustedY },
            scroll: { x: scrollX, y: scrollY }
          });
        }

        // Check if cursor is visible (within viewport bounds)
        // Allow a small margin for cursors just outside viewport (they might be partially visible)
        const margin = 50; // pixels
        const isVisible = adjustedX >= -margin && adjustedY >= -margin && 
                         adjustedX <= overlayStyle.width + margin && 
                         adjustedY <= overlayStyle.height + margin;

        // Expand the visibility check to see the full log object
        const visibilityDetails = {
          userId: cursor.userId,
          rawX: position.x,
          rawY: position.y,
          adjustedX,
          adjustedY,
          scrollX,
          scrollY,
          overlayWidth: overlayStyle.width,
          overlayHeight: overlayStyle.height,
          isVisible,
          textareaScrollTop: textarea.scrollTop,
          textareaScrollLeft: textarea.scrollLeft,
          textareaClientHeight: textarea.clientHeight,
          textareaClientWidth: textarea.clientWidth,
          textareaScrollHeight: textarea.scrollHeight,
          textareaScrollWidth: textarea.scrollWidth
        };
        console.log('[CursorOverlay] Cursor visibility check', visibilityDetails);

        if (!isVisible) {
          console.warn('[CursorOverlay] Cursor outside viewport - NOT RENDERING', { 
            userId: cursor.userId, 
            x: adjustedX, 
            y: adjustedY,
            rawX: position.x,
            rawY: position.y,
            scrollY,
            overlayWidth: overlayStyle.width,
            overlayHeight: overlayStyle.height
          });
          return null;
        }

        console.log('[CursorOverlay] ✅ Rendering cursor', { 
          userId: cursor.userId, 
          x: adjustedX, 
          y: adjustedY,
          rawX: position.x,
          rawY: position.y,
          color,
          scrollY,
          willRenderAt: `left: ${adjustedX}px, top: ${adjustedY}px`
        });

        // Adjust selection positions for scroll as well
        const adjustedSelectionStart = position.selectionStart ? {
          x: position.selectionStart.x - scrollX,
          y: position.selectionStart.y - scrollY
        } : undefined;
        
        const adjustedSelectionEnd = position.selectionEnd ? {
          x: position.selectionEnd.x - scrollX,
          y: position.selectionEnd.y - scrollY
        } : undefined;

        return (
          <CursorIndicator
            key={cursor.userId}
            cursor={cursor}
            x={adjustedX}
            y={adjustedY}
            color={color}
            selectionStart={adjustedSelectionStart}
            selectionEnd={adjustedSelectionEnd}
          />
        );
      })}
    </div>
  );
}

// 🔥 FIX: Remove React.memo to allow re-renders on scroll state changes
// Scroll state changes need to trigger re-renders so cursor positions adjust correctly
// The component is already optimized with useMemo for cursor calculations and stable keys
export default CursorOverlayInner;

