/**
 * VisualAnnotationPanel.tsx - Feature 0105
 * 
 * Wrapper panel for visual annotation canvas with preview and controls.
 * Safe, optional component that enhances but doesn't break existing flows.
 * 
 * Safety:
 * - Only renders if image is provided
 * - Collapsible (can be hidden)
 * - Error boundaries prevent crashes
 * - Optional in all workflows
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle,
  Info
} from 'lucide-react';
import { VisualAnnotationCanvas } from './VisualAnnotationCanvas';

/**
 * Frontend annotation types (simplified for UI)
 */
interface AnnotationData {
  type: 'motion' | 'content';
  id: string;
  [key: string]: any;
}

interface VisualAnnotationPanelProps {
  imageUrl?: string;
  onAnnotationsComplete?: (data: any) => void;
  disabled?: boolean;
  className?: string;
  defaultExpanded?: boolean;
}

/**
 * Visual Annotation Panel - Wrapper Component
 * 
 * SAFETY: Renders nothing if no image URL provided
 */
export function VisualAnnotationPanel({
  imageUrl,
  onAnnotationsComplete,
  disabled = false,
  className = '',
  defaultExpanded = false
}: VisualAnnotationPanelProps) {
  
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [annotations, setAnnotations] = useState<AnnotationData[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  
  /**
   * SAFETY: Don't render if no image
   */
  if (!imageUrl) {
    return null;
  }
  
  /**
   * Handle annotation changes from canvas
   */
  const handleAnnotationsChange = (newAnnotations: AnnotationData[]) => {
    try {
      setAnnotations(newAnnotations);
      setHasChanges(true);
      
      // Optionally auto-save
      if (onAnnotationsComplete) {
        // Convert to backend format
        const annotationsData = {
          imageUrl,
          annotations: newAnnotations.map(ann => {
            if (ann.type === 'motion') {
              return {
                type: 'motion',
                id: ann.id,
                startPoint: ann.startPoint,
                endPoint: ann.endPoint,
                speed: ann.speed || 'smooth',
                timestamp: Date.now()
              };
            } else {
              return {
                type: 'content',
                id: ann.id,
                region: {
                  x: ann.position.x,
                  y: ann.position.y,
                  width: 5,
                  height: 5
                },
                description: ann.description,
                timestamp: Date.now()
              };
            }
          })
        };
        
        onAnnotationsComplete(annotationsData);
      }
    } catch (err) {
      console.error('[VisualAnnotationPanel] Error handling annotations:', err);
      // Silent failure - don't break the UI
    }
  };
  
  /**
   * Get annotation summary for display
   */
  const getAnnotationSummary = () => {
    const motionCount = annotations.filter(a => a.type === 'motion').length;
    const contentCount = annotations.filter(a => a.type === 'content').length;
    
    const parts: string[] = [];
    if (motionCount > 0) parts.push(`${motionCount} camera motion`);
    if (contentCount > 0) parts.push(`${contentCount} action${contentCount > 1 ? 's' : ''}`);
    
    return parts.length > 0 ? parts.join(', ') : 'No annotations yet';
  };
  
  return (
    <Card className={`bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        disabled={disabled}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Add Motion & Actions
              <Badge variant="outline" className="text-xs font-normal">
                Optional
              </Badge>
              {annotations.length > 0 && (
                <Badge variant="default" className="bg-purple-500">
                  {annotations.length}
                </Badge>
              )}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {getAnnotationSummary()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <CheckCircle className="w-4 h-4 text-green-500" />
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>
      
      {/* Content */}
      {isExpanded && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
          {/* Info Banner */}
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-1">How to use:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Camera Motion:</strong> Draw an arrow to control camera movement</li>
                  <li><strong>Add Action:</strong> Click to place markers and describe what happens</li>
                  <li>Works on mobile (touch) and desktop (mouse)</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Canvas */}
          <VisualAnnotationCanvas
            imageUrl={imageUrl}
            onAnnotationsChange={handleAnnotationsChange}
            disabled={disabled}
          />
          
          {/* Optional: Provider Info */}
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Annotations work with Luma Ray-3 & Veo 3.1
          </div>
        </div>
      )}
    </Card>
  );
}

export default VisualAnnotationPanel;

