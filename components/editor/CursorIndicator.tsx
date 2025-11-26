/**
 * CursorIndicator Component
 * Feature 0134: Cursor Position Sharing for Collaborative Editing
 * 
 * Renders a single user's cursor indicator with their name/email badge.
 */

'use client';

import React from 'react';
import { CursorPosition } from '@/types/collaboration';

interface CursorIndicatorProps {
  cursor: CursorPosition;
  x: number;
  y: number;
  color: string;
  selectionStart?: { x: number; y: number };
  selectionEnd?: { x: number; y: number };
}

export default function CursorIndicator({
  cursor,
  x,
  y,
  color,
  selectionStart,
  selectionEnd
}: CursorIndicatorProps) {
  const displayName = cursor.userName || cursor.userEmail || 'Unknown User';
  
  // Calculate selection highlight if selection exists
  const hasSelection = selectionStart && selectionEnd && 
    (cursor.selectionStart !== undefined && cursor.selectionEnd !== undefined) &&
    cursor.selectionStart !== cursor.selectionEnd;

  return (
    <>
      {/* Selection highlight (if text is selected) */}
      {hasSelection && selectionStart && selectionEnd && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${selectionStart.x}px`,
            top: `${selectionStart.y}px`,
            width: `${Math.max(2, selectionEnd.x - selectionStart.x)}px`,
            height: `${Math.max(16, selectionEnd.y - selectionStart.y + 16)}px`,
            backgroundColor: `${color}20`, // 20 = 12.5% opacity
            borderLeft: `2px solid ${color}80`, // 80 = 50% opacity
            borderRight: `2px solid ${color}80`,
            zIndex: 1,
          }}
        />
      )}
      
      {/* Cursor line */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${x}px`,
          top: `${y}px`,
          width: '2px',
          height: '20px',
          backgroundColor: color,
          zIndex: 2,
          boxShadow: `0 0 4px ${color}80`,
        }}
        data-cursor-user-id={cursor.userId}
        data-cursor-x={x}
        data-cursor-y={y}
      />
      
      {/* User badge */}
      <div
        className="absolute pointer-events-auto"
        style={{
          left: `${x + 4}px`,
          top: `${y - 24}px`,
          zIndex: 3,
        }}
      >
        <div
          className="px-2 py-1 rounded text-xs font-medium text-white shadow-lg whitespace-nowrap"
          style={{
            backgroundColor: color,
          }}
        >
          {displayName}
        </div>
      </div>
    </>
  );
}

