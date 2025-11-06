/**
 * useAuthenticatedFetch Hook
 * 
 * Returns a fetch function that automatically includes Clerk JWT authentication.
 * Use this instead of plain fetch() for all API calls.
 * 
 * @example
 * const authFetch = useAuthenticatedFetch();
 * const response = await authFetch('/api/something');
 */

import { useAuth } from '@clerk/nextjs';
import { useCallback } from 'react';

export function useAuthenticatedFetch() {
  const { getToken } = useAuth();

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const token = await getToken({ template: 'wryda-backend' });
      
      const headers = new Headers(init?.headers);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      
      return fetch(input, {
        ...init,
        headers,
      });
    },
    [getToken]
  );

  return authFetch;
}

