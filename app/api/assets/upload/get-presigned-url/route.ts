import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Prevent stale presign responses from being cached by edge/browser layers.
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const { userId } = await auth();
    
    if (!token || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');
    const fileType = searchParams.get('fileType');
    const fileSize = searchParams.get('fileSize');
    const assetId = searchParams.get('assetId');
    
    if (!fileName || !fileType || !assetId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: fileName, fileType, assetId' 
      }, { status: 400 });
    }

    const fileSizeNum = parseInt(fileSize || '0');
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for images
    
    if (fileSizeNum > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB. Your file: ${(fileSizeNum / (1024 * 1024)).toFixed(2)}MB` 
      }, { status: 413 });
    }

    const uploadUrl = `${BACKEND_API_URL}/api/s3/upload-url?` +
      `fileName=${encodeURIComponent(fileName)}` +
      `&entityType=asset` +
      `&entityId=${encodeURIComponent(assetId)}` +
      `&contentType=${encodeURIComponent(fileType)}`;

    const backendResponse = await fetch(uploadUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    const responsePayload = await backendResponse.json().catch(() => null);
    if (!backendResponse.ok || !responsePayload) {
      return NextResponse.json(
        responsePayload || { error: 'Failed to get upload URL' },
        { status: backendResponse.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ...responsePayload,
      contentType: fileType,
      expiresIn: 3600,
      message: 'Pre-signed POST generated successfully'
    });
    
  } catch (error: any) {
    console.error('[AssetUpload] Error generating pre-signed URL:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: error.message 
    }, { status: 500 });
  }
}

