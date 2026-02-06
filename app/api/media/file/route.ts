/**
 * Media File Proxy API Route
 * 
 * Proxies image/media file requests to backend with server-side authentication.
 * This allows <img src="/api/media/file?key=..."> to work without client-side auth headers.
 * 
 * Feature 0243: Media File Proxy (Stable URL + Cache)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Ensure this route is dynamic and not cached
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated with Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Get authentication token server-side
    let token: string | null = null;
    try {
      const { getToken } = await auth();
      token = await getToken({ template: 'wryda-backend' });
    } catch (tokenError: any) {
      console.error('[Media File Proxy] ❌ getToken() failed:', tokenError.message);
      return NextResponse.json(
        { error: 'Unauthorized - Could not get authentication token' },
        { status: 401 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Could not get authentication token' },
        { status: 401 }
      );
    }

    // Get query parameters from request
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const provider = searchParams.get('provider');
    const path = searchParams.get('path');

    // Build backend URL with query parameters
    const backendParams = new URLSearchParams();
    if (key) backendParams.set('key', key);
    if (provider) backendParams.set('provider', provider);
    if (path) backendParams.set('path', path);

    const backendUrl = `${BACKEND_API_URL}/api/media/file?${backendParams.toString()}`;

    // Forward request to backend with authentication
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      // Don't cache - let backend set Cache-Control headers
      cache: 'no-store',
    });

    // If backend returns an error, forward it
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Backend error');
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: 'Backend error', message: errorText };
      }
      return NextResponse.json(errorData, { status: response.status });
    }

    // Get the content type from backend response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const cacheControl = response.headers.get('cache-control') || 'public, max-age=86400';

    // Stream the response back to client
    const blob = await response.blob();
    
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
      },
    });
  } catch (error: any) {
    console.error('[Media File Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
