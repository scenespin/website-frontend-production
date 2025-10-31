'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PenTool, Zap, FolderOpen, BarChart3, Settings, HelpCircle, CreditCard } from 'lucide-react';
import { getMobileNavZIndex } from '@/config/z-index';

interface UnifiedMobileNavProps {
  /** Current page context to show relevant navigation */
  pageContext?: 'write' | 'dashboard' | 'other';
  /** Whether AgentDrawer is currently open (affects z-index) */
  isDrawerOpen?: boolean;
  /** Callback when more menu is opened */
  onMoreMenuOpen?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

/**
 * Unified Mobile Navigation Component
 * 
 * Single bottom navigation that works across all app pages.
 * Features:
 * - 56px height (matches collapsed AgentDrawer)
 * - Context-aware navigation items
 * - Safe area inset support (iPhone notch)
 * - Z-index coordination with AgentDrawer
 * - Active state highlighting
 * 
 * Usage:
 * ```tsx
 * <UnifiedMobileNav pageContext="write" isDrawerOpen={false} />
 * ```
 */
export function UnifiedMobileNav({ 
  pageContext = 'other',
  isDrawerOpen = false,
  onMoreMenuOpen
}: UnifiedMobileNavProps) {
  const pathname = usePathname();

  // Define navigation items based on context
  const getNavItems = (): NavItem[] => {
    // Core navigation (always shown)
    const coreItems: NavItem[] = [
      {
        name: 'Dashboard',
        href: '/app/dashboard',
        icon: <Home className="w-5 h-5" />
      },
      {
        name: 'Write',
        href: '/app/write',
        icon: <PenTool className="w-5 h-5" />
      },
      {
        name: 'AI Agents',
        href: '/app/agents/director',
        icon: <Zap className="w-5 h-5" />
      },
      {
        name: 'Projects',
        href: '/app/projects',
        icon: <FolderOpen className="w-5 h-5" />
      }
    ];

    return coreItems;
  };

  // More menu items (shown in slide-up menu)
  const moreItems: NavItem[] = [
    {
      name: 'Usage',
      href: '/app/usage',
      icon: <BarChart3 className="w-5 h-5" />
    },
    {
      name: 'Billing',
      href: '/app/billing',
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      name: 'Settings',
      href: '/app/settings',
      icon: <Settings className="w-5 h-5" />
    },
    {
      name: 'Help',
      href: '/help/docs',
      icon: <HelpCircle className="w-5 h-5" />
    }
  ];

  const navItems = getNavItems();

  const isActive = (href: string) => {
    if (pathname === href) return true;
    // Special case for agent pages
    if (href === '/app/agents/director' && pathname?.startsWith('/app/agents')) return true;
    return pathname?.startsWith(href + '/');
  };

  // Calculate z-index using centralized configuration
  const zIndex = getMobileNavZIndex(isDrawerOpen);

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 md:hidden"
      style={{ 
        height: '56px',
        paddingBottom: 'env(safe-area-inset-bottom)', // iPhone notch/gesture bar
        zIndex: zIndex,
        transition: 'z-index 0.2s ease'
      }}
    >
      <div className="grid grid-cols-4 h-14 px-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex flex-col items-center justify-center gap-0.5
                transition-all duration-200 rounded-lg
                active:scale-95
                ${active
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }
              `}
            >
              {/* Icon */}
              <div className={`
                transition-transform duration-200
                ${active ? 'scale-110' : 'scale-100'}
              `}>
                {item.icon}
              </div>
              
              {/* Label */}
              <span className={`
                text-[10px] font-medium leading-tight
                ${active ? 'font-semibold' : ''}
              `}>
                {item.name}
              </span>
              
              {/* Badge (if any) */}
              {item.badge && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Safe area spacer for devices with bottom gesture bars */}
      <div 
        className="bg-white dark:bg-slate-900"
        style={{ 
          height: 'env(safe-area-inset-bottom)',
          borderTop: '1px solid rgba(226, 232, 240, 0.5)'
        }} 
      />
    </nav>
  );
}

export default UnifiedMobileNav;

