import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/gallery(.*)',           // Feature 0112: Workflow gallery
  '/api/waitlist(.*)',           // Waitlist signup
  '/api/affiliates(.*)',         // Affiliate tracking  
  '/api/analytics(.*)',          // Analytics events
  '/api/auth/github(.*)',        // GitHub OAuth
  '/api/auth/google(.*)',        // Google OAuth
  '/api/auth/dropbox(.*)',       // Dropbox OAuth
])

export default clerkMiddleware(async (auth, req) => {
  // Protect all routes except public ones
  if (!isPublicRoute(req)) {
    await auth.protect()
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

