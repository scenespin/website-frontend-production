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
  content: string; // Synced content (lastSyncedContent)
  cursors: CursorPosition[];
  currentContent?: string; // Current textarea content (with local edits) - optional for backward compatibility
}

export default function CursorOverlay({
  textareaRef,
  content,
  cursors,
  currentContent
}: CursorOverlayProps) {
  const [cursorPositions, setCursorPositions] = useState<Map<string, { x: number; y: number; selectionStart?: { x: number; y: number }; selectionEnd?: { x: number; y: number } }>>(new Map());
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastCalculatedCursorsRef = useRef<string>(''); // Track last cursor set to avoid unnecessary recalculations

  // Update cursor positions when content or cursors change
  useEffect(() => {
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

    // Calculate positions immediately (no debounce) to avoid race conditions
    // The calculation is fast enough that debouncing isn't necessary
    const calculatePositions = () => {
      const textarea = textareaRef.current;
      if (!textarea) {
        console.warn('[CursorOverlay] Textarea ref became null during calculation');
        return;
      }

      // 🔥 FIX: Adjust collaborator cursor positions for local edits
      // The collaborator's cursor position is relative to the synced content.
      // If the current user has inserted/deleted text before the collaborator's cursor,
      // we need to adjust the collaborator's cursor position accordingly.
      // 
      // Algorithm:
      // 1. Find the longest common prefix between synced and current content
      // 2. If cursor is after the common prefix, adjust by the length difference
      // 3. Calculate pixel position using the current content (what's displayed in textarea)
      
      const syncedContent = content;
      const displayedContent = currentContent || textarea.value || syncedContent;
      
      // Find the longest common prefix (where content starts to differ)
      let commonPrefixLength = 0;
      const minLength = Math.min(syncedContent.length, displayedContent.length);
      while (commonPrefixLength < minLength && 
             syncedContent[commonPrefixLength] === displayedContent[commonPrefixLength]) {
        commonPrefixLength++;
      }
      
      // Calculate the net change in content length
      const lengthDiff = displayedContent.length - syncedContent.length;
      
      // Calculate position adjustments for each cursor based on content diff
      const adjustCursorPosition = (cursorPos: number): number => {
        // If content hasn't changed, no adjustment needed
        if (syncedContent === displayedContent) {
          return cursorPos;
        }
        
        // If cursor is at or before the common prefix, no adjustment needed
        // (edits happened after the cursor)
        if (cursorPos <= commonPrefixLength) {
          return cursorPos;
        }
        
        // Cursor is after where content differs
        // Adjust by the net length difference
        // If text was inserted (lengthDiff > 0), shift cursor forward
        // If text was deleted (lengthDiff < 0), shift cursor backward
        const adjustedPos = cursorPos + lengthDiff;
        
        // Ensure adjusted position is valid (not negative, not beyond content)
        return Math.max(0, Math.min(adjustedPos, displayedContent.length));
      };

      const newPositions = new Map<string, { x: number; y: number; selectionStart?: { x: number; y: number }; selectionEnd?: { x: number; y: number } }>();

      for (const cursor of cursors) {
        try {
          // Adjust cursor position for local edits
          const adjustedPosition = adjustCursorPosition(cursor.position);
          
          // Calculate pixel position using the displayed content (what's in the textarea)
          const position = getCursorPixelPosition(textarea, displayedContent, adjustedPosition);
          
          if (position) {
            let selectionStart: { x: number; y: number } | undefined;
            let selectionEnd: { x: number; y: number } | undefined;

            // Calculate selection range if selection exists
            if (cursor.selectionStart !== undefined && cursor.selectionEnd !== undefined &&
                cursor.selectionStart !== cursor.selectionEnd) {
              // Adjust selection positions too
              const adjustedSelectionStart = adjustCursorPosition(cursor.selectionStart);
              const adjustedSelectionEnd = adjustCursorPosition(cursor.selectionEnd);
              
              const selectionRange = getSelectionPixelRange(
                textarea,
                displayedContent,
                adjustedSelectionStart,
                adjustedSelectionEnd
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
            
            console.log('[CursorOverlay] Calculated position for cursor', cursor.userId, position);
          } else {
            console.warn('[CursorOverlay] Failed to calculate position for cursor', cursor.userId, {
              originalPosition: cursor.position,
              adjustedPosition: adjustCursorPosition(cursor.position),
              syncedContentLength: syncedContent.length,
              displayedContentLength: displayedContent.length
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
    };

    // Create a stable key for the current cursor set to detect changes
    const cursorsKey = cursors.map(c => `${c.userId}:${c.position}`).join('|');
    const isFirstCalculation = lastCalculatedCursorsRef.current === '';
    const cursorsChanged = lastCalculatedCursorsRef.current !== cursorsKey;

    // Debounce rapid updates (e.g., during typing) but calculate immediately on first change or when cursors change
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }

    if (isFirstCalculation || cursorsChanged) {
      // Calculate immediately for first calculation or when cursor set changes
      calculatePositions();
      lastCalculatedCursorsRef.current = cursorsKey;
    } else {
      // Debounce for content changes (typing, etc.)
      updateTimerRef.current = setTimeout(() => {
        calculatePositions();
        lastCalculatedCursorsRef.current = cursorsKey;
      }, 50); // 50ms debounce for content updates
    }

    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
    };
  }, [textareaRef, cursors, content, currentContent]); // Include both synced content and current content

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
      // Don't update overlay position on scroll - just trigger cursor recalculation
      // The overlay position doesn't change, only the cursor positions within it
      // Note: We don't need to do anything here - the main useEffect will recalculate
      // positions when content or cursors change, and scroll is handled in the render
      // by adjusting positions with scroll offset
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
        const scrollY = textarea.scrollTop;
        const scrollX = textarea.scrollLeft;
        
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

