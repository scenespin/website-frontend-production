"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { Crisp } from "crisp-sdk-web";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "react-hot-toast";
import { Tooltip } from "react-tooltip";
import config from "@/config";
import { setAuthTokenGetter } from "@/lib/api";
import { ScreenplayProvider } from "@/contexts/ScreenplayContext";

// Auth Initializer: Sets up Clerk token getter for API calls
// This MUST run before any API calls are made
const AuthInitializer = () => {
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn && getToken) {
      // Set the global auth token getter for all API requests
      setAuthTokenGetter(() => getToken({ template: 'wryda-backend' }));
      console.log('[Auth] Token getter initialized for API requests');
    }
  }, [isSignedIn, getToken]);

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

// All the client wrappers are here (they can't be in server components)
// 1. AuthInitializer: Set up Clerk auth token for API calls (MUST RUN FIRST)
// 2. NextTopLoader: Show a progress bar at the top when navigating between pages
// 3. Toaster: Show Success/Error messages anywhere from the app with toast()
// 4. Tooltip: Show tooltips if any JSX elements has these 2 attributes: data-tooltip-id="tooltip" data-tooltip-content=""
// 5. CrispChat: Set Crisp customer chat support (see above)
// 6. ScreenplayProvider: Provides screenplay context for beats, characters, and locations
// Note: No SessionProvider needed - Clerk handles auth via ClerkProvider in layout.js
const ClientLayout = ({ children }) => {
  return (
    <ScreenplayProvider>
      {/* Initialize auth token getter FIRST before any API calls */}
      <AuthInitializer />

      {/* Show a progress bar at the top when navigating between pages */}
      <NextTopLoader color={config.colors.main} showSpinner={false} />

      {/* Content inside app/page.js files  */}
      {children}

      {/* Show Success/Error messages anywhere from the app with toast() */}
      <Toaster
        toastOptions={{
          duration: 3000,
        }}
      />

      {/* Show tooltips if any JSX elements has these 2 attributes: data-tooltip-id="tooltip" data-tooltip-content="" */}
      <Tooltip
        id="tooltip"
        className="z-[60] !opacity-100 max-w-sm shadow-lg"
      />

      {/* Set Crisp customer chat support */}
      <CrispChat />
    </ScreenplayProvider>
  );
};

export default ClientLayout;
