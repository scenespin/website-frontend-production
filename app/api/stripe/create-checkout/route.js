import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// This function proxies to the backend API which handles Stripe checkout with DynamoDB
export async function POST(req) {
  const body = await req.json();

  if (!body.priceId) {
    return NextResponse.json(
      { error: "Price ID is required" },
      { status: 400 }
    );
  } else if (!body.successUrl || !body.cancelUrl) {
    return NextResponse.json(
      { error: "Success and cancel URLs are required" },
      { status: 400 }
    );
  } else if (!body.mode) {
    return NextResponse.json(
      {
        error:
          "Mode is required (either 'payment' for one-time payments or 'subscription' for recurring subscription)",
      },
      { status: 400 }
    );
  }

  try {
    // Get the token from the Authorization header that the client sent
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const { userId } = await auth();

    if (!userId || !token) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in" },
        { status: 401 }
      );
    }
    
    // Call backend API which uses DynamoDB
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3200';
    const response = await fetch(`${backendUrl}/api/stripe/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId,
        priceId: body.priceId,
        mode: body.mode,
        successUrl: body.successUrl,
        cancelUrl: body.cancelUrl
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Failed to create checkout session' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ url: data.url });

  } catch (e) {
    console.error('[Stripe Checkout] Error:', e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
