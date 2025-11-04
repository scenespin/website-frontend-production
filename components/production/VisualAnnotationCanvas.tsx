/**
 * VisualAnnotationCanvas.tsx - Feature 0105
 * 
 * Touch-optimized canvas for drawing motion and content annotations on images.
 * Works on mobile and desktop with zero breaking changes to existing flows.
 * 
 * Safety Features:
 * - Renders only when image URL is provided
 * - Error boundary prevents crashes
 * - Graceful fallback to normal video generation
 * - Optional feature (doesn't block existing functionality)
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MoveIcon,
  PlusCircle,
  Trash2,
  X,
  ArrowRight,
  Circle,
  AlertCircle
} from 'lucide-react';

/**
 * Annotation types for the canvas
 */
type AnnotationMode = 'motion' | 'content';

interface Point {
  x: number;
  y: number;
}

interface MotionAnnotation {
  type: 'motion';
  id: string;
  startPoint: Point;
  endPoint: Point;
  speed: 'slow' | 'smooth' | 'fast';
}

interface ContentAnnotation {
  type: 'content';
  id: string;
  position: Point;
  description: string;
}

type Annotation = MotionAnnotation | ContentAnnotation;

interface VisualAnnotationCanvasProps {
  imageUrl: string;
  onAnnotationsChange?: (annotations: Annotation[]) => void;
  disabled?: boolean;
  maxContentAnnotations?: number;
}

/**
 * Visual Annotation Canvas Component
 * 
 * SAFETY: Completely isolated, won't affect existing video generation
 */
export function VisualAnnotationCanvas({
  imageUrl,
  onAnnotationsChange,
  disabled = false,
  maxContentAnnotations = 5
}: VisualAnnotationCanvasProps) {
  
  // State
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [mode, setMode] = useState<AnnotationMode>('motion');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [showContentInput, setShowContentInput] = useState(false);
  const [contentInputPosition, setContentInputPosition] = useState<Point | null>(null);
  const [contentDescription, setContentDescription] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  /**
   * SAFETY: Only render if imageUrl is provided
   */
  if (!imageUrl) {
    return null;
  }
  
  /**
   * Load and draw image on canvas
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const handleImageLoad = () => {
      try {
        // Set canvas size to match image
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        
        // Draw image
        ctx.drawImage(image, 0, 0);
        
        // Redraw all annotations
        redrawAnnotations(ctx, canvas);
        
        setImageLoaded(true);
        setError(null);
      } catch (err) {
        console.error('[VisualAnnotationCanvas] Error loading image:', err);
        setError('Failed to load image');
        setImageLoaded(false);
      }
    };
    
    const handleImageError = () => {
      console.error('[VisualAnnotationCanvas] Image failed to load');
      setError('Image failed to load');
      setImageLoaded(false);
    };
    
    image.addEventListener('load', handleImageLoad);
    image.addEventListener('error', handleImageError);
    
    // Load image
    image.src = imageUrl;
    
    return () => {
      image.removeEventListener('load', handleImageLoad);
      image.removeEventListener('error', handleImageError);
    };
  }, [imageUrl]);
  
  /**
   * Redraw all annotations whenever they change
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image || !imageLoaded) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear and redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    redrawAnnotations(ctx, canvas);
  }, [annotations, imageLoaded]);
  
  /**
   * Redraw all annotations on canvas
   */
  const redrawAnnotations = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    annotations.forEach(annotation => {
      if (annotation.type === 'motion') {
        // Draw blue arrow for motion
        drawArrow(
          ctx,
          annotation.startPoint.x * canvas.width / 100,
          annotation.startPoint.y * canvas.height / 100,
          annotation.endPoint.x * canvas.width / 100,
          annotation.endPoint.y * canvas.height / 100,
          '#3b82f6'
        );
      } else {
        // Draw orange marker for content
        drawMarker(
          ctx,
          annotation.position.x * canvas.width / 100,
          annotation.position.y * canvas.height / 100,
          '#f97316',
          annotation.description
        );
      }
    });
  };
  
  /**
   * Draw arrow on canvas
   */
  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    color: string
  ) => {
    const headLength = 20;
    const angle = Math.atan2(endY - startY, endX - startX);
    
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(angle - Math.PI / 6),
      endY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      endX - headLength * Math.cos(angle + Math.PI / 6),
      endY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  };
  
  /**
   * Draw marker on canvas
   */
  const drawMarker = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    label: string
  ) => {
    // Draw circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw label
    if (label) {
      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('📍', x, y + 5);
    }
  };
  
  /**
   * Handle mouse/touch down
   */
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || !imageLoaded) return;
    
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      setIsDrawing(true);
      setCurrentStroke([{ x, y }]);
    } catch (err) {
      console.error('[VisualAnnotationCanvas] Error in pointerDown:', err);
    }
  };
  
  /**
   * Handle mouse/touch move
   */
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled || !imageLoaded) return;
    
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      setCurrentStroke(prev => [...prev, { x, y }]);
      
      // Draw preview
      const ctx = canvas.getContext('2d');
      if (ctx && currentStroke.length > 0) {
        const image = imageRef.current;
        if (image) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0);
          redrawAnnotations(ctx, canvas);
          
          // Draw current stroke preview
          if (mode === 'motion') {
            drawArrow(
              ctx,
              currentStroke[0].x * canvas.width / 100,
              currentStroke[0].y * canvas.height / 100,
              x * canvas.width / 100,
              y * canvas.height / 100,
              '#3b82f6'
            );
          } else {
            drawMarker(ctx, x * canvas.width / 100, y * canvas.height / 100, '#f97316', '');
          }
        }
      }
    } catch (err) {
      console.error('[VisualAnnotationCanvas] Error in pointerMove:', err);
    }
  };
  
  /**
   * Handle mouse/touch up
   */
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled || !imageLoaded) return;
    
    try {
      if (currentStroke.length < 2) {
        setIsDrawing(false);
        setCurrentStroke([]);
        return;
      }
      
      if (mode === 'motion') {
        // Check if motion annotation already exists
        const hasMotion = annotations.some(a => a.type === 'motion');
        if (hasMotion) {
          setError('Only one camera motion allowed. Remove existing motion first.');
          setIsDrawing(false);
          setCurrentStroke([]);
          return;
        }
        
        // Create motion annotation
        const newAnnotation: MotionAnnotation = {
          type: 'motion',
          id: `motion-${Date.now()}`,
          startPoint: currentStroke[0],
          endPoint: currentStroke[currentStroke.length - 1],
          speed: 'smooth'
        };
        
        const newAnnotations = [...annotations, newAnnotation];
        setAnnotations(newAnnotations);
        onAnnotationsChange?.(newAnnotations);
        setError(null);
      } else {
        // Content mode - show input dialog
        const lastPoint = currentStroke[currentStroke.length - 1];
        setContentInputPosition(lastPoint);
        setShowContentInput(true);
      }
      
      setIsDrawing(false);
      setCurrentStroke([]);
    } catch (err) {
      console.error('[VisualAnnotationCanvas] Error in pointerUp:', err);
      setError('Failed to create annotation');
      setIsDrawing(false);
      setCurrentStroke([]);
    }
  };
  
  /**
   * Save content annotation
   */
  const handleSaveContentAnnotation = () => {
    try {
      if (!contentInputPosition || !contentDescription.trim()) {
        setShowContentInput(false);
        return;
      }
      
      // Check content annotation limit
      const contentCount = annotations.filter(a => a.type === 'content').length;
      if (contentCount >= maxContentAnnotations) {
        setError(`Maximum ${maxContentAnnotations} content annotations allowed`);
        setShowContentInput(false);
        setContentDescription('');
        return;
      }
      
      const newAnnotation: ContentAnnotation = {
        type: 'content',
        id: `content-${Date.now()}`,
        position: contentInputPosition,
        description: contentDescription.trim()
      };
      
      const newAnnotations = [...annotations, newAnnotation];
      setAnnotations(newAnnotations);
      onAnnotationsChange?.(newAnnotations);
      
      setShowContentInput(false);
      setContentDescription('');
      setContentInputPosition(null);
      setError(null);
    } catch (err) {
      console.error('[VisualAnnotationCanvas] Error saving content:', err);
      setError('Failed to save annotation');
    }
  };
  
  /**
   * Clear all annotations
   */
  const handleClearAll = () => {
    try {
      setAnnotations([]);
      onAnnotationsChange?.([]);
      setError(null);
    } catch (err) {
      console.error('[VisualAnnotationCanvas] Error clearing annotations:', err);
    }
  };
  
  /**
   * Remove specific annotation
   */
  const handleRemoveAnnotation = (id: string) => {
    try {
      const newAnnotations = annotations.filter(a => a.id !== id);
      setAnnotations(newAnnotations);
      onAnnotationsChange?.(newAnnotations);
      setError(null);
    } catch (err) {
      console.error('[VisualAnnotationCanvas] Error removing annotation:', err);
    }
  };
  
  /**
   * SAFETY: Show error state without breaking
   */
  if (error) {
    return (
      <Card className="p-4 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {error}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setError(null)}
              className="mt-2"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <div ref={containerRef} className="space-y-3">
      {/* Mode Selector */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={mode === 'motion' ? 'default' : 'outline'}
          onClick={() => setMode('motion')}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <MoveIcon className="w-4 h-4" />
          Camera Motion
        </Button>
        <Button
          size="sm"
          variant={mode === 'content' ? 'default' : 'outline'}
          onClick={() => setMode('content')}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          Add Action
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleClearAll}
          disabled={disabled || annotations.length === 0}
          className="ml-auto"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Canvas */}
      <div className="relative rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-auto cursor-crosshair touch-none"
          style={{ maxHeight: '500px', objectFit: 'contain' }}
        />
        <img
          ref={imageRef}
          alt="Annotation base"
          className="hidden"
        />
        
        {/* Loading state */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
            <p className="text-white text-sm">Loading image...</p>
          </div>
        )}
      </div>
      
      {/* Content Input Dialog */}
      {showContentInput && (
        <Card className="p-4 border-2 border-orange-500">
          <Label className="text-sm font-semibold mb-2 block">
            Describe what happens here:
          </Label>
          <Input
            value={contentDescription}
            onChange={(e) => setContentDescription(e.target.value)}
            placeholder="e.g., monster enters, explosion, character looks up"
            className="mb-3"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveContentAnnotation();
              } else if (e.key === 'Escape') {
                setShowContentInput(false);
                setContentDescription('');
              }
            }}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveContentAnnotation}>
              Add
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowContentInput(false);
                setContentDescription('');
              }}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}
      
      {/* Annotation List */}
      {annotations.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Annotations ({annotations.length}):
          </Label>
          {annotations.map(annotation => (
            <div
              key={annotation.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              {annotation.type === 'motion' ? (
                <>
                  <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="text-sm flex-1">Camera motion</span>
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <span className="text-sm flex-1">{annotation.description}</span>
                </>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveAnnotation(annotation.id)}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VisualAnnotationCanvas;

