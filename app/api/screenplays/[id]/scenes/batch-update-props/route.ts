import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/screenplays/[id]/scenes/batch-update-props
 * Proxy to backend to batch update prop associations for multiple scenes
 * Matches pattern from catch-all route - forwards auth header directly
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const backendUrl = `${BACKEND_API_URL}/api/screenplays/${id}/scenes/batch-update-props`;
    
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ error: 'Backend error' }));
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: any) {
    console.error('[Batch Update Props API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
