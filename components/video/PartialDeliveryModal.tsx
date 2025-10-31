'use client';

import React from 'react';
import { X, CheckCircle2, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PartialDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveredVideo: {
    url: string;
    s3Key: string;
  };
  pricing: {
    original: number;      // 550 credits ($5.50)
    charged: number;       // 350 credits ($3.50)
    refunded: number;      // 200 credits ($2.00)
  };
  rejectionReason?: string;
  onDownload?: () => void;
  onRetry?: () => void;
}

/**
 * Partial Delivery Modal
 * 
 * Shows user what they received after partial delivery
 * USER-FACING: Simple, clear messaging - NO provider names or technical details
 * 
 * Message: "Premium quality delivered" not "Runway upscaled master scene"
 */
export function PartialDeliveryModal({
  isOpen,
  onClose,
  deliveredVideo,
  pricing,
  rejectionReason,
  onDownload,
  onRetry
}: PartialDeliveryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background border border-border rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-border p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-500" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-1">
                Premium Quality Master Scene Delivered
              </h3>
              <p className="text-sm text-muted-foreground">
                Character dialog couldn&apos;t be generated due to content guidelines
              </p>
            </div>
          </div>
        </div>
        
        {/* Video Preview */}
        <div className="p-6 border-b border-border">
          <div className="aspect-video bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden">
            <video 
              src={deliveredVideo.url} 
              controls 
              className="w-full h-full"
              autoPlay
              loop
              muted
            >
              Your browser doesn&apos;t support video playback.
            </video>
          </div>
        </div>
        
        {/* Pricing Breakdown */}
        <div className="p-6 bg-muted/30 border-b border-border">
          <h4 className="font-medium mb-3">Pricing Details</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Original charge:</span>
              <span className="font-medium">{pricing.original} credits (${(pricing.original / 100).toFixed(2)})</span>
            </div>
            
            <div className="flex justify-between text-green-600 dark:text-green-500">
              <span className="font-medium">Refunded:</span>
              <span className="font-semibold">-{pricing.refunded} credits (-${(pricing.refunded / 100).toFixed(2)})</span>
            </div>
            
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="font-medium">Final charge:</span>
              <span className="font-semibold text-lg">{pricing.charged} credits (${(pricing.charged / 100).toFixed(2)})</span>
            </div>
          </div>
        </div>
        
        {/* What You Received */}
        <div className="p-6 border-b border-border">
          <h4 className="font-medium mb-3">What You Received</h4>
          
          <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-sm text-green-900 dark:text-green-100">
                Premium Quality Master Scene
              </div>
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                Your master scene has been delivered in Premium quality and saved to your gallery
              </p>
            </div>
          </div>
          
          {rejectionReason && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg mt-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-sm text-amber-900 dark:text-amber-100">
                  Why Character Dialog Wasn&apos;t Generated
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  Content guidelines prevented generation of character dialog scenes
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="p-6 flex gap-3">
          {onDownload && (
            <Button
              onClick={onDownload}
              variant="outline"
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Scene
            </Button>
          )}
          
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              className="flex-1"
            >
              Try Again with Modified Dialog
            </Button>
          )}
          
          <Button
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            Keep Master Scene
          </Button>
        </div>
        
      </div>
    </div>
  );
}

