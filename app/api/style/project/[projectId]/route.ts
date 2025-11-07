import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/style/project/[projectId]
 * 
 * Get all style profiles for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing authorization token' },
        { status: 401 }
      );
    }

    const { projectId } = params;

    // Forward to backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
    const response = await fetch(`${backendUrl}/api/style/project/${projectId}`, {
      headers: {
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Style Project API] Backend error:', response.status, errorData);
      
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
    console.error('[Style Project API] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

