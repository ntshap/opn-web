import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { API_CONFIG } from './lib/config'

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Log the request for debugging
  console.log('Middleware: Request to', request.nextUrl.pathname)

  // Skip authentication check for login page, static assets, and API routes
  const isLoginPage = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/simple-login'
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
  // Check if this is a direct image request to the backend
  const isBackendImageRequest = request.nextUrl.host.includes('beopn.penaku.site') &&
    (request.nextUrl.pathname.includes('/uploads/') || request.nextUrl.pathname.includes('/images/'))
  // Check if this is a direct-image API request
  const isDirectImageRequest = request.nextUrl.pathname === '/api/v1/direct-image'
  const isStaticAsset = [
    '/_next',
    '/images',
    '/favicon.ico',
    '/static',
  ].some(path => request.nextUrl.pathname.startsWith(path))

  // Handle direct-image requests specially
  if (isDirectImageRequest) {
    // Get the path parameter
    const imagePath = request.nextUrl.searchParams.get('path')

    if (!imagePath) {
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 }
      )
    }

    // Normalize the path
    let normalizedPath = imagePath

    // If it's a full URL, extract the path part
    if (normalizedPath.startsWith('http')) {
      try {
        const url = new URL(normalizedPath)
        normalizedPath = url.pathname
      } catch (e) {
        console.error(`[Middleware] Failed to parse URL: ${normalizedPath}`)
      }
    }

    // Ensure it starts with a slash
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = `/${normalizedPath}`
    }

    // If the path doesn't start with /uploads/ but contains 'uploads', fix it
    if (!normalizedPath.startsWith('/uploads/') && normalizedPath.includes('uploads')) {
      const uploadsPart = normalizedPath.split('uploads/')
      if (uploadsPart.length > 1) {
        normalizedPath = `/uploads/${uploadsPart[1]}`
      }
    }

    // Get the backend URL from config
    const backendUrl = API_CONFIG.BACKEND_URL

    // Make sure we have the correct backend URL
    if (!backendUrl || backendUrl.includes('localhost')) {
      return NextResponse.json(
        { error: 'Invalid backend configuration' },
        { status: 500 }
      )
    }

    // Remove trailing slash if present
    const backendBaseUrl = backendUrl.endsWith('/')
      ? backendUrl.slice(0, -1)
      : backendUrl

    // Remove /api/v1 from the backend URL if present
    const baseUrlWithoutApiPath = backendBaseUrl.replace(/\/api\/v1$/, '')

    // Construct the full URL
    const fullUrl = `${baseUrlWithoutApiPath}${normalizedPath}`

    console.log(`[Middleware] Redirecting direct-image request to: ${fullUrl}`)

    // Get token from cookies
    let token = request.cookies.get('auth_token')?.value

    // Create headers for the backend request
    const requestHeaders = new Headers(request.headers)

    // Forward the Authorization header if it exists
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      console.log('Using Authorization header from request')
      requestHeaders.set('Authorization', authHeader)
    } else if (token) {
      // If no Authorization header but we have a token in cookies, add it
      // Check if the token already has the Bearer prefix
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`
      console.log('Using token from cookies')
      requestHeaders.set('Authorization', authToken)
    } else {
      console.log('No auth token found - request will be unauthorized')
    }

    // Create a new URL for the redirect
    const redirectUrl = new URL(fullUrl)

    // Rewrite the request to the backend URL
    return NextResponse.rewrite(redirectUrl, {
      headers: requestHeaders
    })
  }

  // If this is the login page, a static asset, or an API route, don't redirect
  if (isLoginPage || isStaticAsset || isApiRoute || isBackendImageRequest) {
    // Get response headers
    const requestHeaders = new Headers(request.headers)

    // For API routes and backend image requests, we still need to set the Authorization header
    if (isApiRoute || isBackendImageRequest) {
      // Get token from cookies
      let token = request.cookies.get('auth_token')?.value

      // Forward the Authorization header if it exists
      const authHeader = request.headers.get('authorization')
      if (authHeader) {
        console.log('Using Authorization header from request:', authHeader)
        requestHeaders.set('Authorization', authHeader)
      } else if (token) {
        // If no Authorization header but we have a token in cookies, add it
        // Check if the token already has the Bearer prefix
        const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`
        console.log('Using token from cookies:', authToken)
        requestHeaders.set('Authorization', authToken)
      } else {
        // Don't add a mock token - let the backend handle unauthorized requests
        console.log('No auth token found - request will be unauthorized')
      }
    }

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Origin', '*') // Configure this based on your needs
    response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT')
    response.headers.set(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    )

    return response
  }

  // FORCE REDIRECT: All routes except login and API routes should redirect to login
  // This is a more aggressive approach to ensure users always go through login
  const isRootPath = request.nextUrl.pathname === '/' || request.nextUrl.pathname === ''

  // If this is not the login page, a static asset, or an API route, redirect to login
  if (!isLoginPage && !isStaticAsset && !isApiRoute && !isBackendImageRequest) {
    console.log('Middleware: Forcing redirect to login page from:', request.nextUrl.pathname)

    // Get token from cookies
    const token = request.cookies.get('auth_token')?.value
    const isLoggedIn = request.cookies.get('is_logged_in')?.value === 'true'

    // Log authentication status
    console.log('Auth check in middleware:', {
      token: token ? 'present' : 'missing',
      isLoggedIn: isLoggedIn ? 'true' : 'false'
    })

    // Always redirect to login page unless both token and is_logged_in are present
    if (!token || !isLoggedIn) {
      // If it's the root path, just redirect to login without a redirect parameter
      if (isRootPath) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }

      // For other routes, store the current URL to redirect back after login
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', request.nextUrl.pathname)

      return NextResponse.redirect(url)
    }

    // If we get here, the user is authenticated, so we can proceed
    console.log('User is authenticated, proceeding to:', request.nextUrl.pathname)
  }

  // Get response headers
  const requestHeaders = new Headers(request.headers)

  // Get token from cookies
  let token = request.cookies.get('auth_token')?.value

  // Forward the Authorization header if it exists
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    console.log('Using Authorization header from request:', authHeader)
    requestHeaders.set('Authorization', authHeader)
  } else if (token) {
    // If no Authorization header but we have a token in cookies, add it
    // Check if the token already has the Bearer prefix
    const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`
    console.log('Using token from cookies:', authToken)
    requestHeaders.set('Authorization', authToken)
  } else {
    // Don't add a mock token - let the backend handle unauthorized requests
    console.log('No auth token found - request will be unauthorized')
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Add CORS headers
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Allow-Origin', '*') // Configure this based on your needs
  response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT')
  response.headers.set(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  )

  return response
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next (static files, images, etc.)
     * - favicon.ico (favicon file)
     * - images/ (public images)
     * - static/ (static assets)
     *
     * Note: We INCLUDE api routes so we can add auth headers to them
     */
    '/((?!_next|favicon.ico|images|static).*)',
    // Explicitly include the direct-image API route
    '/api/v1/direct-image',
  ],
}
