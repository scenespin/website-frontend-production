import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

/**
 * POST /api/screenplays/autosave
 * Autosave endpoint optimized for beforeunload/keepalive requests
 * This endpoint is designed to work with fetch keepalive flag for guaranteed delivery
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, getToken } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = await getToken({ template: 'wryda-backend' });
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Could not generate token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { screenplay_id, title, author, content, expectedVersion, force } = body;

    if (!screenplay_id || !screenplay_id.startsWith('screenplay_')) {
      return NextResponse.json(
        { error: 'Invalid screenplay ID' },
        { status: 400 }
      );
    }

    // Feature 0133: Include expectedVersion and force in request body for optimistic locking
    const updateBody: any = {
      title: title || 'Untitled Screenplay',
      author: author || 'Anonymous',
      content: content || ''
    };
    
    if (expectedVersion !== undefined) {
      updateBody.expectedVersion = expectedVersion;
    }
    if (force !== undefined) {
      updateBody.force = force;
    }

    // Proxy to backend update endpoint
    const backendResponse = await fetch(`${BACKEND_API_URL}/api/screenplays/${screenplay_id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateBody),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ error: 'Backend error' }));
      // Feature 0133: Forward conflict errors (409) with full details
      return NextResponse.json(
        errorData,
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[Autosave API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

