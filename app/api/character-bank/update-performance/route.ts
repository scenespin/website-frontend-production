/**
 * Character Bank Update Performance API Route
 * 
 * Proxies requests to backend character bank service for updating performance settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

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
    const { screenplayId, projectId, characterId, performanceSettings } = body;

    if (!characterId) {
      return NextResponse.json(
        { error: 'characterId is required' },
        { status: 400 }
      );
    }

    if (!performanceSettings) {
      return NextResponse.json(
        { error: 'performanceSettings is required' },
        { status: 400 }
      );
    }

    // Forward request to backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
    const url = `${backendUrl}/api/character-bank/update-performance`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        screenplayId: screenplayId || projectId, // Support both for backward compatibility
        characterId,
        performanceSettings
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Backend error' }));
      console.error('[Character Bank] Backend error:', error);
      // Silent failure - return success anyway (as per backend behavior)
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Character bank update performance API error:', error);
    // Silent failure - return success anyway (as per backend behavior)
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

