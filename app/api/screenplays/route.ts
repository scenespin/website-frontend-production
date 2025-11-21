import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

/**
 * POST /api/screenplays
 * Proxy to backend to create a new screenplay
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Screenplay Create API] Request received');
    const { userId, getToken } = await auth();
    
    if (!userId) {
      console.error('[Screenplay Create API] No userId found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Screenplay Create API] User authenticated:', userId);
    // Get token with wryda-backend template for backend API
    const token = await getToken({ template: 'wryda-backend' });
    if (!token) {
      console.error('[Screenplay Create API] Could not generate token');
      return NextResponse.json(
        { error: 'Unauthorized - Could not generate token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('[Screenplay Create API] Creating screenplay with data:', { title: body.title, author: body.author });

    // Proxy to backend
    const backendResponse = await fetch(`${BACKEND_API_URL}/api/screenplays`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ error: 'Backend error' }));
      console.error('[Screenplay Create API] Backend error:', errorData);
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    console.log('[Screenplay Create API] Screenplay created successfully:', data.data?.screenplay_id);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Screenplay Create API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

