/**
 * Assets API Route
 * 
 * Handles fetching assets by IDs
 * GET /api/assets?ids=asset1,asset2,asset3
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    let token = authHeader?.replace('Bearer ', '');
    
    // If no token in header, try to generate one server-side
    if (!token) {
      try {
        const { getToken } = await auth();
        token = await getToken({ template: 'wryda-backend' });
      } catch (tokenError: any) {
        console.error('[Assets API] getToken() failed:', tokenError.message);
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Could not get authentication token' },
        { status: 401 }
      );
    }

    // Get IDs from query parameter
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    
    if (!idsParam) {
      return NextResponse.json(
        { error: 'Missing required parameter: ids' },
        { status: 400 }
      );
    }

    // Parse comma-separated IDs
    const assetIds = idsParam.split(',').map(id => id.trim()).filter(Boolean);
    
    if (assetIds.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch each asset individually (since backend doesn't have bulk fetch)
    // Handle 404s gracefully - some assets might not exist
    const assetPromises = assetIds.map(async (assetId) => {
      try {
        const response = await fetch(`${BACKEND_API_URL}/api/asset-bank/${assetId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.warn(`[Assets API] Asset not found: ${assetId}`);
            return null; // Asset doesn't exist, skip it
          }
          throw new Error(`Failed to fetch asset ${assetId}: ${response.statusText}`);
        }

        const data = await response.json();
        return data.asset || data; // Backend might return { asset: {...} } or just the asset
      } catch (error: any) {
        console.error(`[Assets API] Error fetching asset ${assetId}:`, error.message);
        return null; // Skip failed assets
      }
    });

    // Wait for all requests and filter out nulls (missing assets)
    const assets = (await Promise.all(assetPromises)).filter((asset): asset is any => asset !== null);

    // Return as array (matching expected format)
    return NextResponse.json(assets);

  } catch (error: any) {
    console.error('[Assets API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

