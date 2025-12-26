/**
 * Character Bank Get API Route
 * 
 * Proxies GET requests to backend character bank service for a specific character
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) {
  try {
    // Get the token from the Authorization header that the client sent
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }
    
    // Verify user is authenticated with Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Next.js 15: params is now a Promise
    const { characterId } = await params;
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const screenplayId = searchParams.get('screenplayId') || searchParams.get('projectId');

    if (!screenplayId) {
      return NextResponse.json(
        { error: 'screenplayId query parameter is required' },
        { status: 400 }
      );
    }

    // Forward request to backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
    const url = `${backendUrl}/api/character-bank/${characterId}?screenplayId=${screenplayId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Backend error' }));
      console.error('[Character Bank] Backend error:', error);
      return NextResponse.json(
        error,
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Debug logging
    console.log('[Character Bank API Route] Backend response:', {
      hasSuccess: !!data.success,
      hasCharacter: !!data.character,
      characterId: data.character?.id,
      poseRefsCount: data.character?.poseReferences?.length || data.character?.angleReferences?.length || 0,
      responseKeys: Object.keys(data)
    });
    
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Character bank get API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) {
  try {
    // Get the token from the Authorization header that the client sent
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }
    
    // Verify user is authenticated with Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Next.js 15: params is now a Promise
    const { characterId } = await params;
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const screenplayId = searchParams.get('screenplayId') || searchParams.get('projectId');

    // Get request body
    const body = await request.json();

    // Forward request to backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
    const url = `${backendUrl}/api/character-bank/${characterId}${screenplayId ? `?screenplayId=${encodeURIComponent(screenplayId)}` : ''}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Backend error' }));
      console.error('[Character Bank PUT] Backend error:', error);
      return NextResponse.json(
        error,
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Debug logging
    console.log('[Character Bank PUT API Route] Backend response:', {
      hasSuccess: !!data.success,
      hasCharacter: !!data.character,
      characterId: data.character?.id,
      responseKeys: Object.keys(data)
    });
    
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Character bank PUT API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

