/**
 * Next.js Middleware for Authentication
 * 
 * This middleware handles Supabase session management by refreshing auth tokens
 * on each request. It does NOT enforce authentication - all routes are publicly
 * accessible, but authenticated users will have their sessions maintained.
 * 
 * ## Why the Empty Matcher?
 * The matcher is intentionally empty, which means this middleware runs on ALL routes.
 * This ensures auth session cookies are refreshed regardless of which page is visited.
 * 
 * ## Future Considerations
 * If you need to add protected routes in the future, you can:
 * 1. Add routes to the matcher array (e.g., matcher: ['/dashboard/:path*'])
 * 2. Check `user` and redirect unauthenticated users to /login
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Skip middleware for static assets to improve performance
  if (
    request.nextUrl.pathname.includes('_next') || 
    request.nextUrl.pathname.includes('static') ||
    request.nextUrl.pathname.endsWith('.ico')
  ) {
    return NextResponse.next()
  }

  // Create response object that will be modified with updated cookies
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Initialize Supabase client with cookie handlers
  // This pattern is required by @supabase/ssr for proper session management
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          return Array.from(request.cookies.getAll());
        },
        setAll: (cookies) => {
          cookies.map(({ name, value, ...options }) => {
            request.cookies.set({ name, value, ...options });
            response.cookies.set({ name, value, ...options });
          });
        }
      },
    }
  )

  // Refresh the auth session if it exists
  // This call ensures session cookies are updated with fresh tokens
  // Note: We don't enforce authentication here - all routes are accessible
  await supabase.auth.getUser()
  
  return response
}

// Middleware runs on all routes (empty matcher = match all)
// This is intentional for session cookie refresh on every request
export const config = {
  matcher: []
} 