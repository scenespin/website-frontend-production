/**
 * Next.js API Route: Delete Active Session
 * 
 * Proxies to backend API for single-device login session management.
 * Called automatically when user signs out.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';

export async function DELETE(request: NextRequest) {
  try {
    const { getToken } = await auth();
    const token = await getToken({ template: 'wryda-backend' });
    
    if (!token) {
      // If no token, session is already invalid - return success
      return NextResponse.json({ success: true, message: 'Session already cleared' });
    }

    // Proxy to backend API
    const response = await fetch(`${BACKEND_URL}/api/sessions/logout`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[Sessions API] Failed to logout session:', error);
    // Don't fail logout if session deletion fails
    return NextResponse.json({ success: true, message: 'Logged out (session cleanup may have failed)' });
  }
}
