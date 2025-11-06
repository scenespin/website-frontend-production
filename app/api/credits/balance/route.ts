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
    const { getToken, userId, sessionClaims } = await auth();
    console.log('[Credits Balance] Auth result - userId:', userId);
    console.log('[Credits Balance] Session claims:', sessionClaims ? 'Present' : 'Missing');
    
    if (!userId) {
      console.error('[Credits Balance] ❌ No userId - user not authenticated');
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated', balance: 0 },
        { status: 401 }
      );
    }
    
    // Get token - use wryda-backend template for custom backend API
    // This template should be configured in Clerk Dashboard → JWT Templates
    const token = await getToken({ template: 'wryda-backend' });
    
    console.log('[Credits Balance] Token result:', token ? `Token received (length: ${token.length})` : 'NO TOKEN RECEIVED');

    if (!token) {
      console.error('[Credits Balance] ❌ No auth token - getToken returned null/undefined');
      console.error('[Credits Balance] This usually means:');
      console.error('  1. Clerk JWT Templates are not configured properly');
      console.error('  2. User session has expired');
      console.error('  3. Clerk middleware is not set up correctly');
      
      // Instead of failing, return 0 balance with error
      return NextResponse.json({ 
        balance: 0, 
        error: 'Could not generate authentication token',
        userId: userId 
      }, { status: 200 }); // Return 200 so frontend doesn't retry
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

