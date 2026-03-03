import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  const params = await props.params;
  return forward(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  const params = await props.params;
  return forward(request, params.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  const params = await props.params;
  return forward(request, params.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  const params = await props.params;
  return forward(request, params.path, 'DELETE');
}

async function forward(request: NextRequest, pathSegments: string[], method: string) {
  try {
    let authHeader = request.headers.get('authorization');
    if (!authHeader) {
      const { getToken } = await auth();
      if (getToken) {
        const token = await getToken({ template: 'wryda-backend' });
        if (token) authHeader = `Bearer ${token}`;
      }
    }

    const path = pathSegments.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    const backendUrl = `${BACKEND_API_URL}/api/s3/${path}${searchParams ? `?${searchParams}` : ''}`;

    const contentType = request.headers.get('content-type') || '';
    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      body = await request.text();
    }

    const headers: Record<string, string> = {
      'Content-Type': contentType || 'application/json',
    };
    if (authHeader) headers['Authorization'] = authHeader;

    const response = await fetch(backendUrl, {
      method,
      headers,
      body,
      cache: 'no-store',
      redirect: 'manual',
    });

    const responseContentType = response.headers.get('content-type') || '';
    const data = responseContentType.includes('application/json')
      ? await response.json()
      : await response.text();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Proxy error' }, { status: 500 });
  }
}
