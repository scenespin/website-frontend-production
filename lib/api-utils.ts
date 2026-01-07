/**
 * Shared utilities for Next.js API routes
 * Provides reusable functions for forwarding requests to the backend
 * 
 * This module eliminates code duplication across API routes and ensures
 * consistent header forwarding, especially for X-Session-Id (single-device login)
 */

import { NextRequest } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

/**
 * Builds headers for forwarding requests to the backend
 * Automatically includes X-Session-Id header if present in the request
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

  // 🔥 CRITICAL: Forward X-Session-Id header for single-device login
  const sessionIdHeader = request.headers.get('x-session-id');
  if (sessionIdHeader) {
    headers['X-Session-Id'] = sessionIdHeader;
    console.error('[API Utils] ✅ Forwarding X-Session-Id header:', sessionIdHeader.substring(0, 20) + '...');
  } else {
    console.error('[API Utils] ⚠️ No X-Session-Id header in request - session validation may fail');
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
