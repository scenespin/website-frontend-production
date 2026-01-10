/**
 * API Client for Backend
 * Handles Clerk authentication and secure API requests
 */

// Extend Window interface to include Clerk
declare global {
    interface Window {
      refreshCredits?: () => void;
        Clerk?: {
            user?: any;
            session?: {
                getToken: () => Promise<string | null>;
            };
            signOut: () => Promise<void>;
        };
    }
}

// Import Clerk auth for client-side (will be null on server)
let clerkAuth: any = null;
if (typeof window !== 'undefined') {
    import('@clerk/nextjs').then((module) => {
        clerkAuth = module;
    });
}

const API_BASE_URL = ''; // Empty = relative URLs (goes through Next.js proxy routes)

/**
 * Fetches the Clerk JWT token from the active user session.
 * @returns JWT ID token string
 * @throws Error if user is not authenticated
 */
export async function getAuthToken(): Promise<string> {
    try {
        // Client-side only - get token from Clerk
        if (typeof window === 'undefined') {
            throw new Error('getAuthToken called on server side');
        }

        // Use Clerk's getToken from window if available
        if (window.Clerk) {
            const token = await window.Clerk.session?.getToken();
            if (token) return token;
        }

        throw new Error('No authentication token available');
    } catch (error) {
        console.error('[API] Failed to get auth token:', error);
        throw new Error('Authentication required');
    }
}

/**
 * Gets the current authenticated user's information from Clerk
 * @returns User object with userId and email
 */
export async function getCurrentUserInfo() {
    try {
        if (typeof window === 'undefined' || !window.Clerk) {
            return null;
        }

        const user = window.Clerk.user;
        if (!user) return null;

        return {
            userId: user.id,
            username: user.username || user.emailAddresses[0]?.emailAddress,
        };
    } catch (error) {
        console.error('[API] Failed to get current user:', error);
        return null;
    }
}

/**
 * Signs out the current user
 */
export async function signOut() {
    try {
        if (window.Clerk) {
            await window.Clerk.signOut();
            // Redirect to home page after sign out
            if (typeof window !== 'undefined') {
                window.location.href = '/';
            }
        }
    } catch (error) {
        console.error('[API] Sign out failed:', error);
        throw error;
    }
}

/**
 * Checks if user is currently authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
    try {
        if (typeof window === 'undefined' || !window.Clerk) {
            return false;
        }
        return !!window.Clerk.user;
    } catch {
        return false;
    }
}

/**
 * General function for making authenticated API requests.
 * @param path API endpoint path (e.g., '/api/user')
 * @param options Fetch options
 * @returns Parsed JSON response
 */
export async function secureFetch(path: string, options: RequestInit = {}) {
    try {
        const token = await getAuthToken();
        
        // Use relative URL (goes through Next.js proxy)
        const response = await fetch(path, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        // Handle specific HTTP status codes
        if (response.status === 401) {
            // Unauthorized - token expired or invalid
            throw new Error('UNAUTHORIZED');
        }
        
        if (response.status === 402) {
            // Payment Required - insufficient credits
            const data = await response.json();
            
            // Try to extract credit information from error message
            let requiredCredits = null;
            let availableCredits = null;
            const message = data.message || '';
            
            // Parse error message for credit details (format: "Need X credits, have Y")
            const needMatch = message.match(/Need (\d+)/i);
            const haveMatch = message.match(/have (\d+)/i);
            if (needMatch) requiredCredits = parseInt(needMatch[1], 10);
            if (haveMatch) availableCredits = parseInt(haveMatch[1], 10);
            
            // Also check if credits are in the response data
            if (data.requiredCredits) requiredCredits = data.requiredCredits;
            if (data.availableCredits) availableCredits = data.availableCredits;
            
            // Trigger global insufficient credits modal
            if (typeof window !== 'undefined') {
                // Dispatch custom event that LayoutClient can listen to
                window.dispatchEvent(new CustomEvent('insufficient-credits', {
                    detail: {
                        requiredCredits,
                        availableCredits,
                        message: data.message || 'Insufficient credits to complete this operation'
                    }
                }));
            }
            
            throw new Error(`INSUFFICIENT_CREDITS: ${data.message}`);
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
        }
        
        return response.json();
    } catch (error) {
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            // Redirect to login on authentication failure
            if (typeof window !== 'undefined') {
                window.location.href = '/sign-in'; // Clerk sign-in page
            }
            return; // Don't throw after redirect
        }
        throw error;
    }
}

/**
 * Helper function for making unauthenticated API requests (e.g., public endpoints)
 */
export async function publicFetch(path: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            ...options.headers,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.status}`);
    }
    
    return response.json();
}
    
