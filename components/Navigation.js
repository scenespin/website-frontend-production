'use client';

import { useUser, useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import logo from '@/app/icon.png';
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
  Image as ImageIcon,
  Plus,
  Clapperboard,
  Archive,
  Package,
  BookOpen as BookOpenIcon
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useDrawer } from '@/contexts/DrawerContext';
import { ProjectCreationModal } from '@/components/project/ProjectCreationModal';
import { useRouter } from 'next/navigation';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { getCurrentScreenplayId } from '@/utils/clerkMetadata';

export default function Navigation() {
  const { user } = useUser();
  const { getToken, signOut } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // Track which mobile accordion is open
  const { openDrawer } = useDrawer();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { screenplayId: contextScreenplayId } = useScreenplay();
  
  // Credit balance state
  const [credits, setCredits] = useState(null);
  const [loadingCredits, setLoadingCredits] = useState(true);
  
  // Current screenplay state
  const [currentScreenplayName, setCurrentScreenplayName] = useState(null);
  const [loadingScreenplay, setLoadingScreenplay] = useState(false);
  
  // Get current screenplay ID from URL, context, or Clerk metadata/localStorage
  // Priority: URL > Context > Clerk metadata > localStorage
  const urlScreenplayId = searchParams?.get('project');
  const clerkScreenplayId = getCurrentScreenplayId(user);
  const currentScreenplayId = urlScreenplayId || contextScreenplayId || clerkScreenplayId;

  const handleProjectCreated = (project) => {
    // Feature 0130: Use screenplay_id (not project_id)
    const screenplayId = project.screenplay_id || project.id;
    if (screenplayId && screenplayId.startsWith('screenplay_')) {
      router.push(`/write?project=${screenplayId}`);
    } else {
      console.error('[Navigation] Invalid screenplay ID:', screenplayId);
    }
  };
  
  // Use ref to track if we've fetched credits to prevent infinite loops
  const hasFetchedCredits = useRef(false);
  const lastFetchTime = useRef(0);
  
  // Fetch user's credit balance (only once per user session, or if it's been > 30 seconds)
  useEffect(() => {
    if (user?.id && getToken) {
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime.current;
      
      // Fetch if never fetched, or if it's been more than 30 seconds (force refresh on page load after delay)
      if (!hasFetchedCredits.current || timeSinceLastFetch > 30000) {
        hasFetchedCredits.current = true;
        lastFetchTime.current = now;
        // Force refresh on initial load or after delay to ensure fresh data
        fetchCreditBalance(0, timeSinceLastFetch > 30000);
      }
    }
  }, [user?.id, getToken]);
  
  // Refetch credits when page becomes visible (fixes logout/login persistence issue)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id && getToken) {
        // Force refresh when page becomes visible to get latest balance
        fetchCreditBalance(0, true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.id]);
  
  // Periodic credit refresh (every 30 seconds) - acceptable with Redis cache
  // With Redis: 90% cache hit rate, so 30s polling is efficient and scalable
  // Event-driven refresh handles immediate updates after operations
  useEffect(() => {
    if (!user?.id || !getToken) return;
    
    const interval = setInterval(() => {
      // Only refresh if page is visible (don't waste resources on hidden tabs)
      if (!document.hidden) {
        fetchCreditBalance(0, false);
      }
    }, 30000); // 30 seconds - acceptable with Redis cache (90% hit rate, scales to 10K+ users)
    
    return () => clearInterval(interval);
  }, [user?.id, getToken]);
  
  // Expose refresh function globally so other components can trigger credit refresh
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.refreshCredits = () => {
        console.log('[Navigation] 🔔 window.refreshCredits() called from external component');
        console.log('[Navigation] 🔔 Stack trace:', new Error().stack);
        fetchCreditBalance(0, true); // Force refresh when called externally
        // Dispatch custom event so other components (like CreditWidget) can listen
        if (typeof window !== 'undefined') {
          console.log('[Navigation] 🔔 Dispatching creditsRefreshed event');
          window.dispatchEvent(new CustomEvent('creditsRefreshed'));
        }
      };
      
      // Add manual test function for debugging
      window.testCreditRefresh = () => {
        console.log('[Navigation] 🧪 TEST: Manual credit refresh triggered');
        if (window.refreshCredits) {
          window.refreshCredits();
        } else {
          console.error('[Navigation] ❌ TEST FAILED: window.refreshCredits is not available');
        }
      };
      
      console.log('[Navigation] ✅ window.refreshCredits() function registered');
      console.log('[Navigation] ✅ window.testCreditRefresh() function registered (for debugging)');
    }
    return () => {
      if (typeof window !== 'undefined' && window.refreshCredits) {
        console.log('[Navigation] 🧹 Cleaning up window.refreshCredits()');
        delete window.refreshCredits;
      }
    };
  }, [user?.id, getToken]);
  
      async function fetchCreditBalance(retryCount = 0, forceRefresh = false) {
        try {
          // Set up auth token with wryda-backend template
          const { api, setAuthTokenGetter } = await import('@/lib/api');
          setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));
          
          console.log('[Navigation] 🔄 Fetching credits, user ID:', user?.id, 'forceRefresh:', forceRefresh, 'retryCount:', retryCount);
          
          // Use refresh parameter to bypass cache if forceRefresh is true
          const startTime = Date.now();
          const response = await api.user.getCredits(forceRefresh);
          const fetchDuration = Date.now() - startTime;
          
          console.log('[Navigation] 📡 API call completed in', fetchDuration + 'ms');
          // 🔒 SECURITY: Don't log full response (contains bearer token) - only log data
          const safeResponse = {
            status: response.status,
            statusText: response.statusText,
            data: response.data,
            // Don't include config/headers which contain Authorization token
          };
          console.log('[Navigation] 📦 API response (sanitized):', safeResponse);
          console.log('[Navigation] 📦 response.data:', response.data);
          console.log('[Navigation] 📦 response.data.data:', response.data?.data);
          
          // FIX: API response is response.data.data.balance (not response.data.balance)
          const creditsData = response.data.data;
          
          console.log('[Navigation] 🔍 Parsed creditsData:', creditsData);
          console.log('[Navigation] 🔍 Credits balance value:', creditsData?.balance, 'type:', typeof creditsData?.balance);
          
          if (creditsData && typeof creditsData.balance === 'number') {
            const oldCredits = credits;
            setCredits(creditsData.balance);
            lastFetchTime.current = Date.now(); // Update last fetch time
            console.log('[Navigation] ✅ Credits updated:', {
              old: oldCredits,
              new: creditsData.balance,
              change: creditsData.balance - (oldCredits || 0),
              forceRefresh,
              fetchDuration: fetchDuration + 'ms'
            });
          } else {
            console.error('[Navigation] ❌ Invalid credits data, setting to 0', {
              creditsData,
              balanceType: typeof creditsData?.balance,
              balanceValue: creditsData?.balance
            });
            setCredits(0);
          }
        } catch (error) {
          console.error('[Navigation] Failed to fetch credits:', error);
          console.error('[Navigation] Error details:', error?.response?.data);
          
          // If it's a 401 error, don't retry - just set to 0
          if (error?.response?.status === 401) {
            setCredits(0);
          } else if (retryCount < 2) {
            // Retry on network error
            setTimeout(() => fetchCreditBalance(retryCount + 1, forceRefresh), 1000 * (retryCount + 1));
          } else {
            setCredits(0); // Fallback to 0 after retries
          }
        } finally {
          if (retryCount === 0) {
            setLoadingCredits(false);
          }
        }
      }

  // Fetch current screenplay name
  useEffect(() => {
    if (currentScreenplayId && user) {
      setLoadingScreenplay(true);
      fetch(`/api/screenplays/list?status=active&limit=100`)
        .then(async r => {
          if (!r.ok) return;
          const data = await r.json();
          const screenplays = data?.data?.screenplays || data?.screenplays || [];
          const screenplay = screenplays.find(s => 
            (s.screenplay_id || s.id) === currentScreenplayId
          );
          if (screenplay) {
            setCurrentScreenplayName(screenplay.title || screenplay.name || 'Untitled');
          } else {
            setCurrentScreenplayName(null);
          }
        })
        .catch(error => {
          console.error('[Navigation] Failed to fetch screenplay name:', error);
          setCurrentScreenplayName(null);
        })
        .finally(() => {
          setLoadingScreenplay(false);
        });
    } else {
      setCurrentScreenplayName(null);
    }
  }, [currentScreenplayId, user]);

  // Navigation structure - Desktop: flat links, Mobile: hierarchical accordions
  // VERIFIED ROUTES - All pages exist in /app directory
  // Helper function to build href with screenplay ID
  const buildEditorHref = (basePath) => {
    if (currentScreenplayId && currentScreenplayId.startsWith('screenplay_')) {
      return `${basePath}?project=${currentScreenplayId}`;
    }
    return basePath;
  };
  
  const navigation = [
    {
      name: 'Create',
      icon: FileText,
      href: buildEditorHref('/write'),
      // Mobile-only sub-items (for accordion)
      subItems: [
        { name: 'Write', href: buildEditorHref('/write'), icon: FileText, description: 'Screenplay editor (Fountain format)' },
        { name: 'Characters', href: buildEditorHref('/characters'), icon: Users, description: 'Cast management' },
        { name: 'Locations', href: buildEditorHref('/locations'), icon: MapPin, description: 'Scene settings' },
        { name: 'Props', href: buildEditorHref('/props'), icon: Package, description: 'Props & assets' },
      ]
    },
    {
      name: 'Produce',
      icon: Video,
      href: '/produce',
      // Mobile-only sub-items (for accordion)
      subItems: [
        { name: 'Characters', href: '/produce?tab=character-bank', icon: Users, description: 'Character bank' },
        { name: 'Locations', href: '/produce?tab=location-bank', icon: MapPin, description: 'Location bank' },
        { name: 'Props', href: '/produce?tab=asset-bank', icon: Package, description: 'Prop bank' },
        { name: 'Table Reads', href: '/produce?tab=readings', icon: BookOpenIcon, description: 'Screenplay readings' },
      ]
    },
    {
      name: 'Direct',
      icon: Film,
      href: '/direct',
      // Mobile-only sub-items (for accordion)
      subItems: [
        { name: 'Scene Builder', href: '/direct?tab=scene-builder', icon: Clapperboard, description: 'Script-based scene generation' },
        { name: 'Storyboard', href: '/direct?tab=storyboard', icon: Film, description: 'Stitched scene videos & storyboard' },
      ]
    },
    {
      name: 'Archive',
      icon: Archive,
      href: '/storage',
      description: 'Media Library & uploads'
    },
  ];

  const isActive = (href) => {
    const currentPath = pathname?.split('?')[0];
    const linkPath = href?.split('?')[0];
    
    // Simple path matching - each route is independent
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
      <div className="hidden md:flex bg-[#0A0A0A] border-b border-white/10 w-full pb-2">
        <div className="w-full px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left Side: Logo + Navigation Links */}
            <div className="flex items-center gap-4">
              {/* Logo */}
              <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
                <Image
                  src={logo}
                  alt="Wryda.ai logo"
                  width={40}
                  height={40}
                  className="w-10 h-10"
                  priority={true}
                />
                <span className="text-xl font-bold">
                  Wryda<span className="text-cinema-red">.ai</span>
                </span>
              </Link>

              {/* Navigation Links - Desktop: Flat Links */}
              <nav className="flex items-center gap-1">
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
            </div>

            {/* Right Side: Credits (clickable) + User Button */}
            <div className="flex items-center gap-3">
              {user && (
                <>
                  {/* Credit Balance Display - Clickable (goes to dashboard where CreditWidget handles it) */}
                  {user && (
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-3 py-1.5 bg-base-100 rounded-lg border border-base-300 hover:bg-base-200 transition-colors cursor-pointer"
                    >
                      <Coins className="w-4 h-4 text-cinema-gold" />
                      <span className="text-sm font-semibold">
                        {loadingCredits ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <span className="tabular-nums">{credits !== null ? credits.toLocaleString() : '0'}</span>
                        )}
                      </span>
                      <span className="text-xs text-base-content/60">credits</span>
                    </Link>
                  )}
                </>
              )}
              {/* Custom Account Button - Replaces Clerk UserButton */}
              <Link
                href="/account"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-cinema-red hover:bg-cinema-red/90 transition-colors text-white font-bold text-sm"
                title="Account Settings"
              >
                {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0) || 'U'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-[#0A0A0A] border-b border-white/10">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
            <Image
              src={logo}
              alt="Wryda.ai logo"
              width={32}
              height={32}
              className="w-8 h-8"
              priority={true}
            />
            <span className="font-bold">
              Wryda<span className="text-cinema-red">.ai</span>
            </span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-ghost btn-square min-h-[44px] min-w-[44px]"
            aria-label="Toggle mobile menu"
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
            {/* Hierarchical Nav Items */}
            {navigation.map((item) => (
              <div key={item.name}>
                {item.subItems ? (
                  // Accordion-style parent with sub-items
                  <div className="space-y-1">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === item.name ? null : item.name)}
                      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors w-full min-h-[44px] ${
                        isParentActive(item) && item.name === 'Direct'
                          ? 'bg-cinema-red/20 text-cinema-red'
                          : isParentActive(item)
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
                        {item.subItems.map((subItem) => {
                          // For Produce menu, use black styling instead of red
                          const isProduceMenu = item.name === 'Produce';
                          // For Direct menu, remove active state - only show hover
                          const isDirectMenu = item.name === 'Direct';
                          
                          return (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] ${
                                isProduceMenu
                                  ? 'text-base-content hover:bg-base-300'
                                  : isDirectMenu
                                  ? 'text-base-content hover:bg-base-300'
                                  : isActive(subItem.href)
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
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  // Simple link (no sub-items)
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] ${
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
            
            {/* Mobile Current Screenplay Banner */}
            <div className="pt-2 border-t border-base-300 space-y-2">
              {currentScreenplayId && currentScreenplayName ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 bg-base-100 rounded-lg border border-base-300 hover:bg-base-200 transition-colors min-h-[44px]"
                >
                  <span className="text-lg flex-shrink-0">📌</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-base-content/60 mb-0.5">Current</div>
                    <div className="text-sm font-semibold text-base-content truncate">
                      {loadingScreenplay ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        currentScreenplayName
                      )}
                    </div>
                  </div>
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setShowCreateModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-cinema-red hover:bg-cinema-red/90 rounded-lg border border-cinema-red/30 transition-colors min-h-[44px]"
                >
                  <span className="text-lg flex-shrink-0">📌</span>
                  <div className="flex-1 text-left">
                    <div className="text-xs text-base-content/80 mb-0.5">No active screenplay</div>
                    <div className="text-sm font-semibold text-base-content">Create one now</div>
                  </div>
                  <Plus className="w-4 h-4 text-base-content flex-shrink-0" />
                </button>
              )}
            </div>

            {/* NEW: Mobile Account Section */}
            <div className="pt-2 border-t border-base-300 space-y-2">
              {/* User Info - REMOVED: Thick email bar with circular icon (no longer needed) */}
              {/* <div className="flex items-center gap-3 px-4 py-3 bg-base-200 rounded-lg">
                <div className="avatar">
                  <div className="w-10 h-10 rounded-full bg-cinema-red flex items-center justify-center text-white font-bold">
                    {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0) || 'U'}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-base-content truncate">
                    {user?.firstName || user?.emailAddresses?.[0]?.emailAddress}
                  </div>
                  <div className="text-xs text-base-content/60 truncate">
                    {user?.emailAddresses?.[0]?.emailAddress}
                  </div>
                </div>
              </div> */}

              {/* Account Settings Button */}
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-block gap-2 btn-ghost justify-start text-left"
              >
                <Users className="w-4 h-4" />
                Account Settings
              </Link>

              {/* Sign Out Button */}
              <button
                onClick={async () => {
                  setMobileMenuOpen(false);
                  
                  // Feature 0132: Check for unsaved changes before logout
                  let hasUnsaved = false;
                  
                  // Check via custom event
                  const checkPromise = new Promise((resolve) => {
                    const handleResponse = (event) => {
                      hasUnsaved = event.detail?.hasUnsaved || false;
                      window.removeEventListener('unsavedChangesResponse', handleResponse);
                      resolve(hasUnsaved);
                    };
                    
                    window.addEventListener('unsavedChangesResponse', handleResponse);
                    window.dispatchEvent(new CustomEvent('checkUnsavedChanges'));
                    
                    // Timeout after 500ms
                    setTimeout(() => {
                      window.removeEventListener('unsavedChangesResponse', handleResponse);
                      resolve(false);
                    }, 500);
                  });
                  
                  const hasUnsavedChanges = await checkPromise;
                  
                  if (hasUnsavedChanges) {
                    // Show confirmation dialog
                    const shouldSave = window.confirm(
                      'You have unsaved changes. Would you like to save before logging out?\n\n' +
                      'Click "OK" to save and logout, or "Cancel" to stay on the page.'
                    );
                    
                    if (shouldSave) {
                      // Trigger save via custom event
                      window.dispatchEvent(new CustomEvent('saveBeforeLogout'));
                      // Wait a moment for save to complete, then logout
                      setTimeout(() => {
                        signOut({ redirectUrl: '/' });
                      }, 1500);
                    } else {
                      // User cancelled - don't logout
                      return;
                    }
                  } else {
                    // No unsaved changes, proceed with logout
                    signOut({ redirectUrl: '/' });
                  }
                }}
                className="btn btn-block gap-2 btn-ghost justify-start text-left text-error hover:bg-error/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Project Creation Modal */}
      <ProjectCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleProjectCreated}
      />
    </>
  );
}

