/**
 * API Client for ISE Backend
 * Handles Cognito authentication and secure API requests
 */

import { Amplify } from 'aws-amplify';
import { fetchAuthSession, getCurrentUser, signOut as amplifySignOut } from 'aws-amplify/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'; // TEMP: Use local backend for debugging

// Debug logging
if (typeof window !== 'undefined') {
    console.log('[API] API_BASE_URL:', API_BASE_URL);
}

// Initialize Amplify with Cognito configuration
Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'us-east-1_rlNHHgbZJ',
            userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '104h4rptest248bsaf6a1kn3d3',
            loginWith: {
                oauth: {
                    domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN || '',
                    scopes: ['openid', 'email', 'profile'],
                    redirectSignIn: [typeof window !== 'undefined' ? window.location.origin : ''],
                    redirectSignOut: [typeof window !== 'undefined' ? window.location.origin : ''],
                    responseType: 'code',
                },
            },
        }
    }
}, { ssr: true }); // Enable SSR support for Next.js

/**
 * Fetches the Cognito JWT token from the active user session.
 * @returns JWT ID token string
 * @throws Error if user is not authenticated
 */
export async function getAuthToken(): Promise<string> {
    try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        
        if (!token) {
            throw new Error('No authentication token available');
        }
        
        return token;
    } catch (error) {
        console.error('[API] Failed to get auth token:', error);
        throw new Error('Authentication required');
    }
}

/**
 * Gets the current authenticated user's information
 * @returns User object with userId and email
 */
export async function getCurrentUserInfo() {
    try {
        const user = await getCurrentUser();
        return {
            userId: user.userId,
            username: user.username,
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
        await amplifySignOut();
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
        await getCurrentUser();
        return true;
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
        
        const response = await fetch(`${API_BASE_URL}${path}`, {
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
                window.location.href = '/login';
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
    
