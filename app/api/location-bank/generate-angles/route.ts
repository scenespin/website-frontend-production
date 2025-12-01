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
    // Verify user is authenticated with Clerk
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Get Clerk token for backend API
    const token = await getToken({ template: 'wryda-backend' });
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Failed to get backend token' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { locationProfile, angles } = body;

    if (!locationProfile) {
      return NextResponse.json(
        { error: 'locationProfile is required' },
        { status: 400 }
      );
    }

    if (!angles || !Array.isArray(angles)) {
      return NextResponse.json(
        { error: 'angles array is required' },
        { status: 400 }
      );
    }

    // Forward request to backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
    const url = `${backendUrl}/api/location-bank/generate-angles`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        locationProfile,
        angles
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

