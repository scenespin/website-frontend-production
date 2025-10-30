import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/features',
  '/pricing',
  '/tos',
  '/privacy-policy',
  '/help(.*)',
])

export default clerkMiddleware((auth, req) => {
  // Protect all routes except public ones
  // Don't use auth.protect() - it can cause redirect loops
  if (!isPublicRoute(req)) {
    const { userId } = auth()
    
    // If not authenticated and trying to access protected route, redirect to sign-in
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect_url', req.url)
      return Response.redirect(signInUrl)
    }
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

