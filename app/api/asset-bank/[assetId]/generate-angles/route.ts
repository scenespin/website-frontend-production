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

    // Get request body (Feature 0226: include packageType, projectId, screenplayId for vehicle-interior)
    const body = await request.json();
    const { packageId, packageType, selectedAngle, quality, providerId, additionalPrompt, projectId, screenplayId } = body;

    if (!packageId) {
      return NextResponse.json(
        { error: 'packageId is required' },
        { status: 400 }
      );
    }

    const isVehicleInterior = packageType === 'vehicle-interior';

    if (isVehicleInterior) {
      // Backend is source of truth for valid vehicle-interior packageIds; only require non-empty string here
      if (typeof packageId !== 'string' || !packageId.trim()) {
        return NextResponse.json(
          { error: 'packageId is required when packageType is vehicle-interior' },
          { status: 400 }
        );
      }
    } else {
      if (!['single', 'basic', 'standard', 'premium'].includes(packageId)) {
        return NextResponse.json(
          { error: 'packageId must be one of: single, basic, standard, premium' },
          { status: 400 }
        );
      }
      if (packageId === 'single' && !selectedAngle) {
        return NextResponse.json(
          { error: 'selectedAngle is required when packageId is "single"' },
          { status: 400 }
        );
      }
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
      packageType: packageType || 'standard',
      selectedAngle,
      quality,
      providerId,
    });

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const requestBody: any = {
      packageId,
      quality: quality || 'standard',
      providerId,
      additionalPrompt,
      projectId: projectId || screenplayId,
      screenplayId: screenplayId || projectId,
    };
    if (isVehicleInterior) {
      requestBody.packageType = 'vehicle-interior';
    }
    if (selectedAngle) {
      requestBody.selectedAngle = selectedAngle;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
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

