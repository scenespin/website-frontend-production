'use client';

import { useUser, useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
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
  Image,
  Plus
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useDrawer } from '@/contexts/DrawerContext';
import { ProjectCreationModal } from '@/components/project/ProjectCreationModal';
import { useRouter } from 'next/navigation';
import { useScreenplay } from '@/contexts/ScreenplayContext';
import { getCurrentScreenplayId } from '@/utils/clerkMetadata';

export default function Navigation() {
  const { user } = useUser();
  const { getToken } = useAuth();
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
  
  // Fetch user's credit balance (only once per user session)
  useEffect(() => {
    if (user?.id && getToken && !hasFetchedCredits.current) {
      hasFetchedCredits.current = true;
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
  }, [user?.id]);
  
      async function fetchCreditBalance(retryCount = 0) {
        try {
          // Set up auth token with wryda-backend template
          const { api, setAuthTokenGetter } = await import('@/lib/api');
          setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));
          
          console.log('[Navigation] Fetching credits, user ID:', user?.id);
          
          // Now make the API call
          const response = await api.user.getCredits();
          
          console.log('[Navigation] Credits API response:', response);
          console.log('[Navigation] Credits response.data:', response.data);
          console.log('[Navigation] Credits response.data.data:', response.data?.data);
          
          // FIX: API response is response.data.data.balance (not response.data.balance)
          const creditsData = response.data.data;
          
          console.log('[Navigation] Parsed creditsData:', creditsData);
          console.log('[Navigation] Credits balance value:', creditsData?.balance);
          
          if (creditsData && typeof creditsData.balance === 'number') {
            setCredits(creditsData.balance);
            console.log('[Navigation] ✅ Set credits to:', creditsData.balance);
          } else {
            console.log('[Navigation] ⚠️ Invalid credits data, setting to 0');
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
            setTimeout(() => fetchCreditBalance(retryCount + 1), 1000 * (retryCount + 1));
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
      ]
    },
    {
      name: 'Production',
      icon: Video,
      href: '/production',
      // Mobile-only sub-items (for accordion)
      subItems: [
        { name: 'Production Studio', href: '/production', icon: Video, description: 'AI video & audio' },
        { name: 'Workflows', href: '/workflows', icon: Zap, description: 'Guided production' },
      ]
    },
    {
      name: 'Playground',
      icon: Zap,
      href: '/production?tab=playground',
      description: 'Creative possibilities & workflows'
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
      <div className="hidden md:flex bg-[#0A0A0A] border-b border-white/10 w-full">
        <div className="w-full px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left Side: Logo + Navigation Links */}
            <div className="flex items-center gap-4">
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

            {/* Right Side: New Project + Credits + Buy Credits + User Button */}
            <div className="flex items-center gap-3">
              {user && (
                <>
                  {/* New Project Button */}
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#DC143C] hover:bg-[#B91238] text-white rounded-lg transition-colors font-medium text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Project</span>
                  </button>

                  {/* Credit Balance Display */}
                  {user && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-base-100 rounded-lg border border-base-300">
                      <Coins className="w-4 h-4 text-cinema-gold" />
                      <span className="text-sm font-semibold">
                        {loadingCredits ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <span className="tabular-nums">{credits !== null ? credits.toLocaleString() : '0'}</span>
                        )}
                      </span>
                      <span className="text-xs text-base-content/60">credits</span>
                    </div>
                  )}
                  
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
      <div className="md:hidden bg-[#0A0A0A] border-b border-white/10">
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

            {/* NEW: Mobile Account Section */}
            <div className="pt-2 border-t border-base-300 space-y-2">
              {/* User Info */}
              <div className="flex items-center gap-3 px-4 py-3 bg-base-200 rounded-lg">
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
              </div>

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
                        window.Clerk?.signOut();
                      }, 1500);
                    } else {
                      // User cancelled - don't logout
                      return;
                    }
                  } else {
                    // No unsaved changes, proceed with logout
                    window.Clerk?.signOut();
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

