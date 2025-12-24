/**
 * Admin Health API Proxy
 * 
 * Proxies GET /api/admin/health to backend API
 * 
 * ADMIN ONLY - Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the token from the Authorization header that the client sent
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Forward request to backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
    const url = `${backendUrl}/api/admin/health`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: `HTTP ${response.status}: ${response.statusText}` 
      }));
      return NextResponse.json(
        { error: errorData.error || errorData.message || 'Backend request failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Admin Health Proxy] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}




