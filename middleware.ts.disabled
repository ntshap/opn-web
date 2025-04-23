import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === '/login' || path === '/register' || path === '/'

  // Get the token from cookies
  const token = request.cookies.get('token')?.value || ''

  // If the user is not authenticated and trying to access a protected route
  if (!token && !isPublicPath) {
    // Redirect to the login page
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If the user is authenticated and trying to access a public route
  if (token && isPublicPath) {
    // Redirect to the dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Otherwise, continue with the request
  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public images)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
}
