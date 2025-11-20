import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

/**
 * GET /api/screenplays/list
 * Proxy to backend to list user's screenplays
 * Query params: status (active|archived|deleted), limit (number)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, getToken } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get token with wryda-backend template for backend API
    const token = await getToken({ template: 'wryda-backend' });
    if (!token) {
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
    const backendResponse = await fetch(
      `${BACKEND_API_URL}/api/screenplays/list?status=${status}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ error: 'Backend error' }));
      console.error('[Screenplay List API] Backend error:', backendResponse.status, errorData);
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
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

