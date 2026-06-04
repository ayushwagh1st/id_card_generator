import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project-id.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.placeholder'

  // Mock User logic for local dev without supabase connected
  const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder')

  if (isMockMode) {
    const mockUserCookie = request.cookies.get('mock-user')?.value
    let mockUser = null
    if (mockUserCookie) {
      try {
        mockUser = JSON.parse(mockUserCookie)
      } catch (e) {
        // ignore
      }
    }

    if (mockUser) {
      const role = mockUser.role
      if (request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/login') {
        if (role === 'SUPER_ADMIN') {
           return NextResponse.redirect(new URL('/admin/dashboard', request.url))
        } else if (role === 'MODEL_HEAD') {
           return NextResponse.redirect(new URL('/head/dashboard', request.url))
        } else if (role === 'LECTURER') {
           return NextResponse.redirect(new URL('/lecturer/dashboard', request.url))
        }
      }

      // Enforce Admin access
      if (request.nextUrl.pathname.startsWith('/admin') && role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      // Enforce Head access
      if (request.nextUrl.pathname.startsWith('/head') && role !== 'MODEL_HEAD') {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      // Enforce Lecturer access
      if (request.nextUrl.pathname.startsWith('/lecturer') && role !== 'LECTURER') {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      return supabaseResponse
    }

    // Unauthenticated mock mode - protect admin/head/lecturer routes
    if (
      request.nextUrl.pathname.startsWith('/admin') ||
      request.nextUrl.pathname.startsWith('/head') ||
      request.nextUrl.pathname.startsWith('/lecturer')
    ) {
      const urlObj = request.nextUrl.clone()
      urlObj.pathname = '/login'
      return NextResponse.redirect(urlObj)
    }
    return supabaseResponse
  }

  // Real Supabase Auth Mode
  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      if (
        request.nextUrl.pathname.startsWith('/admin') ||
        request.nextUrl.pathname.startsWith('/head') ||
        request.nextUrl.pathname.startsWith('/lecturer')
      ) {
        const urlObj = request.nextUrl.clone()
        urlObj.pathname = '/login'
        return NextResponse.redirect(urlObj)
      }
      return supabaseResponse
    }

    const role = user.user_metadata?.role

    // Redirect logged in users away from / or /login to their dashboard
    if (request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/login') {
      if (role === 'SUPER_ADMIN') {
         return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      } else if (role === 'MODEL_HEAD') {
         return NextResponse.redirect(new URL('/head/dashboard', request.url))
      } else if (role === 'LECTURER') {
         return NextResponse.redirect(new URL('/lecturer/dashboard', request.url))
      }
    }

    // Enforce role checks for real auth
    if (request.nextUrl.pathname.startsWith('/admin') && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (request.nextUrl.pathname.startsWith('/head') && role !== 'MODEL_HEAD') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (request.nextUrl.pathname.startsWith('/lecturer') && role !== 'LECTURER') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

  } catch (err) {
    if (
      request.nextUrl.pathname.startsWith('/admin') ||
      request.nextUrl.pathname.startsWith('/head') ||
      request.nextUrl.pathname.startsWith('/lecturer')
    ) {
      const urlObj = request.nextUrl.clone()
      urlObj.pathname = '/login'
      return NextResponse.redirect(urlObj)
    }
  }

  return supabaseResponse
}

