import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Public routes: no auth required. Uses Clerk's createRouteMatcher for reliable matching.
const isPublicRoute = createRouteMatcher([
  '/',
  '/features',
  '/features/editor',
  '/compare',
  '/pricing',
  '/pricing/pro',
  '/pricing/ultra',
  '/pricing/studio',
  '/examples',
  '/provenance-ledger',
  '/how-it-works',
  '/help',
  '/help/(.*)',
  '/help-archive/(.*)',
  '/coming-soon',
  '/agencies',
  '/filmmakers',
  '/marketing-teams',
  '/screenwriters',
  '/social-creators',
  '/affiliates',
  '/affiliates/apply',
  '/blog',
  '/blog/(.*)',
  '/models',
  '/tos',
  '/privacy-policy',
  '/unsubscribe',
  '/sign-in',
  '/sign-in/(.*)',
  '/sign-up',
  '/sign-up/(.*)',
  '/api/gallery/(.*)',
  '/api/waitlist/(.*)',
  '/api/lead',
  '/api/contact',
  '/api/newsletter/subscribe',
  '/api/unsubscribe',
  '/api/webhooks/resend',
  '/api/cron/(.*)',
  '/api/affiliates/(.*)',
  '/api/analytics/(.*)',
  '/api/auth/(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return
  }

  // Redirect to local sign-in page instead of Clerk hosted page
  const signInUrl = new URL('/sign-in', req.url)
  signInUrl.searchParams.set('redirect_url', req.url)

  try {
    const { userId, sessionId } = await auth()
    if (!userId || !sessionId) {
      return NextResponse.redirect(signInUrl)
    }
  } catch {
    // Avoid false redirects during transient auth handshake/cookie races.
    // Protected API/page handlers still enforce auth server-side.
    return NextResponse.next()
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

