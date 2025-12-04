import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { randomUUID } from 'crypto';

const S3_BUCKET = process.env.S3_BUCKET || 'screenplay-assets-043309365215';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

const s3Client = new S3Client({ region: AWS_REGION });

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const { userId: clerkUserId } = await auth();
    
    if (!token || !clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');
    const fileType = searchParams.get('fileType');
    const fileSize = searchParams.get('fileSize');
    const screenplayId = searchParams.get('screenplayId') || 'default';
    const locationId = searchParams.get('locationId');
    
    if (!fileName || !fileType || !locationId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: fileName, fileType, locationId' 
      }, { status: 400 });
    }

    const fileSizeNum = parseInt(fileSize || '0');
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for images
    
    if (fileSizeNum > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB. Your file: ${(fileSizeNum / (1024 * 1024)).toFixed(2)}MB` 
      }, { status: 413 });
    }

    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 50);
    const uuid = randomUUID().replace(/-/g, '').substring(0, 16);
    
    let s3Key = `temp/images/${clerkUserId}/${screenplayId}/locations/${locationId}/uploads/${timestamp}_${uuid}${sanitizedFileName.match(/\.[^.]+$/) || '.jpg'}`;
    
    if (s3Key.length > 1024) {
      const ext = sanitizedFileName.match(/\.[^.]+$/) || '.jpg';
      s3Key = `temp/images/${clerkUserId}/${screenplayId}/locations/${locationId}/${timestamp}_${uuid}${ext}`;
    }
    
    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: S3_BUCKET,
      Key: s3Key,
      Expires: 3600, // 1 hour
      Conditions: [
        ['content-length-range', 0, MAX_FILE_SIZE],
      ],
      Fields: {
        'Content-Type': fileType,
        'x-amz-meta-userid': clerkUserId,
        'x-amz-meta-screenplayid': screenplayId.toString(),
        'x-amz-meta-locationid': locationId.toString(),
        'x-amz-meta-uploadedat': new Date().toISOString(),
        'x-amz-meta-originalfilename': fileName,
        'x-amz-meta-filetype': 'image',
      },
    });
    
    console.log(`[LocationUpload] Generated pre-signed POST for user ${clerkUserId}: ${s3Key}`);
    
    return NextResponse.json({
      success: true,
      url,
      fields,
      s3Key,
      contentType: fileType,
      expiresIn: 3600,
      message: 'Pre-signed POST generated successfully'
    });
    
  } catch (error: any) {
    console.error('[LocationUpload] Error generating pre-signed URL:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: error.message 
    }, { status: 500 });
  }
}

