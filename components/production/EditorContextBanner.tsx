'use client';

/**
 * EditorContextBanner Component
 * 
 * Shows when a scene is auto-selected from editor context.
 * Part of Production Hub Phase 2 redesign.
 */

import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditorContextBannerProps {
  sceneName: string;
  onDismiss: () => void;
  className?: string;
}

export function EditorContextBanner({ 
  sceneName, 
  onDismiss,
  className = '' 
}: EditorContextBannerProps) {
  return (
    <div className={`bg-blue-900/30 border border-blue-700/50 rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <span className="text-sm text-blue-200 flex-1">
          Using scene from editor: <strong className="text-blue-100">{sceneName}</strong>
        </span>
        <Button
          onClick={onDismiss}
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-blue-300 hover:text-blue-200 hover:bg-blue-900/30 flex-shrink-0"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

