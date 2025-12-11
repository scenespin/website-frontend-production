/**
 * Location Bank Generate Angles API Route
 * 
 * Proxies requests to backend location bank service for generating angle variations
 * Feature 0142: Location Bank Unification
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Ensure this route is dynamic and not cached
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
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
    // This matches the pattern used in character-bank/list route
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
    const { locationProfile, packageId, angles, quality, providerId } = body; // 🔥 FIX: Include providerId

    if (!locationProfile) {
      return NextResponse.json(
        { error: 'locationProfile is required' },
        { status: 400 }
      );
    }

    // Forward request to backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
    const url = `${backendUrl}/api/location-bank/generate-angles`;

    console.log('[Location Bank Generate Angles] Forwarding to backend:', { 
      url, 
      hasLocationProfile: !!locationProfile,
      packageId,
      quality,
      providerId, // 🔥 FIX: Log providerId
      anglesCount: angles?.length || 0
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        locationProfile,
        packageId, // NEW: Forward packageId
        angles, // Keep for backward compatibility
        quality, // NEW: Forward quality tier
        providerId // 🔥 FIX: Forward providerId to backend
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: response.status === 404 
          ? 'Backend route not found. Please ensure the backend is deployed with the latest changes.'
          : 'Backend error'
      }));
      console.error('[Location Bank] Backend error:', {
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
    console.error('Location bank generate angles API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

