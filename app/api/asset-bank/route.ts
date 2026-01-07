/**
 * Asset Bank API Route
 * 
 * Proxies requests to backend asset bank service
 * Handles: GET (list), POST (create)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

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

    // Try to get token from Authorization header first (client-side token)
    const authHeader = request.headers.get('authorization');
    let token = authHeader?.replace('Bearer ', '');
    
    // If no token in header, try to generate one server-side
    if (!token) {
      try {
        const { getToken } = await auth();
        token = await getToken({ template: 'wryda-backend' });
      } catch (tokenError: any) {
        console.error('[Asset Bank Proxy] ❌ getToken() failed:', tokenError.message);
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Could not get authentication token' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    // Forward request to backend
    const url = `${BACKEND_API_URL}/api/asset-bank${queryString ? `?${queryString}` : ''}`;

    // 🔥 CRITICAL: Forward X-Session-Id header for single-device login
    const sessionIdHeader = request.headers.get('x-session-id');
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    if (sessionIdHeader) {
      headers['X-Session-Id'] = sessionIdHeader;
      console.error('[Asset Bank Proxy] ✅ Forwarding X-Session-Id header:', sessionIdHeader.substring(0, 20) + '...');
    } else {
      console.error('[Asset Bank Proxy] ⚠️ No X-Session-Id header in request - session validation may fail');
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Backend error' }));
      console.error('[Asset Bank] Backend error:', error);
      return NextResponse.json(
        error,
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Asset Bank Proxy] ✅ Success - asset created');
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[Asset Bank Proxy] ❌ POST API error:', error);
    console.error('[Asset Bank Proxy] Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Asset Bank Proxy] POST request received');
    
    // Verify user is authenticated with Clerk
    const { userId } = await auth();
    
    if (!userId) {
      console.error('[Asset Bank Proxy] ❌ No userId - user not authenticated');
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
        console.log('[Asset Bank Proxy] Generated server-side token:', token ? `success (${token.length} chars)` : 'null');
      } catch (tokenError: any) {
        console.error('[Asset Bank Proxy] ❌ getToken() failed:', tokenError.message);
      }
    } else {
      console.log('[Asset Bank Proxy] Using client-provided token:', token.length, 'chars');
    }
    
    if (!token) {
      console.error('[Asset Bank Proxy] ❌ No token available - neither from header nor generated');
      return NextResponse.json(
        { error: 'Unauthorized - Could not get authentication token' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    console.log('[Asset Bank Proxy] Request body:', { 
      hasName: !!body.name, 
      hasCategory: !!body.category,
      hasScreenplayId: !!body.screenplayId 
    });

    // Forward request to backend
    const url = `${BACKEND_API_URL}/api/asset-bank`;
    console.log('[Asset Bank Proxy] Forwarding to backend:', url);

    // 🔥 CRITICAL: Forward X-Session-Id header for single-device login
    const sessionIdHeader = request.headers.get('x-session-id');
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    if (sessionIdHeader) {
      headers['X-Session-Id'] = sessionIdHeader;
      console.error('[Asset Bank Proxy] ✅ Forwarding X-Session-Id header:', sessionIdHeader.substring(0, 20) + '...');
    } else {
      console.error('[Asset Bank Proxy] ⚠️ No X-Session-Id header in request - session validation may fail');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    console.log('[Asset Bank Proxy] Backend response status:', response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Backend error' }));
      console.error('[Asset Bank Proxy] ❌ Backend error:', error);
      return NextResponse.json(
        error,
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Asset Bank Proxy] ✅ Success - asset created');
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[Asset Bank] API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

