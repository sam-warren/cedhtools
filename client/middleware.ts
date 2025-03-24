import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const requestUrl = new URL(request.url)
  
  // Special case: Handle auth callback with code parameter
  if (requestUrl.pathname === '/auth/callback' && requestUrl.searchParams.has('code')) {
    return NextResponse.next()
  }

  // Special case: Root with code parameter - redirect to callback
  if (requestUrl.pathname === '/' && requestUrl.searchParams.has('code')) {
    const code = requestUrl.searchParams.get('code')
    return NextResponse.redirect(new URL(`/auth/callback?code=${code}`, requestUrl.origin))
  }
  
  // Skip auth check for non-protected routes
  // Only check auth for routes that start with /deck
  if (!requestUrl.pathname.startsWith('/deck')) {
    return NextResponse.next()
  }
  
  // Only create Supabase client for protected routes
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If no user and trying to access a protected route, redirect to login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Only run middleware on routes that might need auth:
     * - / with a code parameter (for auth redirect)
     * - /auth/callback (for handling auth)
     * - /deck/* (protected routes)
     */
    '/',
    '/auth/callback',
    '/deck/:path*'
  ],
} 