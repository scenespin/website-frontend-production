import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

// 🔥 FIX: Force dynamic rendering to prevent Vercel from caching 404s
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

/**
 * Catch-all API proxy route
 * Forwards all /api/[...path] requests to the backend
 * Preserves auth tokens, query params, and request bodies
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  const params = await props.params;
  return forwardRequest(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  const params = await props.params;
  return forwardRequest(request, params.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  const params = await props.params;
  return forwardRequest(request, params.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  const params = await props.params;
  return forwardRequest(request, params.path, 'DELETE');
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  const params = await props.params;
  return forwardRequest(request, params.path, 'PATCH');
}

async function forwardRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // Get authorization header from client request
    const authHeader = request.headers.get('authorization');
    
    // Build backend URL
    const path = pathSegments.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    const backendUrl = `${BACKEND_API_URL}/api/${path}${searchParams ? `?${searchParams}` : ''}`;
    
    // Special handling for /api/screenplays/list to debug routing
    if (path === 'screenplays/list') {
      console.error(`[API Proxy] 🔍 SPECIAL HANDLING for screenplays/list`);
      console.error(`[API Proxy] Path segments:`, pathSegments);
      console.error(`[API Proxy] Full path:`, path);
    }
    
    console.error(`[API Proxy] 🚀 ${method} ${path} -> ${backendUrl}`);
    
    // Get request body for POST/PUT/PATCH
    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      body = await request.text();
    }
    
    // Forward request to backend
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const response = await fetch(backendUrl, {
      method,
      headers,
      body,
    });
    
    // Get response data
    const contentType = response.headers.get('content-type');
    let data: any;
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Return response with cache-busting headers
    if (!response.ok) {
      console.error(`[API Proxy] Error ${response.status}:`, data);
    }
    
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
    
  } catch (error: any) {
    console.error('[API Proxy] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Proxy error' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  }
}

