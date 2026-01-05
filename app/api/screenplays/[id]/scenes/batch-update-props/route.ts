import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

// 🔥 CRITICAL: Disable Next.js caching for batch update requests
// This ensures fresh data is always processed
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/screenplays/[id]/scenes/batch-update-props
 * Proxy to backend to batch update prop associations for multiple scenes
 * Matches pattern from app/api/screenplays/[id]/route.ts
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[Batch Update Props API] Request received');
    
    // Validate user is authenticated with Clerk
    const { userId } = await auth();
    if (!userId) {
      console.error('[Batch Update Props API] No userId found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get token from Authorization header (client already has it)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Batch Update Props API] No Authorization header');
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    console.log('[Batch Update Props API] Using token from Authorization header, userId:', userId);

    const { id } = await params;
    console.log('[Batch Update Props API] Batch updating props for screenplay:', id);

    // Get request body
    const body = await request.json();

    // Proxy to backend
    const backendUrl = `${BACKEND_API_URL}/api/screenplays/${id}/scenes/batch-update-props`;
    console.log('[Batch Update Props API] Proxying to backend:', backendUrl);
    
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('[Batch Update Props API] Backend response status:', backendResponse.status);
    
    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ error: 'Backend error' }));
      console.error('[Batch Update Props API] ❌ Backend error:', backendResponse.status, errorData);
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    console.log('[Batch Update Props API] ✅ Successfully batch updated prop associations');
    
    // 🔥 CRITICAL: Set cache headers to prevent browser/Next.js caching
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
