'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook to coordinate multiple dropdown menus
 * Prevents multiple dropdowns from being open simultaneously
 * 
 * Best Practices:
 * 1. Single source of truth for open state
 * 2. Automatic cleanup on outside clicks
 * 3. Escape key support
 * 4. Focus management
 * 5. Prevents race conditions with refs
 * 
 * Usage:
 * ```tsx
 * const { openMenuId, setOpenMenuId, isOpen, closeAll } = useDropdownCoordinator();
 * 
 * <DropdownMenu open={isOpen('menu-1')} onOpenChange={(open) => setOpenMenuId(open ? 'menu-1' : null)}>
 * ```
 */
export function useDropdownCoordinator() {
  const [openMenuId, setOpenMenuIdState] = useState<string | null>(null);
  const isClosingRef = useRef(false);

  /**
   * Set the open menu ID (closes any other open menu automatically)
   */
  const setOpenMenuId = useCallback((id: string | null) => {
    // Prevent race conditions during rapid clicks
    if (isClosingRef.current && id !== null) {
      return;
    }

    if (id === null) {
      isClosingRef.current = true;
      setOpenMenuIdState(null);
      // Reset flag after state update
      setTimeout(() => {
        isClosingRef.current = false;
      }, 50);
    } else {
      // Close any existing menu first
      if (openMenuId !== null && openMenuId !== id) {
        setOpenMenuIdState(null);
        // Use requestAnimationFrame to ensure close completes before open
        requestAnimationFrame(() => {
          setOpenMenuIdState(id);
        });
      } else {
        setOpenMenuIdState(id);
      }
    }
  }, [openMenuId]);

  /**
   * Check if a specific menu is open
   */
  const isOpen = useCallback((id: string) => {
    return openMenuId === id;
  }, [openMenuId]);

  /**
   * Close all menus
   */
  const closeAll = useCallback(() => {
    setOpenMenuIdState(null);
  }, []);

  /**
   * Close menu on Escape key
   */
  useEffect(() => {
    if (!openMenuId) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAll();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [openMenuId, closeAll]);

  /**
   * Close menu on outside click
   * Uses event delegation for better performance
   */
  useEffect(() => {
    if (!openMenuId) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if click is outside any dropdown menu
      // Radix UI uses data-radix-dropdown-menu-content attribute
      const isInsideDropdown = target.closest('[data-radix-dropdown-menu-content]');
      const isTrigger = target.closest('[data-radix-dropdown-menu-trigger]');
      
      if (!isInsideDropdown && !isTrigger) {
        closeAll();
      }
    };

    // Use capture phase to catch clicks before they bubble
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [openMenuId, closeAll]);

  return {
    openMenuId,
    setOpenMenuId,
    isOpen,
    closeAll,
  };
}

