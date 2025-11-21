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
    console.log('[Screenplay Create API] Request URL:', request.url);
    console.log('[Screenplay Create API] Request method:', request.method);
    
    const authResult = await auth();
    console.log('[Screenplay Create API] Auth result:', { 
      hasUserId: !!authResult.userId, 
      userId: authResult.userId,
      hasGetToken: !!authResult.getToken 
    });
    
    const { userId, getToken } = authResult;
    
    if (!userId) {
      console.error('[Screenplay Create API] No userId found - returning 401');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No user ID found in session' },
        { status: 401 }
      );
    }

    console.log('[Screenplay Create API] User authenticated:', userId);
    // Get token with wryda-backend template for backend API
    const token = await getToken({ template: 'wryda-backend' });
    if (!token) {
      console.error('[Screenplay Create API] Could not generate token - returning 401');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Could not generate authentication token' },
        { status: 401 }
      );
    }

    console.log('[Screenplay Create API] Token generated successfully');
    const body = await request.json();
    console.log('[Screenplay Create API] Creating screenplay with data:', { title: body.title, author: body.author });

    // Proxy to backend
    const backendUrl = `${BACKEND_API_URL}/api/screenplays`;
    console.log('[Screenplay Create API] Proxying to backend:', backendUrl);
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('[Screenplay Create API] Backend response status:', backendResponse.status);
    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ error: 'Backend error' }));
      console.error('[Screenplay Create API] Backend error:', backendResponse.status, errorData);
      return NextResponse.json(
        { 
          error: 'Backend error', 
          message: errorData.error || errorData.message || 'Failed to create screenplay',
          details: errorData 
        }, 
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    console.log('[Screenplay Create API] Screenplay created successfully:', data.data?.screenplay_id);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Screenplay Create API] Unexpected error:', error);
    console.error('[Screenplay Create API] Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error.message || 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

