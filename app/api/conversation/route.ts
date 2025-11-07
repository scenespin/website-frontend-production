import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/conversation
 * 
 * Proxies conversation requests to the backend ConversationalAIEngine
 */
export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { sessionId, context, message, choice, files } = body;

    // Validate required fields
    if (!context) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Missing required field: context' },
        { status: 400 }
      );
    }

    // Forward to backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
    const response = await fetch(`${backendUrl}/api/conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        sessionId,
        context,
        message,
        choice,
        files,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Conversation API] Backend error:', response.status, errorData);
      
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
    console.error('[Conversation API] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

