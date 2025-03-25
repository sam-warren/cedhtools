import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { ensureUserRecord } from '@/lib/user-helpers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (!code) {
    // No code provided, redirect to login
    return NextResponse.redirect(new URL('/login', origin))
  }

  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, {
                ...options,
                // Ensure secure settings
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                // Extend the cookie expiration
                maxAge: 60 * 60 * 24 * 7 // 1 week
              })
            })
          },
        },
      }
    )

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error.message)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent('Authentication failed')}`, origin)
      )
    }

    // Get the user after successful authentication
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Ensure user record exists in the database
      const { error: userError } = await ensureUserRecord(
        supabase,
        user.id,
        user.email || ''
      )
      
      if (userError) {
        console.error('Error creating user record:', userError)
      }
    }

    // Simply redirect to home page after successful authentication
    return NextResponse.redirect(new URL('/', origin))
  } catch (error) {
    console.error('Unexpected error in auth callback:', error)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Authentication process failed')}`, origin)
    )
  }
} 