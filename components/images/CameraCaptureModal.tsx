'use client';

import { useEffect } from 'react';
import { X, Camera, RotateCw } from 'lucide-react';
import { useCameraCapture } from '@/hooks/useCameraCapture';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (blob: Blob, dataUrl: string) => void;
}

export function CameraCaptureModal({ isOpen, onClose, onCapture }: CameraCaptureModalProps) {
  const {
    isCapturing,
    capturedImage,
    isSupported,
    videoRef,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    cleanup
  } = useCameraCapture({
    onCapture: (blob, dataUrl) => {
      onCapture(blob, dataUrl);
      cleanup();
      onClose();
    },
    onError: (error) => {
      alert(error);
    }
  });

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }

    return () => {
      cleanup();
    };
  }, [isOpen, capturedImage, startCamera, cleanup]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
      style={{ zIndex: 10000 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          cleanup();
          onClose();
        }
      }}
    >
      <div className="bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-base-content flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Take a Photo
          </h2>
          <button
            onClick={() => {
              cleanup();
              onClose();
            }}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-base-content"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative bg-black aspect-video flex items-center justify-center">
          {!isSupported ? (
            <div className="text-center p-8">
              <p className="text-red-400 mb-2">Camera not supported</p>
              <p className="text-slate-400 text-sm">Your browser or device doesn&apos;t support camera access.</p>
            </div>
          ) : isCapturing ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Camera Controls Overlay */}
              <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
                {/* Switch Camera Button (Mobile) */}
                <button
                  onClick={() => switchCamera('environment')}
                  className="p-3 bg-slate-800/80 hover:bg-slate-700/80 rounded-full transition-colors text-base-content backdrop-blur-sm"
                  title="Switch camera"
                >
                  <RotateCw className="w-5 h-5" />
                </button>

                {/* Capture Button */}
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 bg-white hover:bg-slate-200 rounded-full transition-all shadow-lg flex items-center justify-center"
                  title="Take photo"
                >
                  <div className="w-14 h-14 border-4 border-slate-900 rounded-full" />
                </button>

                {/* Switch to Front Camera (Mobile) */}
                <button
                  onClick={() => switchCamera('user')}
                  className="p-3 bg-slate-800/80 hover:bg-slate-700/80 rounded-full transition-colors text-base-content backdrop-blur-sm"
                  title="Front camera"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
              <p className="text-base-content">Starting camera...</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="px-6 py-4 bg-slate-800/50">
          <p className="text-sm text-slate-400 text-center">
            Click the white button to take a photo, or use the side buttons to switch cameras
          </p>
        </div>
      </div>
    </div>
  );
}

