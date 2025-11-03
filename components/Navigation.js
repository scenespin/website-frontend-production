'use client';

import { useUser, useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  MessageSquare,
  Video,
  FileText,
  Zap,
  Menu,
  X,
  Coins,
  Users,
  ChevronDown,
  Layout,
  Film,
  FolderOpen,
  BookOpen,
  MapPin,
  Layers,
  Clock,
  Music,
  Image
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDrawer } from '@/contexts/DrawerContext';

export default function Navigation() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // Track which mobile accordion is open
  const { openDrawer } = useDrawer();
  
  // Credit balance state
  const [credits, setCredits] = useState(null);
  const [loadingCredits, setLoadingCredits] = useState(true);
  
  // Fetch user's credit balance
  useEffect(() => {
    if (user?.id && getToken) {
      fetchCreditBalance();
    }
  }, [user?.id, getToken]);
  
  // Refetch credits when page becomes visible (fixes logout/login persistence issue)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id && getToken) {
        fetchCreditBalance();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.id, getToken]);
  
  async function fetchCreditBalance(retryCount = 0) {
    try {
      // Set up auth token first
      const { api, setAuthTokenGetter } = await import('@/lib/api');
      setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));
      
      // Now make the API call
      const response = await api.user.getCredits();
      setCredits(response.data.balance || 0);
    } catch (error) {
      console.error('[Navigation] Failed to fetch credits:', error);
      // Retry on network error for new accounts
      if (retryCount < 3) {
        setTimeout(() => fetchCreditBalance(retryCount + 1), 2000 * (retryCount + 1));
      } else {
        setCredits(0); // Fallback to 0 after retries
      }
    } finally {
      if (retryCount === 0) {
        setLoadingCredits(false);
      }
    }
  }

  // Navigation structure - Desktop: flat links, Mobile: hierarchical accordions
  const navigation = [
    {
      name: 'Editor',
      icon: FileText,
      href: '/editor',
      // Mobile-only sub-items (for accordion)
      subItems: [
        { name: 'Write', href: '/editor', icon: FileText, description: 'Screenplay editor' },
        { name: 'Story Beats', href: '/beats', icon: BookOpen, description: 'Narrative structure' },
        { name: 'Characters', href: '/characters', icon: Users, description: 'Cast management' },
        { name: 'Locations', href: '/locations', icon: MapPin, description: 'Scene settings' },
      ]
    },
    {
      name: 'Production',
      icon: Video,
      href: '/production',
      // Mobile-only sub-items (for accordion)
      subItems: [
        { name: 'Scene Builder', href: '/production?tab=scene-builder', icon: Film, description: 'Generate complete scenes' },
        { name: 'Workflows', href: '/production?tab=workflows', icon: Zap, description: 'Guided production' },
        { name: 'Character Bank', href: '/production?tab=characters', icon: Users, description: 'Character references' },
        { name: 'Location Bank', href: '/production?tab=locations', icon: MapPin, description: 'Location references' },
        { name: 'Asset Bank', href: '/production?tab=assets', icon: Image, description: 'Manage all assets' },
      ]
    },
    {
      name: 'Composition',
      icon: Layout,
      href: '/composition'
    },
    {
      name: 'Timeline',
      icon: Clock,
      href: '/timeline'
    },
    {
      name: 'Library',
      icon: FolderOpen,
      href: '/assets',
      // Mobile-only sub-items (for accordion)
      subItems: [
        { name: 'Projects', href: '/dashboard', icon: FileText, description: 'Your screenplays' },
        { name: 'Videos', href: '/assets?type=video', icon: Video, description: 'Generated clips' },
        { name: 'Music', href: '/assets?type=audio', icon: Music, description: 'Audio library' },
        { name: 'Assets', href: '/assets', icon: Image, description: 'All media files' },
      ]
    },
  ];

  const isActive = (href) => {
    const currentPath = pathname?.split('?')[0];
    const linkPath = href?.split('?')[0];
    return currentPath === linkPath || pathname === href;
  };

  const isParentActive = (item) => {
    // For mobile accordion - check if we're on this section
    if (item.href && isActive(item.href)) return true;
    if (item.subItems) {
      return item.subItems.some(sub => isActive(sub.href));
    }
    return false;
  };

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex bg-base-200 border-b border-base-300">
        <div className="max-w-7xl mx-auto w-full px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-cinema-red rounded-lg flex items-center justify-center">
                <span className="text-base-content font-bold text-xl">W</span>
              </div>
              <span className="text-xl font-bold">
                Wryda<span className="text-cinema-red">.ai</span>
              </span>
            </Link>

            {/* Navigation Links - Desktop: Flat Links */}
            <nav className="flex items-center gap-1">
              {/* AI Assistant Button */}
              <button
                onClick={() => openDrawer('chat')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-base-content hover:bg-base-300"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="font-medium">AI Assistant</span>
              </button>

              {/* Main Navigation Items - Simple Flat Links */}
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isParentActive(item)
                      ? 'bg-cinema-red text-base-content'
                      : 'text-base-content hover:bg-base-300'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* User Menu - Desktop */}
            <div className="flex items-center gap-3">
              {user && (
                <>
                  {/* Credit Balance Display */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-base-100 rounded-lg border border-base-300">
                    <Coins className="w-4 h-4 text-cinema-gold" />
                    <span className="text-sm font-semibold">
                      {loadingCredits ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        <span className="tabular-nums">{credits?.toLocaleString() || '0'}</span>
                      )}
                    </span>
                    <span className="text-xs text-base-content/60">credits</span>
                  </div>
                  
                  {/* Buy Credits Button */}
                  <Link 
                    href="/buy-credits" 
                    className="btn btn-sm gap-2 bg-cinema-red hover:opacity-90 text-base-content border-none"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Buy Credits</span>
                  </Link>
                </>
              )}
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-base-200 border-b border-base-300">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cinema-red rounded-lg flex items-center justify-center">
              <span className="text-base-content font-bold">W</span>
            </div>
            <span className="font-bold">
              Wryda<span className="text-cinema-red">.ai</span>
            </span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-ghost btn-square"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-base-300 p-4 space-y-2">
            {/* AI Assistant */}
            <button
              onClick={() => {
                openDrawer('chat');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full text-left text-base-content hover:bg-base-300"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium">AI Assistant</span>
            </button>

            {/* Hierarchical Nav Items */}
            {navigation.map((item) => (
              <div key={item.name}>
                {item.subItems ? (
                  // Accordion-style parent with sub-items
                  <div className="space-y-1">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === item.name ? null : item.name)}
                      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors w-full ${
                        isParentActive(item)
                          ? 'bg-cinema-red text-base-content'
                          : 'text-base-content hover:bg-base-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === item.name ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Sub-items (accordion content) */}
                    {openDropdown === item.name && (
                      <div className="ml-4 space-y-1 border-l-2 border-base-300 pl-3">
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-start gap-3 px-3 py-2 rounded-lg transition-colors ${
                              isActive(subItem.href)
                                ? 'bg-cinema-red/20 text-cinema-red'
                                : 'text-base-content hover:bg-base-300'
                            }`}
                          >
                            <subItem.icon className="w-4 h-4 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{subItem.name}</div>
                              {subItem.description && (
                                <div className="text-xs text-base-content/60 mt-0.5">{subItem.description}</div>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Simple link (no sub-items)
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-cinema-red text-base-content'
                        : 'text-base-content hover:bg-base-300'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )}
              </div>
            ))}
            
            {/* Mobile Credit Balance & Buy Button */}
            <div className="pt-2 border-t border-base-300 space-y-2">
              {/* Credit Balance */}
              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-base-100 rounded-lg border border-base-300">
                <Coins className="w-4 h-4 text-cinema-gold" />
                <span className="text-sm font-semibold">
                  {loadingCredits ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <span className="tabular-nums">{credits?.toLocaleString() || '0'}</span>
                  )}
                </span>
                <span className="text-xs text-base-content/60">credits</span>
              </div>
              
              {/* Buy Credits Button */}
              <Link
                href="/buy-credits"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-block gap-2 bg-cinema-red hover:opacity-90 text-base-content border-none"
              >
                <Zap className="w-4 h-4" />
                Buy Credits
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

