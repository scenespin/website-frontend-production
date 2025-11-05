import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const S3_BUCKET = process.env.S3_BUCKET || 'wryda-assets';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Initialize S3 client
const s3Client = new S3Client({ region: AWS_REGION });

/**
 * GET /api/video/upload/get-presigned-url
 * Generate pre-signed URL for direct S3 upload
 * 
 * Query params:
 * - fileName: Original file name
 * - fileType: MIME type (video/mp4, audio/mp3, image/png, etc.)
 * - fileSize: File size in bytes
 * - projectId: Project/timeline ID (optional)
 * 
 * Returns:
 * - uploadUrl: Pre-signed URL for direct S3 upload (PUT request)
 * - s3Key: S3 key where file will be stored
 * - expiresIn: URL expiration time (seconds)
 */
export async function GET(request: Request) {
  try {
    // Get Clerk auth and user ID
    const { getToken, userId: clerkUserId } = await auth();
    const token = await getToken();
    
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
    
    // Generate pre-signed URL for PUT operation (valid for 1 hour)
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      ContentType: fileType,
      Metadata: {
        userId: clerkUserId,
        projectId: projectId.toString(),
        uploadedAt: new Date().toISOString(),
        originalFileName: fileName,
        fileType: category
      }
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 3600 // 1 hour
    });
    
    console.log(`[VideoUpload] Generated pre-signed URL for user ${clerkUserId}: ${s3Key}`);
    
    // Return pre-signed URL and metadata
    return NextResponse.json({
      success: true,
      uploadUrl,
      s3Key,
      expiresIn: 3600,
      message: 'Pre-signed URL generated successfully'
    });
    
  } catch (error: any) {
    console.error('[VideoUpload] Error generating pre-signed URL:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: error.message 
    }, { status: 500 });
  }
}

