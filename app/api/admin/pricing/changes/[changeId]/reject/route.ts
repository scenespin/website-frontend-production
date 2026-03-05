import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ changeId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const { changeId } = await params;
    const body = await request.json().catch(() => ({}));
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
    const url = `${backendUrl}/api/admin/pricing/changes/${encodeURIComponent(changeId)}/reject`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || data.message || `HTTP ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Admin Pricing Reject Proxy] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

