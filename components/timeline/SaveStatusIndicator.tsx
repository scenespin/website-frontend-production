/**
 * SaveStatusIndicator - Shows timeline save status
 * 
 * Displays real-time save status with visual feedback
 * Includes offline warnings and retry queue information
 * 
 * STORAGE PROVIDERS: GitHub, Google Drive, Dropbox - FEATURE THESE PROMINENTLY!
 * WRAPPER STRATEGY: Only applies to AI providers (Runway, Luma, etc.) - NEVER mention those
 */

'use client';

import { useEffect, useState } from 'react';
import type { SaveStatus } from '@/hooks/useTimeline';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  lastSaved: Date | null;
  isOnline: boolean;
  queueLength?: number;
  className?: string;
}

export function SaveStatusIndicator({
  status,
  lastSaved,
  isOnline,
  queueLength = 0,
  className = ''
}: SaveStatusIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');

  // Update "time ago" display
  useEffect(() => {
    if (!lastSaved) {
      setTimeAgo('');
      return;
    }

    const updateTimeAgo = () => {
      const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
      
      if (seconds < 10) {
        setTimeAgo('just now');
      } else if (seconds < 60) {
        setTimeAgo(`${seconds}s ago`);
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        setTimeAgo(`${minutes}m ago`);
      } else {
        const hours = Math.floor(seconds / 3600);
        setTimeAgo(`${hours}h ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);

    return () => clearInterval(interval);
  }, [lastSaved]);

  // Status icon and color
  const getStatusDisplay = () => {
    if (!isOnline) {
      return {
        icon: '📡',
        text: 'Offline',
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        detail: 'Changes saved locally'
      };
    }

    switch (status) {
      case 'saving':
        return {
          icon: '💾',
          text: 'Saving',
          color: 'text-[#DC143C]',
          bg: 'bg-[#DC143C]/10',
          detail: 'Syncing to GitHub...'  // ← Show "GitHub" proudly!
        };
      
      case 'saved':
        return {
          icon: '✅',
          text: 'Saved',
          color: 'text-green-500',
          bg: 'bg-green-500/10',
          detail: timeAgo ? `Saved to GitHub ${timeAgo}` : 'Saved to GitHub'  // ← Show "GitHub"!
        };
      
      case 'failed':
        return {
          icon: '⚠️',
          text: 'Failed',
          color: 'text-red-500',
          bg: 'bg-red-500/10',
          detail: queueLength > 0 ? `${queueLength} pending retries` : 'Retrying GitHub sync...'
        };
      
      case 'offline':
        return {
          icon: '📡',
          text: 'Offline',
          color: 'text-orange-500',
          bg: 'bg-orange-500/10',
          detail: 'Saved locally, will sync to GitHub when online'  // ← Show "GitHub"!
        };
      
      case 'pending':
        return {
          icon: '⏳',
          text: 'Pending',
          color: 'text-yellow-500',
          bg: 'bg-yellow-500/10',
          detail: 'Preparing to save...'
        };
      
      default:
        return {
          icon: '💾',
          text: 'Unknown',
          color: 'text-base-content/50',
          bg: 'bg-base-content/10',
          detail: ''
        };
    }
  };

  const display = getStatusDisplay();

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${display.bg} ${className}`}>
      <span className="text-sm">{display.icon}</span>
      <div className="flex flex-col">
        <span className={`text-xs font-medium ${display.color}`}>
          {display.text}
        </span>
        {display.detail && (
          <span className="text-[10px] text-base-content/50">
            {display.detail}
          </span>
        )}
      </div>
      
      {/* Show queue indicator if there are pending saves */}
      {queueLength > 0 && (
        <div className="ml-1 flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-base-content text-[10px] font-bold">
          {queueLength}
        </div>
      )}
      
      {/* Animated pulse for saving status */}
      {status === 'saving' && (
        <div className="ml-1 w-2 h-2 rounded-full bg-[#DC143C] animate-pulse" />
      )}
    </div>
  );
}

/**
 * Compact version for toolbar
 */
export function CompactSaveStatus({
  status,
  isOnline,
  queueLength = 0
}: Omit<SaveStatusIndicatorProps, 'lastSaved' | 'className'>) {
  const getIcon = () => {
    if (!isOnline) return '📡';
    
    switch (status) {
      case 'saving':
        return '💾';
      case 'saved':
        return '✅';
      case 'failed':
        return '⚠️';
      case 'offline':
        return '📡';
      case 'pending':
        return '⏳';
      default:
        return '💾';
    }
  };

  const getColor = () => {
    if (!isOnline) return 'text-orange-500';
    
    switch (status) {
      case 'saving':
        return 'text-[#DC143C]';
      case 'saved':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      case 'offline':
        return 'text-orange-500';
      case 'pending':
        return 'text-yellow-500';
      default:
        return 'text-base-content/50';
    }
  };

  return (
    <div className="relative">
      <span className={`text-lg ${getColor()}`}>
        {getIcon()}
      </span>
      
      {queueLength > 0 && (
        <div className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-base-content text-[8px] font-bold">
          {queueLength > 9 ? '9+' : queueLength}
        </div>
      )}
      
      {status === 'saving' && (
        <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-[#DC143C] animate-pulse" />
      )}
    </div>
  );
}

/**
 * Banner for offline mode
 */
export function OfflineBanner({
  isOnline,
  queueLength = 0
}: {
  isOnline: boolean;
  queueLength?: number;
}) {
  if (isOnline) return null;

  return (
    <div className="bg-orange-500/10 border-l-4 border-orange-500 p-4 mb-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">📡</span>
        <div>
          <h3 className="font-semibold text-orange-700 dark:text-orange-300">
            You&apos;re Offline
          </h3>
          <p className="text-sm text-orange-600 dark:text-orange-400">
            Don&apos;t worry! Your changes are being saved locally and will sync automatically when you&apos;re back online.
            {queueLength > 0 && ` (${queueLength} changes waiting to sync)`}
          </p>
        </div>
      </div>
    </div>
  );
}

