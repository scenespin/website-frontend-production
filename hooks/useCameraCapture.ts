import { useState, useRef, useCallback } from 'react';

export interface UseCameraCaptureOptions {
  onCapture?: (blob: Blob, dataUrl: string) => void;
  onError?: (error: string) => void;
}

export const useCameraCapture = (options: UseCameraCaptureOptions = {}) => {
  const { onCapture, onError } = options;
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Check if camera API is supported
  const checkSupport = useCallback(() => {
    const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    setIsSupported(supported);
    return supported;
  }, []);

  // Start camera stream
  const startCamera = useCallback(async () => {
    if (!checkSupport()) {
      onError?.('Camera is not supported on this device or browser.');
      return;
    }

    try {
      setIsCapturing(true);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Use front camera on mobile, can switch to 'environment' for back
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);
      
      // Attach to video element if provided
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      console.log('[CameraCapture] Camera started successfully');
    } catch (error: any) {
      console.error('[CameraCapture] Failed to start camera:', error);
      
      let errorMessage = 'Failed to access camera.';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera is already in use by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints could not be satisfied.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Camera access requires HTTPS or localhost.';
      }
      
      onError?.(errorMessage);
      setIsCapturing(false);
    }
  }, [checkSupport, onError]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCapturing(false);
    console.log('[CameraCapture] Camera stopped');
  }, [stream]);

  // Capture photo from video stream
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !stream) {
      onError?.('No active camera stream to capture from.');
      return;
    }

    try {
      // Create canvas to draw video frame
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (!context) {
        onError?.('Failed to create canvas context.');
        return;
      }
      
      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob and data URL
      canvas.toBlob((blob) => {
        if (blob) {
          const dataUrl = canvas.toDataURL('image/png');
          setCapturedImage(dataUrl);
          onCapture?.(blob, dataUrl);
          console.log('[CameraCapture] Photo captured successfully');
        } else {
          onError?.('Failed to create image blob.');
        }
      }, 'image/png');
      
    } catch (error) {
      console.error('[CameraCapture] Failed to capture photo:', error);
      onError?.('Failed to capture photo. Please try again.');
    }
  }, [stream, onCapture, onError]);

  // Switch between front and back camera (mobile)
  const switchCamera = useCallback(async (facingMode: 'user' | 'environment') => {
    stopCamera();
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error: any) {
      console.error('[CameraCapture] Failed to switch camera:', error);
      onError?.('Failed to switch camera. This device may only have one camera.');
      
      // Try to restart with default camera
      startCamera();
    }
  }, [startCamera, stopCamera, onError]);

  // Clean up on unmount
  const cleanup = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
  }, [stopCamera]);

  return {
    isCapturing,
    stream,
    capturedImage,
    isSupported,
    videoRef,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    cleanup
  };
};

