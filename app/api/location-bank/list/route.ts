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
    console.log('[Location Bank List] Starting request...');
    
    // Verify user is authenticated with Clerk
    const authResult = await auth();
    const { userId, getToken } = authResult;
    
    console.log('[Location Bank List] Auth result:', { 
      userId: userId || 'null',
      hasGetToken: !!getToken 
    });
    
    if (!userId) {
      console.error('[Location Bank List] ❌ No userId - user not authenticated');
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Get Clerk token for backend API
    const token = await getToken({ template: 'wryda-backend' });
    console.log('[Location Bank List] Token result:', { 
      hasToken: !!token,
      tokenLength: token?.length || 0 
    });
    
    if (!token) {
      console.error('[Location Bank List] ❌ Failed to get backend token');
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

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
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
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Location bank list API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

