/**
 * Admin API Client Utility
 * 
 * Helper functions for making authenticated admin API calls
 * All admin endpoints require Clerk JWT tokens
 */

/**
 * Make an authenticated admin API request
 * Automatically includes the Clerk JWT token in the Authorization header
 */
export async function adminFetch(
  endpoint: string,
  options: RequestInit = {},
  token: string | null
): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add Authorization header if token is provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  return response;
}

/**
 * Make an authenticated admin API request and parse JSON response
 */
export async function adminFetchJson<T = any>(
  endpoint: string,
  options: RequestInit = {},
  token: string | null
): Promise<T> {
  const response = await adminFetch(endpoint, options, token);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      error: `HTTP ${response.status}: ${response.statusText}` 
    }));
    throw new Error(error.error || error.message || 'Request failed');
  }

  return response.json();
}

