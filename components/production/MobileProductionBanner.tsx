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
import { Monitor, Sparkles, Film, X, Smartphone } from 'lucide-react';
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
              📱 Mobile-Optimized
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              Full Workflows & Scene Builder available. Desktop adds Characters/Locations/Assets management.
            </p>

            {/* Timeline recommendation */}
            {showTimelineLink && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800">
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
    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-500 rounded-lg p-3 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-500 flex-shrink-0" />
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
          Mobile-Optimized
        </p>
      </div>
      <p className="text-xs text-blue-800 dark:text-blue-200 mb-2">
        Workflows & Scene Builder ready. Desktop adds advanced management tools.
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
            Edit in Timeline
          </Link>
        </Button>
      )}
    </div>
  );
}

