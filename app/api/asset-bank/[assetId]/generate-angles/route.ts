/**
 * Asset Bank Generate Angles API Route
 * 
 * Proxies requests to backend asset bank service for generating angle variations
 * Similar to location-bank/generate-angles route
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Ensure this route is dynamic and not cached
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    // Get the token from the Authorization header that the client sent
    const authHeader = request.headers.get('authorization');
    const clientToken = authHeader?.replace('Bearer ', '');
    
    // Verify user is authenticated with Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Use the token from the client if available, otherwise get a new one
    let token = clientToken;
    if (!token) {
      const { getToken } = await auth();
      token = await getToken({ template: 'wryda-backend' });
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Failed to get backend token' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { packageId, quality } = body;

    if (!packageId) {
      return NextResponse.json(
        { error: 'packageId is required (basic, standard, or premium)' },
        { status: 400 }
      );
    }

    if (!['basic', 'standard', 'premium'].includes(packageId)) {
      return NextResponse.json(
        { error: 'packageId must be one of: basic, standard, premium' },
        { status: 400 }
      );
    }

    // Next.js 15: params is now a Promise
    const { assetId } = await params;

    // Forward request to backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
    const url = `${backendUrl}/api/asset-bank/${assetId}/generate-angles`;

    console.log('[Asset Bank Generate Angles] Forwarding to backend:', { 
      url, 
      assetId,
      packageId,
      quality
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        packageId,
        quality: quality || 'standard'
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: response.status === 404 
          ? 'Backend route not found. Please ensure the backend is deployed with the latest changes.'
          : 'Backend error'
      }));
      console.error('[Asset Bank Generate Angles] Backend error:', {
        status: response.status,
        error,
        url
      });
      return NextResponse.json(
        error,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Asset bank generate angles API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

