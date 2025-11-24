import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

// 🔥 CRITICAL: Disable Next.js caching for screenplay GET requests
// This ensures fresh data is always fetched from the backend
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/screenplays/[id]
 * Proxy to backend to get a screenplay by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[Screenplay Get API] Request received');
    const { userId, getToken } = await auth();
    
    if (!userId) {
      console.error('[Screenplay Get API] No userId found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Screenplay Get API] User authenticated:', userId);
    // Get token with wryda-backend template for backend API
    const token = await getToken({ template: 'wryda-backend' });
    if (!token) {
      console.error('[Screenplay Get API] Could not generate token');
      return NextResponse.json(
        { error: 'Unauthorized - Could not generate token' },
        { status: 401 }
      );
    }

    const { id } = await params;
    console.log('[Screenplay Get API] Fetching screenplay:', id);

    // Proxy to backend
    const backendResponse = await fetch(`${BACKEND_API_URL}/api/screenplays/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ error: 'Backend error' }));
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    
    // 🔥 CRITICAL: Set cache headers to prevent browser/Next.js caching
    // This ensures fresh data is always loaded, especially after saves
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: any) {
    console.error('[Screenplay Get API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/screenplays/[id]
 * Proxy to backend to update a screenplay
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[Screenplay Update API] Request received');
    const { userId, getToken } = await auth();
    
    if (!userId) {
      console.error('[Screenplay Update API] No userId found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Screenplay Update API] User authenticated:', userId);
    // Get token with wryda-backend template for backend API
    const token = await getToken({ template: 'wryda-backend' });
    if (!token) {
      console.error('[Screenplay Update API] Could not generate token');
      return NextResponse.json(
        { error: 'Unauthorized - Could not generate token' },
        { status: 401 }
      );
    }

    const { id } = await params;
    console.log('[Screenplay Update API] Updating screenplay:', id);

    // Get request body
    const body = await request.json();

    // Proxy to backend
    const backendResponse = await fetch(`${BACKEND_API_URL}/api/screenplays/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ error: 'Backend error' }));
      console.error('[Screenplay Update API] Backend error:', backendResponse.status, errorData);
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    console.log('[Screenplay Update API] Successfully updated screenplay');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Screenplay Update API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/screenplays/[id]
 * Proxy to backend to delete a screenplay (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[Screenplay Delete API] Request received');
    const { userId, getToken } = await auth();
    
    if (!userId) {
      console.error('[Screenplay Delete API] No userId found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Screenplay Delete API] User authenticated:', userId);
    // Get token with wryda-backend template for backend API
    const token = await getToken({ template: 'wryda-backend' });
    if (!token) {
      console.error('[Screenplay Delete API] Could not generate token');
      return NextResponse.json(
        { error: 'Unauthorized - Could not generate token' },
        { status: 401 }
      );
    }

    const { id } = await params;
    console.log('[Screenplay Delete API] Deleting screenplay:', id);

    // Proxy to backend
    const backendResponse = await fetch(`${BACKEND_API_URL}/api/screenplays/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ error: 'Backend error' }));
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Screenplay Delete API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

