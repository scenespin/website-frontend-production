/**
 * Billing Checkout API Route
 * 
 * Proxies requests to backend billing service for subscription checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[Billing Checkout] Starting request...');
    
    // Get the token from the Authorization header that the client sent
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    console.log('[Billing Checkout] Auth header:', authHeader ? 'Present' : 'Missing');
    console.log('[Billing Checkout] Token extracted:', token ? `Present (${token.length} chars)` : 'Missing');
    
    if (!token) {
      console.error('[Billing Checkout] ❌ No token in Authorization header');
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }
    
    // Verify user is authenticated with Clerk
    const { userId } = await auth();
    console.log('[Billing Checkout] Clerk userId:', userId);
    
    if (!userId) {
      console.error('[Billing Checkout] ❌ No userId - user not authenticated');
      return NextResponse.json(
        { error: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }
    
    console.log('[Billing Checkout] User authenticated:', userId);

    // Get request body
    const body = await request.json();
    console.log('[Billing Checkout] Request body:', {
      planName: body.planName,
      hasSuccessUrl: !!body.successUrl,
      hasCancelUrl: !!body.cancelUrl
    });

    // Validate required fields
    if (!body.planName || !body.successUrl || !body.cancelUrl) {
      console.error('[Billing Checkout] ❌ Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: planName, successUrl, cancelUrl' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.wryda.ai';
    const url = `${backendUrl}/api/billing/checkout`;

    console.log('[Billing Checkout] Proxying to backend:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('[Billing Checkout] Backend response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: `HTTP ${response.status}: ${response.statusText}` 
      }));
      console.error('[Billing Checkout] ❌ Backend error:', response.status, errorData);
      return NextResponse.json(
        { error: errorData.error || errorData.message || 'Backend request failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Billing Checkout] ✅ Successfully created checkout session');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Billing Checkout] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
