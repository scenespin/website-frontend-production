/**
 * Projects List API Route
 * 
 * Proxies requests to backend projects service
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[Projects List] Request received');
    // Verify user is authenticated with Clerk and get token
    const { userId, getToken } = await auth();
    if (!userId) {
      console.error('[Projects List] User not authenticated');
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    console.log('[Projects List] User authenticated:', userId);
    // Get token with wryda-backend template for backend API
    const token = await getToken({ template: 'wryda-backend' });
    if (!token) {
      console.error('[Projects List] Could not generate token');
      return NextResponse.json(
        { error: 'Unauthorized - Could not generate token' },
        { status: 401 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
    const url = `${backendUrl}/api/projects/list`;

    console.log('[Projects List] Fetching from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[Projects List] Backend response status:', response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Backend error' }));
      console.error('[Projects List] Backend error:', error);
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[Projects List] API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
