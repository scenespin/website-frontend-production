/**
 * Admin Abuse User Details API Proxy
 * 
 * Proxies GET /api/admin/abuse/user/:userId to backend API
 * 
 * ADMIN ONLY - Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const { userId } = await params;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
    const url = `${backendUrl}/api/admin/abuse/user/${userId}`;

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
    console.error('[Admin Abuse User Details Proxy] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

