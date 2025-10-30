import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
])

// Explicitly define public routes that should never be protected
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/features(.*)',
  '/blog(.*)',
  '/help(.*)',
  '/pricing(.*)',
  '/tos(.*)',
  '/privacy-policy(.*)',
])

export default clerkMiddleware((auth, req) => {
  // Skip protection for public routes
  if (isPublicRoute(req)) {
    return
  }
  
  // Only protect dashboard routes
  if (isProtectedRoute(req)) {
    auth.protect()
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

