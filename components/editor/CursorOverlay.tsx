/**
 * CursorOverlay Component
 * Feature 0134: Cursor Position Sharing for Collaborative Editing
 * 
 * Container component that renders all other users' cursor indicators
 * positioned absolutely over the textarea editor.
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { CursorPosition } from '@/types/collaboration';
import { getCursorPixelPosition, getSelectionPixelRange } from '@/utils/cursorPositionToPixels';
import { getUserColor } from '@/utils/userColors';
import CursorIndicator from './CursorIndicator';

interface CursorOverlayProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  content: string;
  cursors: CursorPosition[];
}

export default function CursorOverlay({
  textareaRef,
  content,
  cursors
}: CursorOverlayProps) {
  const [cursorPositions, setCursorPositions] = useState<Map<string, { x: number; y: number; selectionStart?: { x: number; y: number }; selectionEnd?: { x: number; y: number } }>>(new Map());
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update cursor positions when content or cursors change
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || cursors.length === 0) {
      setCursorPositions(new Map());
      return;
    }

    // Debounce position calculations (recalculate every 100ms max)
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }

    updateTimerRef.current = setTimeout(() => {
      const newPositions = new Map<string, { x: number; y: number; selectionStart?: { x: number; y: number }; selectionEnd?: { x: number; y: number } }>();

      for (const cursor of cursors) {
        const position = getCursorPixelPosition(textarea, content, cursor.position);
        
        if (position) {
          let selectionStart: { x: number; y: number } | undefined;
          let selectionEnd: { x: number; y: number } | undefined;

          // Calculate selection range if selection exists
          if (cursor.selectionStart !== undefined && cursor.selectionEnd !== undefined &&
              cursor.selectionStart !== cursor.selectionEnd) {
            const selectionRange = getSelectionPixelRange(
              textarea,
              content,
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
      }

      setCursorPositions(newPositions);
    }, 100); // 100ms debounce

    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
    };
  }, [textareaRef, content, cursors]);

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
      setOverlayStyle({
        left: textarea.offsetLeft,
        top: textarea.offsetTop,
        width: textarea.offsetWidth,
        height: textarea.offsetHeight,
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
      // Don't update overlay position on scroll - just trigger cursor recalculation
      // The overlay position doesn't change, only the cursor positions within it
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        setCursorPositions(prev => new Map(prev)); // Force recalculation
      }, 16); // ~60fps
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
      }}
    >
      {cursors.map(cursor => {
        const position = cursorPositions.get(cursor.userId);
        if (!position) {
          console.warn('[CursorOverlay] No position calculated for cursor', { userId: cursor.userId, position: cursor.position });
          return null;
        }

        const color = cursor.color || getUserColor(cursor.userId);

        // getCursorPixelPosition returns coordinates relative to textarea's bounding box
        // The hidden div used for measurement doesn't account for scroll, so coordinates
        // represent the position in the full content, not the viewport
        // We need to adjust for scroll to show the cursor in the correct position in the viewport
        const scrollY = textarea.scrollTop;
        const scrollX = textarea.scrollLeft;
        
        // The position from getCursorPixelPosition is relative to the top of the content
        // Subtract scroll to get the position relative to the visible viewport
        const adjustedX = position.x - scrollX;
        const adjustedY = position.y - scrollY;

        // Check if cursor is visible (within viewport bounds)
        // Allow a small margin for cursors just outside viewport (they might be partially visible)
        const margin = 50; // pixels
        const isVisible = adjustedX >= -margin && adjustedY >= -margin && 
                         adjustedX <= overlayStyle.width + margin && 
                         adjustedY <= overlayStyle.height + margin;

        if (!isVisible) {
          console.debug('[CursorOverlay] Cursor outside viewport', { 
            userId: cursor.userId, 
            x: adjustedX, 
            y: adjustedY,
            scrollY,
            overlayWidth: overlayStyle.width,
            overlayHeight: overlayStyle.height
          });
          return null;
        }

        console.log('[CursorOverlay] Rendering cursor', { 
          userId: cursor.userId, 
          x: adjustedX, 
          y: adjustedY,
          color,
          scrollY
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

