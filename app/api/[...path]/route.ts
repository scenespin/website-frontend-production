import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

// 🔥 FIX: Force dynamic rendering to prevent Vercel from caching 404s
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
// 🔥 FIX: Increase max duration for large file uploads (Vercel default is 10s, max is 300s for Pro)
export const maxDuration = 60; // 60 seconds for image uploads

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
    
    // 🔥 DEBUG: Log batch-update-props requests (server-side logs go to Vercel/terminal)
    if (path.includes('batch-update-props')) {
      console.error(`[API Proxy] 🔍 BATCH-UPDATE-PROPS REQUEST DETECTED`);
      console.error(`[API Proxy] Full path:`, path);
      console.error(`[API Proxy] Path segments:`, JSON.stringify(pathSegments));
      console.error(`[API Proxy] Method:`, method);
      console.error(`[API Proxy] Backend URL:`, backendUrl);
      console.error(`[API Proxy] Auth header present:`, !!authHeader);
      console.error(`[API Proxy] Request URL:`, request.url);
    }
    
    console.error(`[API Proxy] 🚀 ${method} ${path} -> ${backendUrl}`);
    
    // 🔥 DEBUG: Log ALL headers for ALL requests to diagnose header transmission
    // This is critical for debugging why axios headers aren't reaching the backend
    const allHeadersArray: Array<[string, string]> = [];
    request.headers.forEach((value, name) => {
      allHeadersArray.push([name, value]);
    });
    
    // Always log for axios requests (credits, screenplays/list, etc.)
    const isAxiosRequest = path.includes('credits') || 
                          (path === 'screenplays/list') || 
                          path.includes('video/jobs');
    
    if (isAxiosRequest || allHeadersArray.length < 10) { // Log for axios requests or if few headers (debugging)
      console.error(`[API Proxy] 🔍 ALL HEADERS for ${method} ${path}:`, {
        totalHeaders: allHeadersArray.length,
        headers: allHeadersArray.map(([name, value]) => ({
          name,
          value: value.length > 50 ? value.substring(0, 50) + '...' : value,
          lowerName: name.toLowerCase()
        })),
        hasSessionHeader: allHeadersArray.some(([name]) => {
          const lower = name.toLowerCase();
          return lower.includes('session') || (lower.includes('sid') && allHeadersArray.find(([n]) => n.toLowerCase() === lower)?.[1]?.startsWith('sess_'));
        }),
        sessionHeaders: allHeadersArray.filter(([name]) => {
          const lower = name.toLowerCase();
          return lower.includes('session') || lower.includes('sid');
        }).map(([name, value]) => ({ name, value: value.substring(0, 30) + '...' }))
      });
    }
    
    // 🔥 FIX: Preserve Content-Type header and handle multipart/form-data correctly
    const contentType = request.headers.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');
    
    // Get request body for POST/PUT/PATCH
    let body: string | FormData | ArrayBuffer | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      if (isMultipart) {
        // For multipart requests, preserve FormData to maintain binary data
        body = await request.formData();
        console.error(`[API Proxy] 📦 Multipart request detected - preserving FormData`);
      } else {
        // For JSON/text requests, read as text
        body = await request.text();
      }
    }
    
    // Forward request to backend
    const headers: Record<string, string> = {};
    
    // 🔥 FIX: For FormData, DON'T set Content-Type - fetch() will set it automatically with correct boundary
    // Setting it manually will break the multipart boundary
    if (isMultipart) {
      // For multipart, let fetch() set Content-Type automatically
      console.error(`[API Proxy] 📦 Multipart request - letting fetch() set Content-Type with boundary`);
    } else if (contentType) {
      // For non-multipart, preserve original Content-Type
      headers['Content-Type'] = contentType;
    } else {
      // Default to JSON if no Content-Type provided
      headers['Content-Type'] = 'application/json';
    }
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    // 🔥 CRITICAL: Forward X-Session-Id header for single-device login
    // Next.js API routes need to explicitly forward headers from client requests
    // Axios may send headers with different casing, so we need to check all variations
    // Iterate through all headers to find session ID (case-insensitive search)
    let sessionIdHeader = null;
    let sessionIdHeaderName = null;
    
    // First, try common variations
    const commonVariations = ['x-session-id', 'X-Session-Id', 'x-sessionid', 'X-SessionID'];
    for (const headerName of commonVariations) {
      const value = request.headers.get(headerName);
      if (value) {
        sessionIdHeader = value;
        sessionIdHeaderName = headerName;
        break;
      }
    }
    
    // If not found, iterate through ALL headers to find any that match "session" or "sid"
    // Next.js headers might be stored in a Headers object, so we need to iterate properly
    if (!sessionIdHeader) {
      // Try iterating through headers using forEach (Headers API method)
      request.headers.forEach((value, name) => {
        const lowerName = name.toLowerCase();
        if ((lowerName.includes('session') && lowerName.includes('id')) || 
            lowerName === 'x-session-id' ||
            (lowerName.includes('sid') && value && value.startsWith('sess_'))) {
          if (!sessionIdHeader) { // Only set first match
            sessionIdHeader = value;
            sessionIdHeaderName = name;
            console.error(`[API Proxy] 🔍 Found session ID header via iteration: ${name} = ${value.substring(0, 20)}...`);
          }
        }
      });
    }
    
    if (sessionIdHeader) {
      headers['X-Session-Id'] = sessionIdHeader;
      console.error(`[API Proxy] ✅ Forwarding X-Session-Id header: ${sessionIdHeader.substring(0, 20)}...`, {
        path,
        method,
        headerLength: sessionIdHeader.length,
        originalHeaderName: sessionIdHeaderName,
        foundVia: sessionIdHeaderName ? 'direct' : 'iteration'
      });
    } else {
      // 🔥 DEBUG: Log all headers to see what's actually being sent
      // This helps identify if axios is sending the header with a different name
      const allHeaders = Object.fromEntries(request.headers.entries());
      const headerKeys = Object.keys(allHeaders);
      const sessionRelatedHeaders = headerKeys.filter(h => {
        const lower = h.toLowerCase();
        return lower.includes('session') || lower.includes('sid');
      });
      
      // Log first few header values for debugging (but truncate long values)
      const headerPreview = Object.fromEntries(
        headerKeys.slice(0, 10).map(key => [
          key, 
          allHeaders[key]?.length > 50 ? allHeaders[key].substring(0, 50) + '...' : allHeaders[key]
        ])
      );
      
      console.error(`[API Proxy] ⚠️ No X-Session-Id header in request - session validation may fail`, {
        path,
        method,
        sessionRelatedHeaders: sessionRelatedHeaders.length > 0 ? sessionRelatedHeaders.join(', ') : 'none',
        allHeaderKeys: headerKeys.slice(0, 20).join(', '), // First 20 headers to avoid log spam
        totalHeaders: headerKeys.length,
        headerPreview: JSON.stringify(headerPreview)
      });
    }
    
    console.error(`[API Proxy] 📤 Forwarding with Content-Type: ${isMultipart ? 'auto (multipart)' : (headers['Content-Type'] || 'none')}`);
    
    const response = await fetch(backendUrl, {
      method,
      headers,
      body: body as any, // TypeScript workaround for FormData
    });
    
    // Get response data
    const responseContentType = response.headers.get('content-type');
    let data: any;
    
    if (responseContentType?.includes('application/json')) {
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

