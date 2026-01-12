import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define public routes that don't require authentication
// Custom function to check if route is public (more reliable than pattern matching)
function isPublicRoute(pathname: string): boolean {
  // Exact matches
  if (pathname === '/' || 
      pathname === '/features' || 
      pathname === '/compare' || 
      pathname === '/pricing' || 
      pathname === '/help' ||
      pathname === '/how-it-works' ||
      pathname === '/tos' ||
      pathname === '/privacy-policy') {
    return true
  }
  
  // Pattern matches
  if (pathname.startsWith('/sign-in') ||
      pathname.startsWith('/sign-up') ||
      pathname.startsWith('/help/') ||
      pathname.startsWith('/api/gallery') ||
      pathname.startsWith('/api/waitlist') ||
      pathname.startsWith('/api/affiliates') ||
      pathname.startsWith('/api/analytics') ||
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/app/affiliates/apply')) {
    return true
  }
  
  return false
}

export default clerkMiddleware(async (auth, req) => {
  // Protect all routes except public ones
  const pathname = req.nextUrl.pathname
  if (!isPublicRoute(pathname)) {
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

