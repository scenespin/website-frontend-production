/**
 * Workflows List API Route
 * 
 * Proxies requests to backend workflows service
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    // Get auth token
    const { getToken } = await auth();
    const token = await getToken({ template: 'wryda-backend' });

    if (!token) {
      console.error('[Workflows List] No auth token');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query params from request URL
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || 'default';
    const status = searchParams.get('status') || '';
    const limit = searchParams.get('limit') || '50';

    // Forward request to backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
    const url = `${backendUrl}/api/workflows/list?projectId=${projectId}&status=${status}&limit=${limit}`;

    console.log('[Workflows List] Fetching from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[Workflows List] Backend response status:', response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Backend error' }));
      console.error('[Workflows List] Backend error:', error);
      return NextResponse.json(
        error,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[Workflows List] API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

