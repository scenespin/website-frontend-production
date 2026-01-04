'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Link from 'next/link';

export function MobileBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if banner was dismissed
    const dismissed = localStorage.getItem('mobile-banner-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      return;
    }

    // Check if device is mobile (viewport width < 768px)
    const checkMobile = () => {
      if (window.innerWidth < 768) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Check on mount
    checkMobile();

    // Check on resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('mobile-banner-dismissed', 'true');
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#141414] border-b border-[#3F3F46] px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <div className="flex-1">
          <p className="text-sm text-gray-300">
            <span className="font-semibold text-white">For the best experience,</span> please use a desktop or laptop computer.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Mobile experience coming soon. You can continue, but some features may not work optimally.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Dismiss banner"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

