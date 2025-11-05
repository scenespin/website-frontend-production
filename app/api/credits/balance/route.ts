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
    const { getToken, userId } = await auth();
    console.log('[Credits Balance] Auth result - userId:', userId);
    
    const token = await getToken({ template: 'wryda-backend' });
    console.log('[Credits Balance] Token result:', token ? 'Token received (length: ' + token.length + ')' : 'NO TOKEN RECEIVED');

    if (!token) {
      console.error('[Credits Balance] ❌ No auth token - getToken returned null/undefined');
      console.error('[Credits Balance] Template requested: wryda-backend');
      console.error('[Credits Balance] UserId from auth:', userId);
      return NextResponse.json(
        { error: 'Unauthorized - Could not generate JWT token with template: wryda-backend' },
        { status: 401 }
      );
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

