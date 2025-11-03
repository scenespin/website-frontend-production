/**
 * Mobile Production Banner
 * 
 * Informational banner shown on mobile devices to encourage desktop use
 * for advanced production features while allowing basic scene generation on mobile.
 * 
 * Feature 0069: Mobile-Optimized Production Page
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Monitor, Sparkles, Film, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface MobileProductionBannerProps {
  onNavigateToTimeline?: () => void;
  showTimelineLink?: boolean;
}

export function MobileProductionBanner({ 
  onNavigateToTimeline,
  showTimelineLink = true 
}: MobileProductionBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = typeof window !== 'undefined' && localStorage.getItem('mobileProdBannerDismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mobileProdBannerDismissed', 'true');
    }
  };

  if (isDismissed) return null;

  return (
    <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20 mb-6 relative">
      <CardContent className="py-4">
        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-amber-200 dark:hover:bg-amber-900/40 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-amber-900 dark:text-amber-100" />
        </button>

        <div className="flex items-start gap-3 pr-8">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1 flex items-center gap-2">
              💻 Desktop Recommended
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
              Mobile supports quick scene generation. Desktop unlocks all features.
            </p>

            {/* Timeline recommendation */}
            {showTimelineLink && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800">
                <Film className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-900 dark:text-slate-100 mb-1">
                    Edit Your Clips in Timeline!
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
export function MobileProductionBannerCompact({ 
  showTimelineLink = true 
}: { showTimelineLink?: boolean }) {
  return (
    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-500 rounded-lg p-3 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Monitor className="w-4 h-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
          Desktop Recommended
        </p>
      </div>
      <p className="text-xs text-amber-800 dark:text-amber-200 mb-2">
        Mobile shows quick generation only. Desktop has Story Beats, Character Bank, and Premium quality.
      </p>
      {showTimelineLink && (
        <Button
          asChild
          size="sm"
          variant="outline"
          className="h-7 text-xs w-full"
        >
          <Link href="/app/timeline">
            <Sparkles className="w-3 h-3 mr-1" />
            Edit in Timeline
          </Link>
        </Button>
      )}
    </div>
  );
}

