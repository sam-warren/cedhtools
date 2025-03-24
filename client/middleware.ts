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
  
  // Allow all routes - no protection
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Only run middleware on routes that need redirection:
     * - / with a code parameter (for auth redirect)
     * - /auth/callback (for handling auth)
     */
    '/',
    '/auth/callback',
  ],
} 