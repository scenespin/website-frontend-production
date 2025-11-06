import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define which routes are public (don't require authentication)
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/features(.*)',
  '/pricing(.*)',
  '/blog(.*)',
  '/social-creators(.*)',
  '/screenwriters(.*)',
  '/filmmakers(.*)',
  '/agencies(.*)',
  '/marketing-teams(.*)',
])

// Clerk middleware with explicit route protection
// This ensures auth() works correctly in API routes
export default clerkMiddleware(async (auth, req) => {
  // Protect all routes except public ones
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}

