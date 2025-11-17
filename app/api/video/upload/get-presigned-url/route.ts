import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';

const S3_BUCKET = process.env.S3_BUCKET || 'screenplay-assets-043309365215';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Initialize S3 client
const s3Client = new S3Client({ region: AWS_REGION });

/**
 * GET /api/video/upload/get-presigned-url
 * Generate pre-signed POST for direct S3 upload (browser-friendly)
 * 
 * Uses createPresignedPost instead of getSignedUrl to avoid Content-Type header issues.
 * This is the recommended approach for browser uploads as it handles Content-Type
 * as form data rather than headers, preventing 403 Forbidden errors.
 * 
 * Query params:
 * - fileName: Original file name
 * - fileType: MIME type (video/mp4, audio/mp3, image/png, etc.)
 * - fileSize: File size in bytes
 * - projectId: Project/timeline ID (optional)
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
    const projectId = searchParams.get('projectId') || 'default';
    
    if (!fileName || !fileType) {
      return NextResponse.json({ 
        error: 'Missing required parameters: fileName, fileType' 
      }, { status: 400 });
    }

    // Validate file size (optional - add limits per user tier)
    const fileSizeNum = parseInt(fileSize || '0');
    const MAX_FILE_SIZE = 50 * 1024 * 1024 * 1024; // 50GB hard limit
    
    if (fileSizeNum > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is 50GB. Your file: ${(fileSizeNum / 1024 / 1024 / 1024).toFixed(2)}GB` 
      }, { status: 413 });
    }

    // Determine file category
    const category = fileType.startsWith('video/') ? 'video' : 
                     fileType.startsWith('audio/') ? 'audio' : 'image';
    
    // Generate S3 key
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `timeline/${clerkUserId}/${projectId}/${category}/${timestamp}_${sanitizedFileName}`;
    
    // Generate pre-signed POST (browser-friendly, handles Content-Type as form data)
    // This avoids the Content-Type header signing issues with getSignedUrl
    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: S3_BUCKET,
      Key: s3Key,
      Expires: 3600, // 1 hour
      Conditions: [
        // Restrict file size (0 to 50GB)
        ['content-length-range', 0, 50 * 1024 * 1024 * 1024],
        // Note: We don't restrict Content-Type in conditions because browsers may modify it
        // The Content-Type in Fields will be used, but we allow flexibility
      ],
      Fields: {
        'Content-Type': fileType,
        // Add metadata as form fields (S3 will store these)
        'x-amz-meta-userid': clerkUserId,
        'x-amz-meta-projectid': projectId.toString(),
        'x-amz-meta-uploadedat': new Date().toISOString(),
        'x-amz-meta-originalfilename': fileName,
        'x-amz-meta-filetype': category,
      },
    });
    
    console.log(`[VideoUpload] Generated pre-signed POST for user ${clerkUserId}: ${s3Key}`);
    console.log(`[VideoUpload] ContentType: ${fileType}, FileSize: ${fileSizeNum} bytes`);
    
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
    console.error('[VideoUpload] Error generating pre-signed URL:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: error.message 
    }, { status: 500 });
  }
}

