/**
 * Shared utilities for Next.js API routes
 * Provides reusable functions for forwarding requests to the backend
 */

import { NextRequest } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

/**
 * Builds headers for forwarding requests to the backend
 * 
 * @param request - The incoming Next.js request
 * @param token - The authentication token
 * @param contentType - Optional content type (defaults to 'application/json')
 * @param skipContentType - If true, don't set Content-Type (useful for multipart/form-data)
 * @returns Headers object ready for backend fetch
 */
export function buildBackendHeaders(
  request: NextRequest,
  token: string,
  contentType: string = 'application/json',
  skipContentType: boolean = false
): Record<string, string> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
  };

  // Only set Content-Type if not skipped (e.g., for multipart/form-data)
  if (!skipContentType) {
    headers['Content-Type'] = contentType;
  }

  return headers;
}

/**
 * Gets the backend URL for a given API path
 * 
 * @param path - The API path (e.g., 'asset-bank' or 'asset-bank/123')
 * @param queryString - Optional query string
 * @returns Full backend URL
 */
export function getBackendUrl(path: string, queryString?: string): string {
  const baseUrl = `${BACKEND_API_URL}/api/${path}`;
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}
