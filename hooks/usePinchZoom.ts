/**
 * Pinch-to-Zoom Hook
 * 
 * Enables pinch zoom gesture on touch devices
 */

import { useEffect, useRef } from 'react';

interface PinchZoomOptions {
  onZoomIn: () => void;
  onZoomOut: () => void;
  minPinchDistance?: number; // Minimum distance to trigger zoom (px)
}

export function usePinchZoom({
  onZoomIn,
  onZoomOut,
  minPinchDistance = 50
}: PinchZoomOptions) {
  const lastPinchDistance = useRef<number | null>(null);
  const isPinching = useRef(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isPinching.current = true;
        const distance = getDistance(e.touches[0], e.touches[1]);
        lastPinchDistance.current = distance;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPinching.current || e.touches.length !== 2) return;
      
      e.preventDefault(); // Prevent default pinch-zoom

      const distance = getDistance(e.touches[0], e.touches[1]);
      const lastDistance = lastPinchDistance.current;

      if (lastDistance === null) return;

      const delta = distance - lastDistance;

      // Zoom in (pinch out)
      if (delta > minPinchDistance) {
        onZoomIn();
        lastPinchDistance.current = distance;
      }
      // Zoom out (pinch in)
      else if (delta < -minPinchDistance) {
        onZoomOut();
        lastPinchDistance.current = distance;
      }
    };

    const handleTouchEnd = () => {
      isPinching.current = false;
      lastPinchDistance.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onZoomIn, onZoomOut, minPinchDistance]);
}

/**
 * Calculate distance between two touch points
 */
function getDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

