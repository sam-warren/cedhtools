import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Public routes that don't require authentication
const publicRoutes = ['/', '/login', '/auth/callback']

export async function middleware(request: NextRequest) {
  console.log(`[Middleware] Handling request to: ${request.nextUrl.pathname}`)

  // Skip middleware for static files
  if (
    request.nextUrl.pathname.includes('_next') || 
    request.nextUrl.pathname.includes('static') ||
    request.nextUrl.pathname.endsWith('.ico')
  ) {
    return NextResponse.next()
  }

  // Create response to modify
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client
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

  // Check if this is a public route
  if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    console.log('[Middleware] Public route, allowing access')
    return response
  }

  // Get user
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('[Middleware] Error getting user:', error.message)
  }

  console.log('[Middleware] User authenticated:', !!user)

  // If no user and trying to access protected route, redirect to login
  if (!user) {
    console.log('[Middleware] No user found, redirecting to login')
    const returnTo = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(new URL(`/login?returnTo=${returnTo}`, request.url))
  }

  return response
}

// Update config to only run middleware on specific paths
export const config = {
  matcher: [
    // Protected routes
    '/deck/:path*',
    '/api/decks/:path*',
    '/dashboard',
    '/profile',
    '/pricing'
  ]
} 