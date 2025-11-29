/**
 * Asset Bank Asset ID API Route
 * 
 * Proxies requests to backend asset bank service for specific assets
 * Handles: GET (get asset), PUT (update asset), DELETE (delete asset)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

export async function GET(
  request: NextRequest,
  { params }: { params: { assetId: string } }
) {
  try {
    // Verify user is authenticated with Clerk and get backend token
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    const token = await getToken({ template: 'wryda-backend' });
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Could not generate token' },
        { status: 401 }
      );
    }

    const { assetId } = params;

    // Forward request to backend
    const url = `${BACKEND_API_URL}/api/asset-bank/${assetId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Backend error' }));
      console.error('[Asset Bank] Backend error:', error);
      return NextResponse.json(
        error,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[Asset Bank] API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { assetId: string } }
) {
  try {
    // Verify user is authenticated with Clerk and get backend token
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    const token = await getToken({ template: 'wryda-backend' });
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Could not generate token' },
        { status: 401 }
      );
    }

    const { assetId } = params;
    const body = await request.json();

    // Forward request to backend
    const url = `${BACKEND_API_URL}/api/asset-bank/${assetId}`;

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
      console.error('[Asset Bank] Backend error:', error);
      return NextResponse.json(
        error,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[Asset Bank] API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { assetId: string } }
) {
  try {
    // Verify user is authenticated with Clerk and get backend token
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    const token = await getToken({ template: 'wryda-backend' });
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Could not generate token' },
        { status: 401 }
      );
    }

    const { assetId } = params;

    // Forward request to backend
    const url = `${BACKEND_API_URL}/api/asset-bank/${assetId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Handle 204 No Content (successful delete)
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Backend error' }));
      console.error('[Asset Bank] Backend error:', error);
      return NextResponse.json(
        error,
        { status: response.status }
      );
    }

    // If response has content, return it
    const data = await response.json().catch(() => null);
    if (data) {
      return NextResponse.json(data);
    }
    
    return new NextResponse(null, { status: 204 });

  } catch (error: any) {
    console.error('[Asset Bank] API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

