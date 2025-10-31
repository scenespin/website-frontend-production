'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SceneBuilderDecisionModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onCancel: () => void;
  message?: string;
}

/**
 * Scene Builder Decision Modal
 * 
 * Shows when audio generation is rejected and asks user to decide:
 * - Continue without audio
 * - Cancel workflow (no charge)
 */
export function SceneBuilderDecisionModal({
  isOpen,
  onContinue,
  onCancel,
  message = "Your scene couldn't be generated with audio due to content guidelines."
}: SceneBuilderDecisionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-background border border-border rounded-lg shadow-xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
          </div>
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-semibold text-center mb-2">
          Audio Not Available
        </h3>
        
        {/* Message */}
        <p className="text-sm text-muted-foreground text-center mb-6">
          {message}
        </p>
        
        {/* Options */}
        <div className="space-y-3">
          {/* Continue Without Audio */}
          <Button
            onClick={onContinue}
            className="w-full h-auto py-3 bg-primary hover:bg-primary/90"
          >
            <div className="flex flex-col items-start w-full">
              <div className="font-semibold">✅ Continue Without Audio</div>
              <div className="text-xs opacity-75 mt-0.5">100-150 credits</div>
            </div>
          </Button>
          
          {/* Cancel */}
          <Button
            onClick={onCancel}
            variant="outline"
            className="w-full h-auto py-3"
          >
            <div className="flex flex-col items-start w-full">
              <div className="font-semibold">❌ Cancel</div>
              <div className="text-xs opacity-75 mt-0.5">No charge</div>
            </div>
          </Button>
        </div>
        
        {/* Info */}
        <div className="mt-4 p-3 rounded bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            💡 <strong>Tip:</strong> Audio generation has stricter content guidelines. 
            Try rephrasing your scene description or generate without audio for 
            more flexibility.
          </p>
        </div>
      </div>
    </div>
  );
}

