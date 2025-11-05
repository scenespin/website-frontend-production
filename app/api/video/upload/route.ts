import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
const S3_BUCKET = process.env.S3_BUCKET || 'wryda-assets';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Initialize S3 client
const s3Client = new S3Client({ region: AWS_REGION });

// Configure API route to accept larger payloads (100MB for video uploads)
// In Next.js 13+ App Router, we need to set maxDuration and handle the body parser differently
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes timeout

export async function POST(request: Request) {
  try {
    // Get Clerk auth and user ID
    const { getToken, userId: clerkUserId } = await auth();
    const token = await getToken();
    
    if (!token || !clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the form data from the request
    const formData = await request.formData();
    
    const file = formData.get('video') || formData.get('audio') || formData.get('image');
    const projectId = formData.get('projectId') || 'default';
    
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Determine file type
    const fileType = file.type.startsWith('video/') ? 'video' : 
                     file.type.startsWith('audio/') ? 'audio' : 'image';
    
    // Generate S3 key
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `timeline/${clerkUserId}/${projectId}/${fileType}/${timestamp}_${sanitizedFileName}`;
    
    // Upload directly to S3
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    await s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: file.type,
      Metadata: {
        userId: clerkUserId,
        projectId: projectId.toString(),
        uploadedAt: new Date().toISOString(),
        originalFileName: file.name,
        fileType: fileType
      }
    }));

    // Generate the S3 URL
    const s3Url = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
    
    console.log(`[VideoUpload] Uploaded ${fileType} to S3:`, s3Key);
    
    // Return success with S3 URL and key
    return NextResponse.json({
      success: true,
      url: s3Url,
      s3Key: s3Key,
      type: fileType,
      message: 'File uploaded successfully'
    });
  } catch (error: any) {
    console.error('[VideoUpload] Error uploading file:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: error.message 
    }, { status: 500 });
  }
}

