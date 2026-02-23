import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define public routes that don't require authentication
// Custom function to check if route is public (more reliable than pattern matching)
function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/'
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
}

function isPublicRoute(pathname: string): boolean {
  const path = normalizePath(pathname)

  // Public marketing/legal/support routes (exact)
  const publicExactRoutes = new Set([
    '/',
    '/features',
    '/features/editor',
    '/compare',
    '/pricing',
    '/pricing/pro',
    '/pricing/ultra',
    '/pricing/studio',
    '/examples',
    '/how-it-works',
    '/help',
    '/coming-soon',
    '/agencies',
    '/filmmakers',
    '/marketing-teams',
    '/screenwriters',
    '/social-creators',
    '/affiliates',
    '/affiliates/apply',
    '/blog',
    '/tos',
    '/privacy-policy',
    '/unsubscribe',
  ])

  if (publicExactRoutes.has(path)) {
    return true
  }

  // Public route prefixes
  const publicPrefixes = [
    '/sign-in',
    '/sign-up',
    '/help/',
    '/help-archive/',
    '/blog/',
    '/api/gallery',
    '/api/waitlist',
    '/api/affiliates',
    '/api/analytics',
    '/api/auth',
  ]

  if (publicPrefixes.some((prefix) => path.startsWith(prefix))) {
    return true
  }
  
  return false
}

export default clerkMiddleware(async (auth, req) => {
  // Protect all routes except public ones
  const pathname = normalizePath(req.nextUrl.pathname)
  if (isPublicRoute(pathname)) {
    return
  }

  // Redirect to local sign-in page instead of Clerk hosted page
  const signInUrl = new URL('/sign-in', req.url)
  signInUrl.searchParams.set('redirect_url', req.url)

  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.redirect(signInUrl)
    }
  } catch {
    // Fail safe: never return a 500 from middleware for auth checks.
    return NextResponse.redirect(signInUrl)
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

