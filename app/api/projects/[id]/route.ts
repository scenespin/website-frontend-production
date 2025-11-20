import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

/**
 * GET /api/projects/[id]
 * Proxy to backend to get a project by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[Project Get API] Request received');
    const { userId, getToken } = await auth();
    
    if (!userId) {
      console.error('[Project Get API] No userId found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Project Get API] User authenticated:', userId);
    // Get token with wryda-backend template for backend API
    const token = await getToken({ template: 'wryda-backend' });
    if (!token) {
      console.error('[Project Get API] Could not generate token');
      return NextResponse.json(
        { error: 'Unauthorized - Could not generate token' },
        { status: 401 }
      );
    }

    const { id } = await params;
    console.log('[Project Get API] Fetching project:', id);

    // Proxy to backend
    const backendResponse = await fetch(`${BACKEND_API_URL}/api/projects/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ error: 'Backend error' }));
      console.error('[Project Get API] Backend error:', backendResponse.status, errorData);
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    console.log('[Project Get API] Successfully fetched project');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Project Get API] Error:', error);
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
 * DELETE /api/projects/[id]
 * Proxy to backend to delete a project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[Project Delete API] Request received');
    const { userId, getToken } = await auth();
    
    if (!userId) {
      console.error('[Project Delete API] No userId found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Project Delete API] User authenticated:', userId);
    // Get token with wryda-backend template for backend API
    const token = await getToken({ template: 'wryda-backend' });
    if (!token) {
      console.error('[Project Delete API] Could not generate token');
      return NextResponse.json(
        { error: 'Unauthorized - Could not generate token' },
        { status: 401 }
      );
    }

    const { id } = await params;
    console.log('[Project Delete API] Deleting project:', id);

    // Proxy to backend
    const backendResponse = await fetch(`${BACKEND_API_URL}/api/projects/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      let errorData;
      try {
        const errorText = await backendResponse.text();
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { 
          error: 'Backend error',
          message: `Backend returned ${backendResponse.status} ${backendResponse.statusText}`
        };
      }
      console.error('[Project Delete API] Backend error:', {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        error: errorData,
        projectId: id
      });
      return NextResponse.json(errorData, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    console.log('[Project Delete API] Successfully deleted project');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Project Delete API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

