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
    const { getToken, userId } = await auth();
    
    if (!userId) {
      console.error('[Sessions API] No userId from auth()');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    const token = await getToken({ template: 'wryda-backend' });
    
    if (!token) {
      console.error('[Sessions API] No token from getToken()');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No authentication token' },
        { status: 401 }
      );
    }
    
    console.log('[Sessions API] Proxying to backend', {
      userId,
      hasToken: !!token,
      tokenLength: token.length
    });

    const body = await request.json();
    const deviceInfo = body.deviceInfo || request.headers.get('user-agent') || 'unknown';
    const sessionId = body.sessionId || request.headers.get('x-session-id') || null;

    // Build headers for backend request
    const backendHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
    
    // Forward X-Session-Id header if present
    if (sessionId) {
      backendHeaders['X-Session-Id'] = sessionId;
    }

    // Proxy to backend API
    const response = await fetch(`${BACKEND_URL}/api/sessions/register`, {
      method: 'POST',
      headers: backendHeaders,
      body: JSON.stringify({ 
        deviceInfo,
        sessionId: sessionId // Pass sessionId in body too
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      
      console.error('[Sessions API] Backend returned error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        backendUrl: `${BACKEND_URL}/api/sessions/register`
      });
      
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    console.log('[Sessions API] ✅ Session registered successfully');
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[Sessions API] Exception during registration:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
