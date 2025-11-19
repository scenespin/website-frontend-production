import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

/**
 * PATCH /api/user/metadata
 * Update user's Clerk metadata (publicMetadata or unsafeMetadata)
 * 
 * Body: { publicMetadata?: Record<string, unknown>, unsafeMetadata?: Record<string, unknown> }
 */
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { publicMetadata, unsafeMetadata } = body;

    if (!publicMetadata && !unsafeMetadata) {
      return NextResponse.json(
        { error: 'Either publicMetadata or unsafeMetadata must be provided' },
        { status: 400 }
      );
    }

    // Get current user to preserve existing metadata
    const currentUser = await clerkClient.users.getUser(userId);
    
    // Merge with existing metadata
    const updatedPublicMetadata = publicMetadata
      ? { ...(currentUser.publicMetadata || {}), ...publicMetadata }
      : undefined;
    
    const updatedUnsafeMetadata = unsafeMetadata
      ? { ...(currentUser.unsafeMetadata || {}), ...unsafeMetadata }
      : undefined;

    // Update user metadata via Clerk Admin API
    await clerkClient.users.updateUser(userId, {
      publicMetadata: updatedPublicMetadata,
      unsafeMetadata: updatedUnsafeMetadata,
    });

    return NextResponse.json({
      success: true,
      message: 'Metadata updated successfully'
    });

  } catch (error: any) {
    console.error('[User Metadata API] Error updating metadata:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update metadata',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

