/**
 * Mobile Composition Banner
 * 
 * Informational banner shown on mobile devices to encourage desktop use
 * for advanced compositions while allowing basic compositions on mobile.
 * 
 * Feature 0068: Mobile-Optimized Composition Tiering
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, Monitor, Sparkles, X, Smartphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface MobileCompositionBannerProps {
  onNavigateToTimeline?: () => void;
  showTimelineLink?: boolean;
}

export function MobileCompositionBanner({ 
  onNavigateToTimeline,
  showTimelineLink = true 
}: MobileCompositionBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = typeof window !== 'undefined' && localStorage.getItem('mobileCompBannerDismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mobileCompBannerDismissed', 'true');
    }
  };

  if (isDismissed) return null;

  return (
    <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950/20 mb-6 relative">
      <CardContent className="py-4">
        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-blue-900 dark:text-blue-100" />
        </button>

        <div className="flex items-start gap-3 pr-8">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1 flex items-center gap-2">
              ℹ️ Mobile-Optimized
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              Mobile uses compact dropdowns. Desktop shows visual previews for all layouts.
            </p>

            {/* Timeline recommendation */}
            {showTimelineLink && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-900 dark:text-slate-100 mb-1">
                    Try Timeline Editor Instead!
                  </p>
                  <Button
                    asChild
                    size="sm"
                    variant="default"
                    className="h-7 text-xs"
                    onClick={onNavigateToTimeline}
                  >
                    <Link href="/timeline">
                      Go to Timeline →
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for smaller screens
 */
export function MobileCompositionBannerCompact({ 
  showTimelineLink = true 
}: { showTimelineLink?: boolean }) {
  return (
    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-500 rounded-lg p-3 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-500 flex-shrink-0" />
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
          Mobile-Optimized
        </p>
      </div>
      <p className="text-xs text-blue-800 dark:text-blue-200 mb-2">
        Compact dropdowns for mobile. Visual previews on desktop.
      </p>
      {showTimelineLink && (
        <Button
          asChild
          size="sm"
          variant="outline"
          className="h-7 text-xs w-full"
        >
          <Link href="/timeline">
            <Sparkles className="w-3 h-3 mr-1" />
            Try Timeline Instead
          </Link>
        </Button>
      )}
    </div>
  );
}

