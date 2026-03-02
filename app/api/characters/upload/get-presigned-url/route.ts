import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Prevent stale presign responses from being cached by edge/browser layers.
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

/**
 * GET /api/characters/upload/get-presigned-url
 * Generate pre-signed POST for direct S3 upload of character images
 * 
 * Bypasses Vercel's 4.5MB body size limit by uploading directly to S3
 * 
 * Query params:
 * - fileName: Original file name
 * - fileType: MIME type (image/jpeg, image/png, etc.)
 * - fileSize: File size in bytes
 * - screenplayId: Screenplay/project ID (required)
 * - characterId: Character ID (required)
 * 
 * Returns:
 * - url: Pre-signed POST URL
 * - fields: Form fields to include in POST request
 * - s3Key: S3 key where file will be stored
 * - expiresIn: URL expiration time (seconds)
 */
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
    const screenplayId = searchParams.get('screenplayId');
    const characterId = searchParams.get('characterId');
    
    if (!fileName || !fileType || !characterId || !screenplayId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: fileName, fileType, screenplayId, characterId' 
      }, { status: 400 });
    }

    const fileSizeNum = parseInt(fileSize || '0');
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    
    if (fileSizeNum > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is 50MB. Your file: ${(fileSizeNum / 1024 / 1024).toFixed(2)}MB` 
      }, { status: 413 });
    }

    // Validate file type
    if (!fileType.startsWith('image/')) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only image files are allowed.' 
      }, { status: 400 });
    }

    const uploadUrl = `${BACKEND_API_URL}/api/s3/upload-url?` +
      `fileName=${encodeURIComponent(fileName)}` +
      `&entityType=character` +
      `&entityId=${encodeURIComponent(characterId)}` +
      `&screenplayId=${encodeURIComponent(screenplayId)}` +
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
      message: 'Pre-signed POST generated successfully',
    });
    
  } catch (error: any) {
    console.error('[CharacterUpload] Error generating pre-signed URL:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: error.message 
    }, { status: 500 });
  }
}

