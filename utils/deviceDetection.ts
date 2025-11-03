/**
 * Device Detection Utility
 * 
 * Detects device type (mobile/tablet/desktop) for responsive feature tiering.
 * Used to simplify Composition Studio on mobile while keeping Timeline fully functional.
 * 
 * Feature 0068: Mobile-Optimized Composition Tiering
 */

/**
 * Check if current device is a mobile phone
 * 
 * @returns True if mobile device (phone)
 */
export function isMobileDevice(): boolean {
  // SSR safety
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  // Check user agent for mobile patterns (PRIMARY detection)
  const mobileUserAgentPattern = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isMobileUserAgent = mobileUserAgentPattern.test(navigator.userAgent);

  // ONLY rely on user agent for true mobile detection
  // Do NOT use width alone, as desktop browsers can be resized
  return isMobileUserAgent;
}

/**
 * Check if current device is a tablet
 * 
 * @returns True if tablet device (iPad, Android tablet)
 */
export function isTablet(): boolean {
  // SSR safety
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  // Check user agent for tablet patterns
  const tabletUserAgentPattern = /iPad|Android/i;
  const isTabletUserAgent = tabletUserAgentPattern.test(navigator.userAgent);

  // Check if NOT a phone (tablets have "Android" but larger screens)
  const isNotPhone = !/Mobile/i.test(navigator.userAgent);

  // Check screen width (tablet range)
  const isTabletWidth = window.innerWidth >= 768 && window.innerWidth < 1024;

  // Device is tablet if it has tablet user agent AND not a phone AND tablet-sized screen
  return isTabletUserAgent && isNotPhone && isTabletWidth;
}

/**
 * Check if current device is a desktop/laptop
 * 
 * @returns True if desktop device
 */
export function isDesktop(): boolean {
  // SSR safety
  if (typeof window === 'undefined') {
    return true; // Default to desktop for SSR
  }

  // Desktop is anything that's not mobile or tablet
  return !isMobileDevice() && !isTablet();
}

/**
 * Get the current device type
 * 
 * @returns Device type: 'mobile' | 'tablet' | 'desktop'
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (isMobileDevice()) return 'mobile';
  if (isTablet()) return 'tablet';
  return 'desktop';
}

/**
 * Check if device is touch-capable
 * 
 * @returns True if device supports touch events
 */
export function isTouchDevice(): boolean {
  // SSR safety
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for touch support
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - legacy support
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Get screen size category
 * 
 * @returns Screen size: 'small' | 'medium' | 'large' | 'xlarge'
 */
export function getScreenSize(): 'small' | 'medium' | 'large' | 'xlarge' {
  // SSR safety
  if (typeof window === 'undefined') {
    return 'large'; // Default for SSR
  }

  const width = window.innerWidth;

  if (width < 640) return 'small'; // Mobile
  if (width < 1024) return 'medium'; // Tablet
  if (width < 1536) return 'large'; // Desktop
  return 'xlarge'; // Large desktop
}

/**
 * Check if device is in landscape orientation
 * 
 * @returns True if landscape, false if portrait
 */
export function isLandscape(): boolean {
  // SSR safety
  if (typeof window === 'undefined') {
    return true;
  }

  return window.innerWidth > window.innerHeight;
}

/**
 * Check if device is in portrait orientation
 * 
 * @returns True if portrait, false if landscape
 */
export function isPortrait(): boolean {
  return !isLandscape();
}

/**
 * Get device pixel ratio (for retina detection)
 * 
 * @returns Device pixel ratio (1 = standard, 2+ = retina)
 */
export function getDevicePixelRatio(): number {
  // SSR safety
  if (typeof window === 'undefined') {
    return 1;
  }

  return window.devicePixelRatio || 1;
}

/**
 * Check if device has high DPI (retina) display
 * 
 * @returns True if retina/high DPI display
 */
export function isRetinaDisplay(): boolean {
  return getDevicePixelRatio() >= 2;
}

/**
 * Hook for detecting device changes (orientation, resize)
 * Use with React useState and useEffect
 * 
 * Example:
 * ```typescript
 * const [deviceType, setDeviceType] = useState(getDeviceType());
 * 
 * useEffect(() => {
 *   const handleResize = () => setDeviceType(getDeviceType());
 *   window.addEventListener('resize', handleResize);
 *   return () => window.removeEventListener('resize', handleResize);
 * }, []);
 * ```
 */
export function setupDeviceChangeListener(
  callback: (deviceType: 'mobile' | 'tablet' | 'desktop') => void
): () => void {
  // SSR safety
  if (typeof window === 'undefined') {
    return () => {}; // No-op cleanup
  }

  const handleChange = () => {
    callback(getDeviceType());
  };

  // Listen to resize and orientation changes
  window.addEventListener('resize', handleChange);
  window.addEventListener('orientationchange', handleChange);

  // Return cleanup function
  return () => {
    window.removeEventListener('resize', handleChange);
    window.removeEventListener('orientationchange', handleChange);
  };
}

/**
 * Get user-friendly device description
 * Useful for analytics and debugging
 * 
 * @returns Human-readable device description
 */
export function getDeviceDescription(): string {
  // SSR safety
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'Server-side rendered';
  }

  const deviceType = getDeviceType();
  const screenSize = getScreenSize();
  const orientation = isLandscape() ? 'landscape' : 'portrait';
  const touch = isTouchDevice() ? 'touch' : 'no-touch';
  const retina = isRetinaDisplay() ? 'retina' : 'standard';

  return `${deviceType} (${screenSize}, ${orientation}, ${touch}, ${retina})`;
}

/**
 * Log device information to console
 * Useful for debugging device-specific issues
 */
export function logDeviceInfo(): void {
  // SSR safety
  if (typeof window === 'undefined') {
    console.log('[Device] SSR environment');
    return;
  }

  console.group('🖥️ Device Information');
  console.log('Type:', getDeviceType());
  console.log('Screen Size:', getScreenSize());
  console.log('Viewport:', `${window.innerWidth}x${window.innerHeight}`);
  console.log('Orientation:', isLandscape() ? 'Landscape' : 'Portrait');
  console.log('Touch:', isTouchDevice() ? 'Yes' : 'No');
  console.log('Pixel Ratio:', getDevicePixelRatio());
  console.log('Retina:', isRetinaDisplay() ? 'Yes' : 'No');
  console.log('User Agent:', navigator.userAgent);
  console.log('Description:', getDeviceDescription());
  console.groupEnd();
}

/**
 * Check if Composition Studio should show simplified UI
 * 
 * @returns True if device should see simplified composition UI
 */
export function shouldSimplifyComposition(): boolean {
  // Mobile devices get simplified UI
  // Tablets in portrait also get simplified UI (harder to use)
  // Tablets in landscape and desktops get full UI
  
  if (isMobileDevice()) return true;
  if (isTablet() && isPortrait()) return true;
  return false;
}

/**
 * Check if device should show "Desktop Recommended" message
 * 
 * @returns True if should show desktop recommendation
 */
export function shouldShowDesktopRecommendation(): boolean {
  return shouldSimplifyComposition();
}

