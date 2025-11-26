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

  // Recalculate on scroll (cursors need to move with content)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleScroll = () => {
      // Force re-render to update cursor positions with new scroll offset
      // The positions are already relative to textarea, so we just need to trigger a re-render
      setCursorPositions(prev => new Map(prev));
    };

    textarea.addEventListener('scroll', handleScroll, { passive: true });
    return () => textarea.removeEventListener('scroll', handleScroll);
  }, [textareaRef]);

  // Recalculate overlay position on resize or scroll
  // Use offsetLeft/offsetTop for positioning relative to offset parent (the container)
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
      // Use offsetLeft/offsetTop for positioning relative to offset parent
      // This is more reliable than getBoundingClientRect() which is viewport-relative
      setOverlayStyle({
        left: textarea.offsetLeft,
        top: textarea.offsetTop,
        width: textarea.offsetWidth,
        height: textarea.offsetHeight,
      });
    };

    // Initial calculation
    updateOverlayPosition();

    // Update on resize and scroll
    const handleResize = () => updateOverlayPosition();
    const handleScroll = () => updateOverlayPosition();

    window.addEventListener('resize', handleResize);
    textarea.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
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

        // Adjust position for textarea scroll offset
        // getCursorPixelPosition returns coordinates relative to textarea's content area
        // We need to account for scroll to position cursors correctly
        const scrollY = textarea.scrollTop;
        
        // The position from getCursorPixelPosition is relative to the textarea's bounding box
        // which includes the visible content. We need to adjust for scroll to show cursors
        // in the correct position relative to the scrolled content
        const adjustedX = position.x;
        const adjustedY = position.y - scrollY; // Adjust for vertical scroll

        // Check if cursor is visible (within viewport)
        const isVisible = adjustedX >= 0 && adjustedY >= 0 && 
                         adjustedX <= overlayStyle.width && 
                         adjustedY <= overlayStyle.height;

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
          x: position.selectionStart.x,
          y: position.selectionStart.y - scrollY
        } : undefined;
        
        const adjustedSelectionEnd = position.selectionEnd ? {
          x: position.selectionEnd.x,
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

