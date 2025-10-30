import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define public routes that should always be accessible (including Clerk's internal routes)
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhook(.*)',
  '/pricing(.*)',
  '/features(.*)',
  '/blog(.*)',
  '/tos(.*)',
  '/privacy-policy(.*)',
])

// Define protected routes
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/protected(.*)',
])

// Define admin routes (frontend pages)
const isAdminRoute = createRouteMatcher([
  '/dashboard/admin(.*)',
  '/admin(.*)',
])

// Define admin API routes
const isAdminAPIRoute = createRouteMatcher([
  '/api/admin(.*)',
])

// Define voice cloning API routes (for rate limiting)
const isVoiceConsentRoute = createRouteMatcher([
  '/api/voice-cloning/consent',
  '/api/voice-cloning/revoke',
])

// Simple in-memory rate limiter
// In production, use Redis or Upstash for distributed rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    // New window or expired
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
    // Rate limit exceeded
    return false;
  }
  
  // Increment count
  record.count++;
  return true;
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  rateLimitMap.forEach((record, key) => {
    if (now > record.resetTime) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => rateLimitMap.delete(key));
}, 60000); // Cleanup every minute

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes to pass through without auth checks
  // This is critical for Safari mobile to prevent redirect loops during email verification
  if (isPublicRoute(req)) {
    // Still apply rate limiting to voice consent routes even if public
    if (isVoiceConsentRoute(req)) {
      const { userId } = await auth();
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      const identifier = userId || ip;
      
      // Allow 10 requests per minute
      const allowed = checkRateLimit(`consent:${identifier}`, 10, 60000);
      
      if (!allowed) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a minute.' },
          { status: 429 }
        );
      }
    }
    return NextResponse.next()
  }
  
  // Protect dashboard routes
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
  
  // Protect admin routes and check for admin role
  if (isAdminRoute(req) || isAdminAPIRoute(req)) {
    await auth.protect((has) => {
      return has({ role: 'admin' })
    })
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}

