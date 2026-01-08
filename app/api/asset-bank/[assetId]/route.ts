/**
 * Asset Bank Asset ID API Route
 * 
 * Proxies requests to backend asset bank service for specific assets
 * Handles: GET (get asset), PUT (update asset), DELETE (delete asset)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

export async function GET(
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
        console.error('[Asset Bank Proxy] ❌ getToken() failed:', tokenError.message);
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

    // 🔥 FIX: Forward context query parameter to backend
    const searchParams = request.nextUrl.searchParams;
    const context = searchParams.get('context');
    const contextParam = context ? `?context=${context}` : '';

    // Forward request to backend
    const url = `${BACKEND_API_URL}/api/asset-bank/${assetId}${contextParam}`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

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
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[Asset Bank] API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
        console.error('[Asset Bank Proxy] ❌ getToken() failed:', tokenError.message);
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

    // 🔥 FIX: Forward context query parameter to backend
    const searchParams = request.nextUrl.searchParams;
    const context = searchParams.get('context');
    const contextParam = context ? `?context=${context}` : '';
    
    // Forward request to backend
    const url = `${BACKEND_API_URL}/api/asset-bank/${assetId}${contextParam}`;

    console.log('[Asset Bank Proxy] PUT request:', { assetId, context, url });

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
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
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[Asset Bank] API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
        console.error('[Asset Bank Proxy] ❌ getToken() failed:', tokenError.message);
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

    // Forward request to backend
    const url = `${BACKEND_API_URL}/api/asset-bank/${assetId}`;

    console.log('[Asset Bank Proxy] DELETE request:', { assetId, url });

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    console.log('[Asset Bank Proxy] DELETE response status:', response.status);

    // Handle 204 No Content (successful delete)
    if (response.status === 204) {
      console.log('[Asset Bank Proxy] ✅ DELETE successful (204)');
      return new NextResponse(null, { status: 204 });
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Backend error');
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText || 'Backend error' };
      }
      console.error('[Asset Bank Proxy] ❌ DELETE backend error:', error);
      console.error('[Asset Bank Proxy] Response status:', response.status);
      return NextResponse.json(
        error,
        { status: response.status }
      );
    }

    // If response has content, return it
    const data = await response.json().catch(() => null);
    if (data) {
      return NextResponse.json(data);
    }
    
    return new NextResponse(null, { status: 204 });

  } catch (error: any) {
    console.error('[Asset Bank] API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

