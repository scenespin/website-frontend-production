import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

/**
 * POST /api/chat/generate
 * Proxy to backend chat generation API
 */
export async function POST(request: Request) {
  try {
    // Get the token from the Authorization header that the client sent
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      console.error('[Chat API] No token in Authorization header');
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Verify user is authenticated with Clerk
    const { userId } = await auth();
    if (!userId) {
      console.error('[Chat API] User not authenticated');
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();

    // Forward to backend
    const response = await fetch(`${BACKEND_API_URL}/api/chat/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Chat API] Backend error:', response.status, data);
      return NextResponse.json(
        data,
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Chat API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

