/**
 * Haptic Feedback Utility
 * 
 * Provides haptic feedback on mobile devices
 * Works on iOS and Android with fallback
 */

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * Trigger haptic feedback on supported devices
 */
export function triggerHaptic(style: HapticStyle = 'light'): void {
  if (typeof window === 'undefined') return;

  // Check for iOS Haptic Feedback API
  if ('Taptic' in window || 'webkit' in window) {
    try {
      // @ts-ignore - iOS specific API
      const impact = new (window.ImpactFeedbackGenerator || window.webkit?.ImpactFeedbackGenerator)();
      
      switch (style) {
        case 'light':
          impact?.impactOccurred?.('light');
          break;
        case 'medium':
          impact?.impactOccurred?.('medium');
          break;
        case 'heavy':
          impact?.impactOccurred?.('heavy');
          break;
        case 'success':
          // @ts-ignore
          new (window.NotificationFeedbackGenerator)?.().notificationOccurred('success');
          break;
        case 'warning':
          // @ts-ignore
          new (window.NotificationFeedbackGenerator)?.().notificationOccurred('warning');
          break;
        case 'error':
          // @ts-ignore
          new (window.NotificationFeedbackGenerator)?.().notificationOccurred('error');
          break;
      }
    } catch (e) {
      // Fallback to vibration API
      fallbackVibration(style);
    }
  } else {
    // Use Vibration API for Android and other devices
    fallbackVibration(style);
  }
}

/**
 * Fallback vibration using standard Vibration API
 */
function fallbackVibration(style: HapticStyle): void {
  if (!('vibrate' in navigator)) return;

  const patterns: Record<HapticStyle, number | number[]> = {
    light: 1,
    medium: 5,
    heavy: 10,
    success: [10, 50, 10],
    warning: [5, 50, 5, 50, 5],
    error: [10, 50, 10, 50, 10],
  };

  try {
    navigator.vibrate(patterns[style]);
  } catch (e) {
    // Silently fail if vibration is not supported
  }
}

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
  if (typeof window === 'undefined') return false;
  
  return 'vibrate' in navigator || 'Taptic' in window || 'webkit' in window;
}

/**
 * Hook for haptic feedback
 */
export function useHaptic() {
  const haptic = (style: HapticStyle = 'light') => {
    triggerHaptic(style);
  };

  return {
    haptic,
    isSupported: isHapticSupported(),
    light: () => haptic('light'),
    medium: () => haptic('medium'),
    heavy: () => haptic('heavy'),
    success: () => haptic('success'),
    warning: () => haptic('warning'),
    error: () => haptic('error'),
  };
}

