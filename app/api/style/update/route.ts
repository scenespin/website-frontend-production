import { NextRequest, NextResponse } from 'next/server';

/**
 * PUT /api/style/update
 * 
 * Proxies style profile update requests to the backend
 */
export async function PUT(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing authorization token' },
        { status: 401 }
      );
    }

    // Parse request body
    const profile = await request.json();

    if (!profile.profileId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Missing required field: profileId' },
        { status: 400 }
      );
    }

    // Forward to backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
    const response = await fetch(`${backendUrl}/api/style/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(profile),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Style Update API] Backend error:', response.status, errorData);
      
      return NextResponse.json(
        {
          error: 'Backend Error',
          message: errorData.message || `Backend returned ${response.status}`,
          details: errorData,
        },
        { status: response.status }
      );
    }

    // Return backend response
    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('[Style Update API] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

