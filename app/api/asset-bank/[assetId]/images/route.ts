/**
 * Asset Bank Images API Route
 * 
 * Proxies requests to backend asset bank service for asset images
 * Handles: POST (register image with asset)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    // Verify user is authenticated with Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Try to get token from Authorization header first (client-side token)
    const authHeader = request.headers.get('authorization');
    let token = authHeader?.replace('Bearer ', '');
    
    // If no token in header, try to generate one server-side
    if (!token) {
      try {
        const { getToken } = await auth();
        token = await getToken({ template: 'wryda-backend' });
      } catch (tokenError: any) {
        console.error('[Asset Bank Images Proxy] ❌ getToken() failed:', tokenError.message);
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Could not get authentication token' },
        { status: 401 }
      );
    }

    // Next.js 15: params is now a Promise
    const { assetId } = await params;
    const body = await request.json();

    // Forward request to backend
    const url = `${BACKEND_API_URL}/api/asset-bank/${assetId}/images`;

    console.log('[Asset Bank Images Proxy] POST request:', { assetId, url, bodyKeys: Object.keys(body) });

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Backend error');
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText || 'Backend error' };
      }
      console.error('[Asset Bank Images Proxy] ❌ POST backend error:', {
        status: response.status,
        statusText: response.statusText,
        error,
        assetId
      });
      return NextResponse.json(
        error,
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Asset Bank Images Proxy] ✅ POST success:', { assetId });
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[Asset Bank Images] API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
