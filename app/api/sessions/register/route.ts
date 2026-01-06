/**
 * Next.js API Route: Register Active Session
 * 
 * Proxies to backend API for single-device login session management.
 * Called automatically when user signs in.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || '';

export async function POST(request: NextRequest) {
  try {
    const { getToken } = await auth();
    const token = await getToken({ template: 'wryda-backend' });
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No authentication token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const deviceInfo = body.deviceInfo || request.headers.get('user-agent') || 'unknown';

    // Proxy to backend API
    const response = await fetch(`${BACKEND_URL}/api/sessions/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ deviceInfo }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[Sessions API] Failed to register session:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
