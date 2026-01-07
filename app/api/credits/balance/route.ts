/**
 * Credits Balance API Route
 * 
 * Proxies requests to backend credits service
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[Credits Balance] Starting request...');
    console.log('[Credits Balance] Headers:', Object.fromEntries(request.headers.entries()));
    
    // Get the token from the Authorization header that the client sent
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    console.log('[Credits Balance] Auth header:', authHeader ? 'Present' : 'Missing');
    console.log('[Credits Balance] Token extracted:', token ? `Present (${token.length} chars)` : 'Missing');
    
    if (!token) {
      console.error('[Credits Balance] ❌ No token in Authorization header');
      return NextResponse.json(
        { error: 'Unauthorized - No token provided', balance: 0 },
        { status: 401 }
      );
    }
    
    // Verify user is authenticated with Clerk
    const { userId } = await auth();
    console.log('[Credits Balance] Clerk userId:', userId);
    
    if (!userId) {
      console.error('[Credits Balance] ❌ No userId - user not authenticated');
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated', balance: 0 },
        { status: 401 }
      );
    }
    
    console.log('[Credits Balance] User authenticated:', userId);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
    // Forward refresh query parameter to backend to bypass cache if needed
    const searchParams = request.nextUrl.searchParams;
    const refresh = searchParams.get('refresh');
    const url = refresh 
      ? `${backendUrl}/api/credits/balance?refresh=true`
      : `${backendUrl}/api/credits/balance`;

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
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[Credits Balance] API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

