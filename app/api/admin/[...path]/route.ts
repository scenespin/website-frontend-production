import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

async function proxyToBackend(request: NextRequest, path: string[], method: string) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
  const query = request.nextUrl.search || '';
  const url = `${backendUrl}/api/admin/${path.join('/')}${query}`;
  const contentType = request.headers.get('content-type') || 'application/json';
  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.text();

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': contentType,
    },
    body,
  });

  const text = await response.text();
  const maybeJson = (() => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  })();

  if (maybeJson !== null) {
    return NextResponse.json(maybeJson, { status: response.status });
  }

  return new NextResponse(text, {
    status: response.status,
    headers: { 'Content-Type': response.headers.get('content-type') || 'text/plain' },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    return proxyToBackend(request, path, 'GET');
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    return proxyToBackend(request, path, 'POST');
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    return proxyToBackend(request, path, 'PUT');
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    return proxyToBackend(request, path, 'PATCH');
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    return proxyToBackend(request, path, 'DELETE');
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
