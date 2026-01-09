/**
 * Location Bank List API Route
 * 
 * Proxies requests to backend location bank service for listing location profiles
 * Feature 0142: Location Bank Unification
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Ensure this route is dynamic and not cached
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Get the token from the Authorization header that the client sent
    const authHeader = request.headers.get('authorization');
    const clientToken = authHeader?.replace('Bearer ', '');
    
    // Verify user is authenticated with Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Use the token from the client if available, otherwise get a new one
    // This matches the pattern used in character-bank/list route
    let token = clientToken;
    if (!token) {
      const { getToken } = await auth();
      token = await getToken({ template: 'wryda-backend' });
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Failed to get backend token' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const screenplayId = searchParams.get('screenplayId') || searchParams.get('projectId');

    if (!screenplayId) {
      return NextResponse.json(
        { error: 'screenplayId is required' },
        { status: 400 }
      );
    }

    // Forward request to backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
    const url = `${backendUrl}/api/location-bank/list?screenplayId=${screenplayId}`;
    
    console.log('[Location Bank List] Forwarding to backend:', { url, screenplayId });

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store', // 🔥 FIX: Prevent Node.js/Next.js fetch caching
    });

    console.log('[Location Bank List] Backend response:', { 
      status: response.status,
      ok: response.ok 
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: response.status === 404 
          ? 'Backend route not found. Please ensure the backend is deployed with the latest changes.'
          : 'Backend error'
      }));
      console.error('[Location Bank] Backend error:', {
        status: response.status,
        error,
        url
      });
      return NextResponse.json(
        error,
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Location Bank List] Success, returning data');
    
    // 🔥 FIX: Prevent browser caching of API responses
    // This ensures Production Hub always gets fresh data
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error: any) {
    console.error('Location bank list API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

