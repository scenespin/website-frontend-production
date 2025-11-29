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
    // Verify user is authenticated with Clerk and get backend token
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    const token = await getToken({ template: 'wryda-backend' });
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Could not generate token' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    // Forward request to backend
    const url = `${BACKEND_API_URL}/api/asset-bank${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
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
    
    // Verify user is authenticated with Clerk and get backend token
    let authResult;
    try {
      authResult = await auth();
      console.log('[Asset Bank Proxy] Auth result:', { 
        hasUserId: !!authResult.userId, 
        hasGetToken: !!authResult.getToken,
        userId: authResult.userId 
      });
    } catch (authError: any) {
      console.error('[Asset Bank Proxy] ❌ Auth() failed:', authError.message);
      return NextResponse.json(
        { error: 'Unauthorized - Authentication failed' },
        { status: 401 }
      );
    }
    
    const { userId, getToken } = authResult;
    
    if (!userId) {
      console.error('[Asset Bank Proxy] ❌ No userId - user not authenticated');
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    let token;
    try {
      token = await getToken({ template: 'wryda-backend' });
      console.log('[Asset Bank Proxy] Token generation result:', token ? `success (${token.length} chars)` : 'null/undefined');
    } catch (tokenError: any) {
      console.error('[Asset Bank Proxy] ❌ getToken() failed:', tokenError.message);
      console.error('[Asset Bank Proxy] Token error stack:', tokenError.stack);
      return NextResponse.json(
        { error: 'Unauthorized - Could not generate token', details: tokenError.message },
        { status: 401 }
      );
    }
    
    if (!token) {
      console.error('[Asset Bank Proxy] ❌ No token - getToken returned null/undefined');
      return NextResponse.json(
        { error: 'Unauthorized - Could not generate token' },
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

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
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

