import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ deckId: string }> }
) {
  const { deckId } = await props.params;

  try {
    const { getToken } = await auth();
    const token = await getToken({ template: 'wryda-backend' });
    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const bodyText = await request.text();
    const backendResponse = await fetch(`${BACKEND_API_URL}/api/pitch-decks/${encodeURIComponent(deckId)}/export/pdf`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': request.headers.get('content-type') || 'application/json',
      },
      body: bodyText || '{}',
      cache: 'no-store',
    });

    if (!backendResponse.ok) {
      const payload = await backendResponse.json().catch(() => ({
        success: false,
        error: { message: 'Failed to export pitch deck PDF' },
      }));
      return NextResponse.json(payload, { status: backendResponse.status });
    }

    const pdfBytes = await backendResponse.arrayBuffer();
    const contentDisposition =
      backendResponse.headers.get('content-disposition') || 'attachment; filename="pitch-deck.pdf"';
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: { message: error?.message || 'Failed to export pitch deck PDF' },
      },
      { status: 500 }
    );
  }
}

