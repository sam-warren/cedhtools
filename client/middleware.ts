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

  // Get user - but don't require authentication
  await supabase.auth.getUser()
  
  // Allow access to all routes regardless of authentication status
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