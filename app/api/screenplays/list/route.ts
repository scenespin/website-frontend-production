import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

// 🔥 FIX: Disable Next.js caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/screenplays/list
 * Proxy to backend to list user's screenplays
 * Query params: status (active|archived|deleted), limit (number)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Screenplay List API] Request received');
    const { userId, getToken } = await auth();
    
    if (!userId) {
      console.error('[Screenplay List API] No userId found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Screenplay List API] User authenticated:', userId);
    // Get token with wryda-backend template for backend API
    const token = await getToken({ template: 'wryda-backend' });
    if (!token) {
      console.error('[Screenplay List API] Could not generate token');
      return NextResponse.json(
        { error: 'Unauthorized - Could not generate token' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const limit = searchParams.get('limit') || '50';

    // Proxy to backend
    const backendUrl = `${BACKEND_API_URL}/api/screenplays/list?status=${status}&limit=${limit}`;
    console.log('[Screenplay List API] Proxying to backend:', backendUrl);
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[Screenplay List API] Backend response status:', backendResponse.status);
    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ error: 'Backend error' }));
      console.error('[Screenplay List API] Backend error:', backendResponse.status, errorData);
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    console.log('[Screenplay List API] Backend response data:', { 
      success: data?.success, 
      count: data?.data?.count || data?.count,
      screenplaysCount: data?.data?.screenplays?.length || data?.screenplays?.length 
    });
    
    // 🔥 FIX: Add cache control headers to prevent stale data
    const response = NextResponse.json(data);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error: any) {
    console.error('[Screenplay List API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

