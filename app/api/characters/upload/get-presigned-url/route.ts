import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { randomUUID } from 'crypto';

const S3_BUCKET = process.env.S3_BUCKET || 'screenplay-assets-043309365215';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Initialize S3 client
const s3Client = new S3Client({ region: AWS_REGION });

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
    // Get the token from the Authorization header that the client sent
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    // Get Clerk auth and user ID
    const { userId: clerkUserId } = await auth();
    
    if (!token || !clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');
    const fileType = searchParams.get('fileType');
    const fileSize = searchParams.get('fileSize');
    const screenplayId = searchParams.get('screenplayId');
    const characterId = searchParams.get('characterId');
    
    if (!fileName || !fileType || !screenplayId || !characterId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: fileName, fileType, screenplayId, characterId' 
      }, { status: 400 });
    }

    // Validate file size (50MB limit for character images)
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

    // Generate S3 key matching the backend pattern
    // Format: temp/images/{userId}/{screenplayId}/characters/{characterId}/{timestamp}.jpg
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 50);
    const ext = sanitizedFileName.match(/\.[^.]+$/) || '.jpg';
    const uuid = randomUUID().replace(/-/g, '').substring(0, 16);
    
    const s3Key = `temp/images/${clerkUserId}/${screenplayId}/characters/${characterId}/${timestamp}_${uuid}${ext}`;
    
    // Validate s3Key length (S3 max is 1024 bytes)
    if (s3Key.length > 1024) {
      // If still too long, use shorter path
      const shortS3Key = `temp/images/${clerkUserId}/${screenplayId}/characters/${characterId}/${timestamp}_${uuid}${ext}`;
      if (shortS3Key.length > 1024) {
        return NextResponse.json({ 
          error: 'Generated S3 key is too long. Please use a shorter filename.' 
        }, { status: 400 });
      }
    }
    
    // Generate pre-signed POST (browser-friendly, handles Content-Type as form data)
    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: S3_BUCKET,
      Key: s3Key,
      Expires: 3600, // 1 hour
      Conditions: [
        // Restrict file size (0 to 50MB)
        ['content-length-range', 0, 50 * 1024 * 1024],
      ],
      Fields: {
        'Content-Type': fileType,
        // Add metadata as form fields (S3 will store these)
        'x-amz-meta-userid': clerkUserId,
        'x-amz-meta-screenplayid': screenplayId,
        'x-amz-meta-characterid': characterId,
        'x-amz-meta-uploadedat': new Date().toISOString(),
        'x-amz-meta-originalfilename': fileName,
      },
    });
    
    console.log(`[CharacterUpload] Generated pre-signed POST for user ${clerkUserId}, character ${characterId}: ${s3Key}`);
    
    // Return pre-signed POST URL and form fields
    return NextResponse.json({
      success: true,
      url, // POST URL
      fields, // Form fields to include in POST request
      s3Key,
      contentType: fileType,
      expiresIn: 3600,
      message: 'Pre-signed POST generated successfully'
    });
    
  } catch (error: any) {
    console.error('[CharacterUpload] Error generating pre-signed URL:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: error.message 
    }, { status: 500 });
  }
}

