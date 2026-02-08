/**
 * Location Bank ensure-angle-media API Route
 *
 * Proxies POST to backend to ensure all angle variations for a location
 * are registered in the Media Library (fixes orphans when registration failed during angle job).
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - User not authenticated' }, { status: 401 });
    }

    const { locationId } = await params;
    const { searchParams } = new URL(request.url);
    const screenplayId = searchParams.get('screenplayId') || searchParams.get('projectId');

    if (!screenplayId) {
      return NextResponse.json({ error: 'screenplayId query parameter is required' }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
    const url = `${backendUrl}/api/location-bank/${locationId}/ensure-angle-media?screenplayId=${encodeURIComponent(screenplayId)}`;

    const response = await fetch(url, {
      method: 'POST',
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
    console.error('[Location Bank ensure-angle-media] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
