'use client';

/**
 * ImageViewer - Advanced shared image and video viewer component
 * 
 * Features:
 * - Next/Previous navigation (keyboard + mouse)
 * - Image counter (X of Y)
 * - Toggleable thumbnail strip
 * - Advanced zoom (pinch, drag, wheel) for images
 * - True fullscreen mode (browser Fullscreen API)
 * - Smooth transitions
 * - Group navigation with "View All" option
 * - Download functionality
 * - Delete functionality (optional)
 * - Video support with integrated VideoPlayer
 * - Image preloading for faster navigation
 * - Optimized performance with memoization
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Trash2, Maximize2, Minimize2, ZoomIn, ZoomOut, Grid3x3, Video as VideoIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import { VideoPlayer } from './VideoPlayer';

export interface ImageItem {
  id: string;
  url: string;
  label: string;
  s3Key?: string;
  metadata?: any;
  type?: 'image' | 'video'; // Media type
  thumbnailUrl?: string; // Optional thumbnail for videos
}

interface ImageViewerProps {
  images: ImageItem[]; // Current group images
  allImages?: ImageItem[]; // All images (for "View All" option)
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (index: number) => void;
  onDownload?: (image: ImageItem) => Promise<void>;
  onDelete?: (image: ImageItem) => Promise<void>;
  groupName?: string; // e.g., "Casual Outfit", "Night • Rainy"
  showThumbnails?: boolean; // Default: false (toggleable)
  enableFullscreen?: boolean; // Default: true
  enableZoom?: boolean; // Default: true
}

export function ImageViewer({
  images,
  allImages,
  currentIndex: initialIndex,
  isOpen,
  onClose,
  onNavigate,
  onDownload,
  onDelete,
  groupName,
  showThumbnails: initialShowThumbnails = false,
  enableFullscreen = true,
  enableZoom = true,
}: ImageViewerProps) {
  const [viewAll, setViewAll] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showThumbnails, setShowThumbnails] = useState(initialShowThumbnails);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
  const [preloadedUrls, setPreloadedUrls] = useState<Set<string>>(new Set());
  const { getToken } = useAuth();
  
  // Detect media type from URL or metadata
  const getMediaType = useCallback((item: ImageItem): 'image' | 'video' => {
    if (item.type) return item.type;
    const url = item.url?.toLowerCase() || '';
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    return videoExtensions.some(ext => url.includes(ext)) ? 'video' : 'image';
  }, []);

  // Generate presigned URL from s3Key if URL is missing or fails
  const getImageUrl = useCallback(async (image: ImageItem): Promise<string> => {
    // If we already have a cached URL, use it
    if (imageUrls.has(image.id)) {
      return imageUrls.get(image.id)!;
    }
    
    // If URL exists and looks valid, use it
    if (image.url && image.url.startsWith('http')) {
      return image.url;
    }
    
    // If we have s3Key, generate presigned URL
    if (image.s3Key) {
      try {
        const token = await getToken({ template: 'wryda-backend' });
        if (!token) throw new Error('Not authenticated');
        
        const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
        const response = await fetch(`${BACKEND_API_URL}/api/s3/download-url`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            s3Key: image.s3Key,
            expiresIn: 3600, // 1 hour
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.downloadUrl) {
            setImageUrls(prev => new Map(prev).set(image.id, data.downloadUrl));
            return data.downloadUrl;
          }
        }
      } catch (error) {
        console.error('[ImageViewer] Failed to generate presigned URL:', error);
      }
    }
    
    // Fallback to provided URL or empty string
    return image.url || '';
  }, [imageUrls, getToken]);
  
  // Detect touch device
  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouchDevice();
    window.addEventListener('resize', checkTouchDevice);
    return () => window.removeEventListener('resize', checkTouchDevice);
  }, []);
  
  // Determine which image list to use (memoized for performance)
  const displayImages = useMemo(() => {
    return viewAll && allImages ? allImages : images;
  }, [viewAll, allImages, images]);

  // Preload next and previous images for faster navigation
  useEffect(() => {
    if (!isOpen || displayImages.length === 0) return;

    const preloadUrls: string[] = [];
    
    // Preload next image
    if (currentIndex < displayImages.length - 1) {
      const nextImage = displayImages[currentIndex + 1];
      if (nextImage && getMediaType(nextImage) === 'image') {
        preloadUrls.push(nextImage.url);
      }
    }
    
    // Preload previous image
    if (currentIndex > 0) {
      const prevImage = displayImages[currentIndex - 1];
      if (prevImage && getMediaType(prevImage) === 'image') {
        preloadUrls.push(prevImage.url);
      }
    }

    // Preload images
    preloadUrls.forEach(url => {
      if (url && !preloadedUrls.has(url)) {
        const img = new Image();
        img.src = url;
        setPreloadedUrls(prev => new Set(prev).add(url));
      }
    });
  }, [isOpen, currentIndex, displayImages, preloadedUrls, getMediaType]);
  
  // When switching between group and all, find the current image in the new list
  useEffect(() => {
    if (!isOpen) return;
    
    const currentImage = images[currentIndex];
    if (!currentImage) return;
    
    if (viewAll && allImages) {
      // Find current image in allImages
      const newIndex = allImages.findIndex(img => img.id === currentImage.id || img.url === currentImage.url);
      if (newIndex >= 0) {
        setCurrentIndex(newIndex);
      }
    } else {
      // Already in group view, index should match
      if (currentIndex >= 0 && currentIndex < images.length) {
        setCurrentIndex(currentIndex);
      }
    }
  }, [viewAll, isOpen]);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  // Update current index when prop changes
  useEffect(() => {
    if (isOpen && initialIndex >= 0 && initialIndex < displayImages.length) {
      setCurrentIndex(initialIndex);
      setZoom(1); // Always reset zoom when opening
      setPosition({ x: 0, y: 0 });
      setIsLoading(true);
    }
  }, [isOpen, initialIndex, displayImages.length]);

  // Get current image with resolved URL
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');

  // Memoize current image and media type for performance (must be before useEffects that use them)
  const currentImage = useMemo(() => displayImages[currentIndex], [displayImages, currentIndex]);
  const currentMediaType = useMemo(() => currentImage ? getMediaType(currentImage) : 'image', [currentImage, getMediaType]);

  // Generate presigned URL when media changes or URL is missing/expired
  useEffect(() => {
    if (!isOpen || !currentImage) {
      setCurrentImageUrl('');
      setIsLoading(false);
      return;
    }

    const loadMediaUrl = async () => {
      setIsLoading(true);
      try {
        // For videos, use URL directly or generate presigned URL
        // For images, use getImageUrl which handles caching
        if (currentMediaType === 'video') {
          // Videos might need presigned URLs too
          if (currentImage.s3Key && (!currentImage.url || !currentImage.url.startsWith('http'))) {
            const url = await getImageUrl(currentImage);
            setCurrentImageUrl(url);
          } else {
            setCurrentImageUrl(currentImage.url || '');
          }
          // Videos handle their own loading state
          setIsLoading(false);
        } else {
          const url = await getImageUrl(currentImage);
          setCurrentImageUrl(url);
          // Image onLoad will set isLoading to false
        }
      } catch (error) {
        console.error('[ImageViewer] Failed to load media URL:', error);
        setCurrentImageUrl(currentImage.url || '');
        setIsLoading(false);
      }
    };

    loadMediaUrl();
  }, [isOpen, currentIndex, currentImage, currentMediaType, getImageUrl]);

  // Keyboard navigation (only when not in video player controls)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Don't intercept video player keyboard shortcuts when video is playing
      if (currentMediaType === 'video' && e.target instanceof HTMLVideoElement) {
        return;
      }

      if (e.key === 'Escape') {
        if (isFullscreen) {
          exitFullscreen();
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if ((e.key === '+' || e.key === '=') && currentMediaType === 'image') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' && currentMediaType === 'image') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0' && currentMediaType === 'image') {
        e.preventDefault();
        handleResetZoom();
      } else if (e.key === 'f' || e.key === 'F') {
        if (enableFullscreen) {
          e.preventDefault();
          toggleFullscreen();
        }
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setShowThumbnails(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, displayImages.length, isFullscreen, enableFullscreen, currentMediaType, handlePrevious, handleNext, handleZoomIn, handleZoomOut, handleResetZoom, toggleFullscreen, exitFullscreen, onClose]);

  // Fullscreen API handlers
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const enterFullscreen = async () => {
    if (!fullscreenRef.current) return;
    
    try {
      if (fullscreenRef.current.requestFullscreen) {
        await fullscreenRef.current.requestFullscreen();
      } else if ((fullscreenRef.current as any).webkitRequestFullscreen) {
        await (fullscreenRef.current as any).webkitRequestFullscreen();
      } else if ((fullscreenRef.current as any).mozRequestFullScreen) {
        await (fullscreenRef.current as any).mozRequestFullScreen();
      } else if ((fullscreenRef.current as any).msRequestFullscreen) {
        await (fullscreenRef.current as any).msRequestFullscreen();
      }
    } catch (error) {
      console.error('[ImageViewer] Failed to enter fullscreen:', error);
      toast.error('Fullscreen not supported');
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (error) {
      console.error('[ImageViewer] Failed to exit fullscreen:', error);
    }
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };

  const handleNext = useCallback(() => {
    if (currentIndex < displayImages.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setZoom(1); // Reset zoom when navigating
      setPosition({ x: 0, y: 0 });
      setIsLoading(true);
      onNavigate?.(newIndex);
    }
  }, [currentIndex, displayImages.length, onNavigate]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setZoom(1); // Reset zoom when navigating
      setPosition({ x: 0, y: 0 });
      setIsLoading(true);
      onNavigate?.(newIndex);
    }
  }, [currentIndex, onNavigate]);

  // Zoom handlers
  const handleZoomIn = () => {
    if (enableZoom) {
      setZoom(prev => Math.min(prev + 0.25, 5));
    }
  };

  const handleZoomOut = () => {
    if (enableZoom) {
      setZoom(prev => Math.max(prev - 0.25, 0.5));
    }
  };

  const handleResetZoom = () => {
    if (enableZoom) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  // Wheel zoom - use ref and addEventListener to make it non-passive
  useEffect(() => {
    if (!enableZoom || !containerRef.current) return;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.max(0.5, Math.min(5, prev + delta)));
    };
    
    const container = containerRef.current;
    // Add event listener with { passive: false } to allow preventDefault
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [enableZoom]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1 && enableZoom) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for pinch zoom
  const touchStartRef = useRef<{ distance: number; center: { x: number; y: number } } | null>(null);

  const getTouchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touches: React.TouchList) => {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && enableZoom) {
      const distance = getTouchDistance(e.touches);
      const center = getTouchCenter(e.touches);
      touchStartRef.current = { distance, center };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartRef.current && enableZoom) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      const scale = distance / touchStartRef.current.distance;
      setZoom(prev => Math.max(0.5, Math.min(5, prev * scale)));
      touchStartRef.current.distance = distance;
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  // Swipe navigation
  const swipeStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleSwipeStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      swipeStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }
  };

  const handleSwipeEnd = (e: React.TouchEvent) => {
    if (!swipeStartRef.current || e.changedTouches.length === 0) return;
    
    const deltaX = e.changedTouches[0].clientX - swipeStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - swipeStartRef.current.y;
    const deltaTime = Date.now() - swipeStartRef.current.time;
    
    // Only handle horizontal swipes if zoom is at 1x
    if (zoom === 1 && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50 && deltaTime < 300) {
      if (deltaX > 0) {
        handlePrevious();
      } else {
        handleNext();
      }
    }
    
    swipeStartRef.current = null;
  };

  const canNavigatePrevious = currentIndex > 0;
  const canNavigateNext = currentIndex < displayImages.length - 1;

  if (!isOpen || !currentImage) return null;

  return (
    <AnimatePresence>
      <div
        ref={fullscreenRef}
        className="fixed inset-0 bg-black/95 z-[100] flex flex-col group p-4"
        onClick={(e) => {
          // Close on background click (not on image or controls)
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* Container with border for visual containment */}
        <div className="flex-1 flex flex-col bg-[#0A0A0A] border-2 border-[#3F3F46] rounded-lg overflow-hidden shadow-2xl relative">
        {/* Header - Minimal, shows on hover */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 transition-opacity group-hover:opacity-100 opacity-70 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-white truncate max-w-md">
                {currentImage.label}
              </h3>
              {groupName && !viewAll && (
                <span className="text-sm text-[#808080] px-2 py-1 bg-[#1F1F1F] rounded">
                  {groupName}
                </span>
              )}
              {allImages && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewAll(prev => !prev);
                    setZoom(1);
                    setPosition({ x: 0, y: 0 });
                  }}
                  className={`text-sm px-3 py-1 rounded transition-colors ${
                    viewAll
                      ? 'bg-[#DC143C] text-white'
                      : 'bg-[#1F1F1F] text-[#808080] hover:text-white'
                  }`}
                >
                  {viewAll ? 'View Group' : 'View All'}
                </button>
              )}
              <span className="text-sm text-[#808080]">
                {currentIndex + 1} of {displayImages.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onDownload && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(currentImage);
                  }}
                  className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors"
                  aria-label="Download"
                >
                  <Download className="w-5 h-5 text-white" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this image? This action cannot be undone.')) {
                      onDelete(currentImage);
                    }
                  }}
                  className="p-2 hover:bg-[#DC143C]/20 rounded-lg transition-colors"
                  aria-label="Delete"
                >
                  <Trash2 className="w-5 h-5 text-[#DC143C]" />
                </button>
              )}
              {enableFullscreen && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFullscreen();
                  }}
                  className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors"
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-5 h-5 text-white" />
                  ) : (
                    <Maximize2 className="w-5 h-5 text-white" />
                  )}
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Image Area */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          {/* Navigation Arrows */}
          {canNavigatePrevious && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-4 z-20 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors group"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6 text-white group-hover:text-[#DC143C]" />
            </button>
          )}
          {canNavigateNext && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 z-20 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors group"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6 text-white group-hover:text-[#DC143C]" />
            </button>
          )}

          {/* Media Container */}
          <div
            ref={containerRef}
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
            onMouseDown={currentMediaType === 'image' ? handleMouseDown : undefined}
            onMouseMove={currentMediaType === 'image' ? handleMouseMove : undefined}
            onMouseUp={currentMediaType === 'image' ? handleMouseUp : undefined}
            onMouseLeave={currentMediaType === 'image' ? handleMouseUp : undefined}
            onTouchStart={(e) => {
              if (currentMediaType === 'image') {
                handleTouchStart(e);
                handleSwipeStart(e);
              }
            }}
            onTouchMove={currentMediaType === 'image' ? handleTouchMove : undefined}
            onTouchEnd={(e) => {
              if (currentMediaType === 'image') {
                handleTouchEnd();
                handleSwipeEnd(e);
              }
            }}
            style={{ cursor: currentMediaType === 'image' && zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            <AnimatePresence mode="wait">
              {currentMediaType === 'video' ? (
                <motion.div
                  key={`video-${currentImage.id}`}
                  className="w-full h-full flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isLoading ? 0.5 : 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <VideoPlayer
                    src={currentImageUrl || currentImage.url}
                    className="max-w-full max-h-full"
                    autoPlay={false}
                    onError={(error) => {
                      console.error('[ImageViewer] Video failed to load:', error);
                      toast.error('Video failed to load');
                      setIsLoading(false);
                    }}
                  />
                  {/* Video loading is handled by VideoPlayer component */}
                </motion.div>
              ) : (
                <motion.img
                  key={`image-${currentImage.id}`}
                  ref={imageRef}
                  src={currentImageUrl || currentImage.url}
                  alt={currentImage.label}
                  className="max-w-full max-h-full object-contain select-none"
                  style={{
                    transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isLoading ? 0.5 : 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onLoad={() => setIsLoading(false)}
                  onError={async (e) => {
                    console.error('[ImageViewer] Image failed to load:', currentImageUrl || currentImage.url);
                    // Try to generate presigned URL if we have s3Key and URL failed
                    if (currentImage.s3Key && !currentImageUrl.includes('presigned')) {
                      try {
                        const url = await getImageUrl(currentImage);
                        if (url && url !== currentImageUrl) {
                          setCurrentImageUrl(url);
                          return; // Retry with new URL
                        }
                      } catch (error) {
                        console.error('[ImageViewer] Failed to generate presigned URL on error:', error);
                      }
                    }
                    toast.error('Image failed to load');
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  draggable={false}
                />
              )}
            </AnimatePresence>

            {/* Loading Indicator - Only for images (videos handle their own loading) */}
            {isLoading && currentMediaType === 'image' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#DC143C] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Media Type Indicator */}
            {currentMediaType === 'video' && (
              <div className="absolute top-4 right-4 z-20 px-3 py-1.5 bg-[#DC143C]/90 backdrop-blur-sm rounded-lg flex items-center gap-2">
                <VideoIcon className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">Video</span>
              </div>
            )}

            {/* Zoom Controls - Only show on touch devices (mobile/tablet) and for images */}
            {enableZoom && zoom !== 1 && isTouchDevice && currentMediaType === 'image' && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-2 bg-black/70 px-4 py-2 rounded-lg">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomOut();
                  }}
                  className="p-1 hover:bg-[#1F1F1F] rounded transition-colors"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-4 h-4 text-white" />
                </button>
                <span className="text-white text-sm min-w-[60px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomIn();
                }}
                  className="p-1 hover:bg-[#1F1F1F] rounded transition-colors"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetZoom();
                  }}
                  className="px-2 py-1 hover:bg-[#1F1F1F] rounded transition-colors text-white text-xs"
                  aria-label="Reset zoom"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail Strip - Toggleable */}
        <AnimatePresence>
          {showThumbnails && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 to-transparent p-4 rounded-b-lg"
            >
              <div className="w-full">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#3F3F46] scrollbar-track-transparent">
                  {displayImages.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(idx);
                        setZoom(1);
                        setPosition({ x: 0, y: 0 });
                        setIsLoading(true);
                        onNavigate?.(idx);
                      }}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all relative ${
                        idx === currentIndex
                          ? 'border-[#DC143C] ring-2 ring-[#DC143C]/50'
                          : 'border-[#3F3F46] hover:border-[#808080]'
                      }`}
                    >
                      {getMediaType(img) === 'video' ? (
                        <>
                          <img
                            src={img.thumbnailUrl || img.url}
                            alt={img.label}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <VideoIcon className="w-6 h-6 text-white" />
                          </div>
                        </>
                      ) : (
                        <img
                          src={img.url}
                          alt={img.label}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Controls Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowThumbnails(prev => !prev);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  showThumbnails
                    ? 'bg-[#DC143C] text-white'
                    : 'bg-[#1F1F1F] text-[#808080] hover:text-white'
                }`}
                aria-label={showThumbnails ? 'Hide thumbnails' : 'Show thumbnails'}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              {enableZoom && currentMediaType === 'image' && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleZoomOut();
                    }}
                    className="p-2 bg-[#1F1F1F] text-[#808080] hover:text-white rounded-lg transition-colors"
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleZoomIn();
                    }}
                    className="p-2 bg-[#1F1F1F] text-[#808080] hover:text-white rounded-lg transition-colors"
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  {zoom !== 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResetZoom();
                      }}
                      className="px-3 py-2 bg-[#1F1F1F] text-white text-sm rounded-lg hover:bg-[#2A2A2A] transition-colors"
                    >
                      Reset ({Math.round(zoom * 100)}%)
                    </button>
                  )}
                </>
              )}
            </div>
            <div className="text-sm text-[#808080]">
              Use arrow keys to navigate • {enableZoom && currentMediaType === 'image' && 'Scroll to zoom • '}Press T for thumbnails • Press F for fullscreen
            </div>
          </div>
        </div>
        </div>
        {/* End of bordered container */}
      </div>
    </AnimatePresence>
  );
}

