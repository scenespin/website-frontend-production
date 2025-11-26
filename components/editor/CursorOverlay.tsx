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

  const textarea = textareaRef.current;
  if (!textarea || cursors.length === 0 || cursorPositions.size === 0) {
    return null;
  }

  // Note: getCursorPixelPosition returns positions relative to textarea's content area
  // We don't need to adjust for scroll because the positions are already relative to the textarea element
  // The overlay is positioned absolutely within the textarea container, so positions are correct as-is

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        zIndex: 10,
        overflow: 'hidden', // Prevent cursors from showing outside textarea bounds
      }}
    >
      {cursors.map(cursor => {
        const position = cursorPositions.get(cursor.userId);
        if (!position) return null;

        const color = cursor.color || getUserColor(cursor.userId);

        // Check if cursor is visible (rough check - within textarea bounds)
        // Note: This is approximate since we don't account for scroll, but it's good enough
        // Cursors outside viewport will be clipped by overflow: hidden
        const isVisible = position.x >= 0 && position.y >= 0 && 
                         position.x <= textarea.offsetWidth && 
                         position.y <= textarea.offsetHeight + textarea.scrollHeight;

        if (!isVisible) {
          return null;
        }

        return (
          <CursorIndicator
            key={cursor.userId}
            cursor={cursor}
            x={position.x}
            y={position.y}
            color={color}
            selectionStart={position.selectionStart}
            selectionEnd={position.selectionEnd}
          />
        );
      })}
    </div>
  );
}

