'use client';

/**
 * Video Thumbnail Component
 * 
 * Generates a thumbnail from a video URL by capturing a frame at 0.5 seconds.
 * Extracted from MediaLibrary.tsx for reuse.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Video } from 'lucide-react';

interface VideoThumbnailProps {
  videoUrl: string;
  fileName?: string;
  className?: string;
}

export function VideoThumbnail({ videoUrl, fileName = 'video', className = '' }: VideoThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || !videoUrl) return;

    let mounted = true;

    const generateThumbnail = () => {
      if (!mounted || !video || !canvas) return;
      try {
        // Set video time to capture first frame
        video.currentTime = 0.5; // Use 0.5 seconds for better frame capture
      } catch (err) {
        console.warn('[VideoThumbnail] Failed to seek video:', err);
      }
    };

    const captureFrame = () => {
      if (!mounted || !video || !canvas) return;
      
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        if (mounted) {
          setThumbnailUrl(dataUrl);
        }
      } catch (err) {
        console.warn('[VideoThumbnail] Failed to capture frame:', err);
      }
    };

    const handleLoadedMetadata = () => {
      if (mounted && video) {
        generateThumbnail();
      }
    };

    const handleSeeked = () => {
      if (mounted) {
        captureFrame();
      }
    };

    const handleLoadedData = () => {
      if (mounted && video) {
        generateThumbnail();
      }
    };

    // Set video source and load
    video.src = videoUrl;
    video.load();

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', (e) => {
      console.warn('[VideoThumbnail] Video load error:', e);
    });

    return () => {
      mounted = false;
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [videoUrl]);

  return (
    <div className={`${className} relative bg-[#1F1F1F] rounded overflow-hidden w-full h-full`}>
      {thumbnailUrl ? (
        <img 
          src={thumbnailUrl} 
          alt={fileName}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Video className="w-8 h-8 text-[#808080]" />
        </div>
      )}
      <video
        ref={videoRef}
        src={videoUrl}
        preload="metadata"
        className="hidden"
        crossOrigin="anonymous"
        onError={(e) => {
          console.warn('[VideoThumbnail] Video load error:', e);
        }}
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

