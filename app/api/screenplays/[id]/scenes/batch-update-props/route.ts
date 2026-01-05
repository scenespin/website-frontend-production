import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

// 🔥 CRITICAL: Disable Next.js caching for this endpoint
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST /api/screenplays/[id]/scenes/batch-update-props
 * Proxy to backend to batch update prop associations for multiple scenes
 * Prevents race conditions from parallel updates
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[Batch Update Props API] Request received');
    
    // Get authorization header from client request (already includes Bearer token)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.error('[Batch Update Props API] No authorization header found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    console.log('[Batch Update Props API] Batch updating props for screenplay:', id);

    // Get request body
    const body = await request.json();
    console.log('[Batch Update Props API] Request body:', {
      asset_id: body.asset_id,
      linkCount: body.scene_ids_to_link?.length || 0,
      unlinkCount: body.scene_ids_to_unlink?.length || 0
    });

    // Proxy to backend
    const backendUrl = `${BACKEND_API_URL}/api/screenplays/${id}/scenes/batch-update-props`;
    console.log('[Batch Update Props API] Proxying to backend:', backendUrl);
    
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
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
