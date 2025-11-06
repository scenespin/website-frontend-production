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
    console.log('[Credits Balance] Request headers:', Object.fromEntries(request.headers.entries()));
    
    const { getToken, userId, sessionClaims, sessionId } = await auth();
    console.log('[Credits Balance] Auth result:', { userId, sessionId, hasClaims: !!sessionClaims });
    
    if (!userId) {
      console.error('[Credits Balance] ❌ No userId - user not authenticated');
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated', balance: 0 },
        { status: 401 }
      );
    }
    
    // Try to get token with template
    console.log('[Credits Balance] Calling getToken with template: wryda-backend');
    let token;
    try {
      token = await getToken({ template: 'wryda-backend' });
      console.log('[Credits Balance] getToken returned:', token ? `SUCCESS (${token.length} chars)` : 'NULL');
    } catch (tokenError: any) {
      console.error('[Credits Balance] getToken threw error:', tokenError.message);
      console.error('[Credits Balance] Error stack:', tokenError.stack);
      return NextResponse.json({ 
        balance: 0, 
        error: `Token generation error: ${tokenError.message}`,
        userId 
      }, { status: 200 });
    }
    
    if (!token) {
      console.error('[Credits Balance] ❌ getToken returned null/undefined');
      console.error('[Credits Balance] userId:', userId);
      console.error('[Credits Balance] sessionId:', sessionId);
      return NextResponse.json({ 
        balance: 0, 
        error: 'Could not generate authentication token',
        userId,
        debug: { hasUserId: !!userId, hasSessionId: !!sessionId }
      }, { status: 200 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
    const url = `${backendUrl}/api/credits/balance`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
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

