"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useUser, useAuth, useSession } from "@clerk/nextjs";
import { Crisp } from "crisp-sdk-web";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import { Tooltip } from "react-tooltip";
import config from "@/config";
import { setAuthTokenGetter, setCurrentSessionId } from "@/lib/api";
import { ScreenplayProvider } from "@/contexts/ScreenplayContext";
import { EditorProvider } from "@/contexts/EditorContext";
import { DrawerProvider } from "@/contexts/DrawerContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { QueryClientProvider } from "@/providers/QueryClientProvider";
import { fixCorruptedBeatsInLocalStorage } from "@/utils/fixCorruptedBeats";
import { MobileBanner } from "@/components/ui/MobileBanner";
import { MobileDebugPanel } from "@/components/debug/MobileDebugPanel";

// Auth Initializer: Sets up Clerk token getter for API calls
// This MUST run before any API calls are made
const AuthInitializer = () => {
  const { getToken } = useAuth();
  const { isSignedIn, user } = useUser();
  const { session } = useSession();

  useEffect(() => {
    if (isSignedIn && getToken && typeof getToken === 'function') {
      // Set the global auth token getter for all API requests
      // Using wryda-backend template for consistent JWT claims
      setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));
      console.log('[Auth] Token getter initialized with wryda-backend template');
      
      // 🔥 NEW: Register active session for single-device login
      registerActiveSession();
    } else if (!isSignedIn) {
      // Clear token getter when user signs out
      setAuthTokenGetter(null);
      setCurrentSessionId(null); // Clear session ID
      console.log('[Auth] Token getter cleared (user signed out)');
      
      // 🔥 NEW: Delete active session on logout
      deleteActiveSession();
    } else if (!getToken || typeof getToken !== 'function') {
      console.warn('[Auth] getToken is not available or not a function:', typeof getToken);
    }
  }, [isSignedIn, getToken, user, session]);

  // 🔥 NEW: Register active session (called on login)
  const registerActiveSession = async () => {
    try {
      console.log('[Auth] 🔄 Starting session registration...', {
        hasSession: !!session,
        sessionId: session?.id || 'none',
        isSignedIn
      });

      const token = await getToken({ template: 'wryda-backend' });
      if (!token) {
        console.warn('[Auth] ⚠️ No token available for session registration');
        return;
      }

      // Get session ID from Clerk session object (sid is a default claim in session tokens)
      // JWT template tokens may not include sid, so we get it from the session object
      const sessionId = session?.id || null;
      if (!sessionId) {
        console.warn('[Auth] ⚠️ No session ID available from Clerk session object - will use JWT fallback');
        // Continue anyway - backend will try to extract from JWT as fallback
      } else {
        // Store session ID globally for use in API requests
        setCurrentSessionId(sessionId);
        console.log('[Auth] ✅ Session ID stored:', sessionId.substring(0, 20) + '...');
      }

      const deviceInfo = typeof navigator !== 'undefined' 
        ? `${navigator.userAgent} - ${navigator.platform}` 
        : 'unknown';

      // Build headers with session ID if available
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
      
      // Add X-Session-Id header if we have it (for middleware session validation)
      if (sessionId) {
        headers['X-Session-Id'] = sessionId;
      }

      const response = await fetch('/api/sessions/register', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          deviceInfo,
          sessionId: sessionId // Pass session ID explicitly in body too
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Auth] ✅ Active session registered for single-device login', data);
      } else {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        
        // Expand error object for better debugging
        const errorMessage = errorData?.message || errorData?.error || JSON.stringify(errorData);
        console.error('[Auth] ❌ Failed to register session:', {
          status: response.status,
          statusText: response.statusText,
          errorMessage: errorMessage,
          fullError: errorData,
          hasSessionId: !!sessionId,
          sessionIdPreview: sessionId ? sessionId.substring(0, 20) + '...' : 'none',
          hasToken: !!token,
          tokenLength: token?.length || 0,
          headersSent: Object.keys(headers)
        });
        
        if (response.status === 401) {
          if (errorData.error === 'SessionExpired') {
            console.warn('[Auth] ⚠️ Session expired - user logged in elsewhere');
            // Show message to user
            if (typeof window !== 'undefined' && window.location) {
              alert('You were logged out because you logged in on another device. Please refresh the page.');
              window.location.reload();
            }
          } else {
            console.error('[Auth] ❌ 401 Unauthorized during registration - JWT may be invalid or expired');
          }
        }
      }
    } catch (error) {
      console.error('[Auth] ❌ Exception during session registration:', error);
      // Don't block login if session registration fails
    }
  };

  // 🔥 NEW: Delete active session (called on logout)
  const deleteActiveSession = async () => {
    try {
      const token = await getToken?.({ template: 'wryda-backend' });
      if (!token) return;

      await fetch('/api/sessions/logout', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('[Auth] ✅ Active session deleted');
    } catch (error) {
      console.error('[Auth] ❌ Failed to delete active session:', error);
      // Don't block logout if session deletion fails
    }
  };

  return null;
};

// Crisp customer chat support:
// This component uses Clerk's useUser() hook to identify users
const CrispChat = () => {
  const pathname = usePathname();
  const { user } = useUser();

  useEffect(() => {
    if (config?.crisp?.id) {
      // Set up Crisp
      Crisp.configure(config.crisp.id);

      // (Optional) If onlyShowOnRoutes array is not empty in config.js file, Crisp will be hidden on the routes in the array.
      // Use <AppButtonSupport> instead to show it (user clicks on the button to show Crisp—it cleans the UI)
      if (
        config.crisp.onlyShowOnRoutes &&
        !config.crisp.onlyShowOnRoutes?.includes(pathname)
      ) {
        Crisp.chat.hide();
        Crisp.chat.onChatClosed(() => {
          Crisp.chat.hide();
        });
      }
    }
  }, [pathname]);

  // Add User Unique ID to Crisp to easily identify users when reaching support (optional)
  useEffect(() => {
    if (user && config?.crisp?.id) {
      Crisp.session.setData({ userId: user.id });
    }
  }, [user]);

  return null;
};

// Data Migration Component: Fixes corrupted beats data from localStorage
const DataMigration = () => {
  useEffect(() => {
    // Run migration ONCE on app mount to fix any corrupted beats
    // This fixes the "number 1 is not iterable" bug where scenes is a number instead of array
    if (typeof window !== 'undefined') {
      const migrationKey = 'wryda_beats_migration_v2';
      const alreadyMigrated = localStorage.getItem(migrationKey);
      
      if (!alreadyMigrated) {
        console.log('[Migration] Running beats data migration...');
        fixCorruptedBeatsInLocalStorage();
        localStorage.setItem(migrationKey, new Date().toISOString());
        console.log('[Migration] ✅ Migration complete');
      }
    }
  }, []);
  
  return null;
};

// Global Error Handler: Captures full unminified stack traces for debugging
const GlobalErrorHandler = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Capture unhandled errors
    const handleError = (event) => {
      const error = event.error || event.reason;
      if (error) {
        console.error('🔴 [GlobalErrorHandler] Unhandled Error:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          componentStack: error.componentStack,
          // Try to get source map info
          fileName: error.fileName,
          lineNumber: error.lineNumber,
          columnNumber: error.columnNumber
        });
      }
    };
    
    // Capture unhandled promise rejections
    const handleUnhandledRejection = (event) => {
      const error = event.reason;
      console.error('🔴 [GlobalErrorHandler] Unhandled Promise Rejection:', {
        reason: error,
        message: error?.message,
        stack: error?.stack
      });
    };
    
    // Override console.error to capture React errors with full stack
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Check if it's a React error
      if (args[0]?.includes?.('Minified React error') || args[0]?.includes?.('React error')) {
        console.error('🔴 [GlobalErrorHandler] React Error Detected:', {
          args: args,
          stack: new Error().stack
        });
      }
      originalConsoleError.apply(console, args);
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      console.error = originalConsoleError;
    };
  }, []);
  
  return null;
};

// All the client wrappers are here (they can't be in server components)
// 1. DataMigration: Fix corrupted beats data (MUST RUN FIRST)
// 2. AuthInitializer: Set up Clerk auth token for API calls
// 3. NextTopLoader: Show a progress bar at the top when navigating between pages
// 4. Toaster: Show Success/Error messages anywhere from the app with toast()
// 5. Tooltip: Show tooltips if any JSX elements has these 2 attributes: data-tooltip-id="tooltip" data-tooltip-content=""
// 6. CrispChat: Set Crisp customer chat support (see above)
// 7. ScreenplayProvider: Provides screenplay context for beats, characters, and locations
// 8. EditorProvider: Provides editor context for script content (shared across all pages)
// 9. DrawerProvider: Provides drawer context for AI chat drawer
// 10. ChatProvider: Provides chat context for AI workflows
// 11. QueryClientProvider: Provides React Query client for Media Library and other queries
// Note: No SessionProvider needed - Clerk handles auth via ClerkProvider in layout.js
// Global Insufficient Credits Handler
// Listens for insufficient credits events and shows modal
const InsufficientCreditsHandler = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    requiredCredits: null,
    availableCredits: null,
    operation: null
  });

  useEffect(() => {
    const handleInsufficientCredits = (event) => {
      const { requiredCredits, availableCredits, message } = event.detail;
      setModalState({
        isOpen: true,
        requiredCredits,
        availableCredits,
        operation: message || 'complete this operation'
      });
    };

    window.addEventListener('insufficient-credits', handleInsufficientCredits);
    return () => {
      window.removeEventListener('insufficient-credits', handleInsufficientCredits);
    };
  }, []);

  const closeModal = () => {
    setModalState({
      isOpen: false,
      requiredCredits: null,
      availableCredits: null,
      operation: null
    });
  };

  // Dynamically import modal to avoid SSR issues
  const [ModalComponent, setModalComponent] = useState(null);
  useEffect(() => {
    if (modalState.isOpen) {
      import('@/components/billing/InsufficientCreditsModal').then((mod) => {
        setModalComponent(() => mod.default);
      });
    }
  }, [modalState.isOpen]);

  return (
    <>
      {ModalComponent && modalState.isOpen && (
        <ModalComponent
          isOpen={modalState.isOpen}
          onClose={closeModal}
          requiredCredits={modalState.requiredCredits}
          availableCredits={modalState.availableCredits}
          operation={modalState.operation}
        />
      )}
    </>
  );
};

const ClientLayout = ({ children }) => {
  return (
    <QueryClientProvider>
      <ScreenplayProvider>
        <EditorProvider>
          <DrawerProvider>
            <ChatProvider>
          {/* Run data migration FIRST to fix corrupted beats */}
          <DataMigration />
          
          {/* Global error handler to capture full stack traces */}
          <GlobalErrorHandler />
          
          {/* Global insufficient credits handler */}
          <InsufficientCreditsHandler />
          
          {/* Initialize auth token getter before any API calls */}
          <AuthInitializer />

          {/* Show a progress bar at the top when navigating between pages */}
          <NextTopLoader color={config.colors.main} showSpinner={false} />

          {/* Mobile banner - recommends desktop for best experience */}
          <MobileBanner />

          {/* Mobile Debug Panel - TEMPORARY: Remove import and this line to disable */}
          <MobileDebugPanel />

          {/* Content inside app/page.js files  */}
          {children}

          {/* Show Success/Error messages anywhere from the app with toast() */}
          {/* Styled with black on black theme in globals.css */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
            }}
            theme="dark"
          />

          {/* Show tooltips if any JSX elements has these 2 attributes: data-tooltip-id="tooltip" data-tooltip-content="" */}
          <Tooltip
            id="tooltip"
            className="z-[60] !opacity-100 max-w-sm shadow-lg"
          />

          {/* Set Crisp customer chat support */}
          <CrispChat />
          </ChatProvider>
        </DrawerProvider>
      </EditorProvider>
    </ScreenplayProvider>
    </QueryClientProvider>
  );
};

export default ClientLayout;
