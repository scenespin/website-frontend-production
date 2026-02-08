/**
 * Location Bank [locationId] API Route
 *
 * Proxies PUT and DELETE requests to backend location bank service for a specific location.
 * Matches the pattern used by character-bank/[characterId]/route.ts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PUT(
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

    const body = await request.json();

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
    const url = `${backendUrl}/api/location-bank/${locationId}?screenplayId=${encodeURIComponent(screenplayId)}`;

    console.log('[Location Bank PUT] Forwarding to backend:', { url, locationId, screenplayId, bodyKeys: Object.keys(body) });

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Backend error' }));
      console.error('[Location Bank PUT] Backend error:', { status: response.status, error });
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    console.log('[Location Bank PUT] Success:', { locationId, screenplayId });
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Location Bank PUT] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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
    const url = `${backendUrl}/api/location-bank/${locationId}?screenplayId=${encodeURIComponent(screenplayId)}`;

    console.log('[Location Bank DELETE] Forwarding to backend:', { url, locationId, screenplayId });

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Backend error' }));
      console.error('[Location Bank DELETE] Backend error:', { status: response.status, error });
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    console.log('[Location Bank DELETE] Success:', { locationId, screenplayId });
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Location Bank DELETE] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
