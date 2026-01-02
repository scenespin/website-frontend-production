import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define public routes that don't require authentication
// Pattern format: '/path' or '/path(.*)' for path and all sub-paths
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/features(.*)',              // Features page (marketing)
  '/compare(.*)',                // Compare page (marketing)
  '/pricing(.*)',                // Pricing page (marketing)
  '/help(.*)',                   // Help center and all help pages (marketing/documentation)
  '/api/gallery(.*)',           // Feature 0112: Workflow gallery
  '/api/waitlist(.*)',           // Waitlist signup
  '/api/affiliates(.*)',         // Affiliate tracking  
  '/api/analytics(.*)',          // Analytics events
  '/api/auth(.*)',               // All OAuth routes (GitHub, Google, Dropbox)
])

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

