import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Public routes: no auth required. Uses Clerk's createRouteMatcher for reliable matching.
const isPublicRoute = createRouteMatcher([
  '/',
  '/about',
  '/contact',
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
  '/private-access',
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

  const privateAccessUrl = new URL('/private-access', req.url)
  privateAccessUrl.searchParams.set('redirect_url', req.url)

  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.redirect(privateAccessUrl)
    }
  } catch {
    return NextResponse.redirect(privateAccessUrl)
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

