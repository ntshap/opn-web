import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { API_CONFIG } from '@/lib/config';

/**
 * Server-side API route to proxy image requests with authentication
 * GET /api/v1/secure-image?url=...
 * 
 * This endpoint ensures:
 * 1. We use GET method (not OPTIONS)
 * 2. We include the Bearer token in the Authorization header
 * 3. We handle errors properly
 */
export async function GET(request: NextRequest) {
  try {
    // Get the URL from the query parameters
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    // Validate that we have a URL
    if (!imageUrl) {
      console.error('[Secure Image] No URL provided');
      return new NextResponse('URL parameter is required', { status: 400 });
    }

    // Check if the URL contains localhost
    if (imageUrl.includes('localhost')) {
      console.error('[Secure Image] URL contains localhost:', imageUrl);
      return new NextResponse(JSON.stringify({ error: 'Direct localhost requests are not allowed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Secure Image] Fetching image from: ${imageUrl}`);

    // Get authorization from request headers first
    const headersList = headers();
    let authHeader = headersList.get('authorization');

    // If no auth in headers, try cookies
    if (!authHeader) {
      const cookieStore = cookies();
      const tokenCookie = cookieStore.get('token') || cookieStore.get('auth_token');

      if (tokenCookie && tokenCookie.value) {
        authHeader = tokenCookie.value.startsWith('Bearer ')
          ? tokenCookie.value
          : `Bearer ${tokenCookie.value}`;
        console.log('[Secure Image] Using token from cookies');
      }
    } else {
      console.log('[Secure Image] Using authorization from headers');
    }

    // Create headers for the backend request
    const requestHeaders: HeadersInit = {
      'Accept': 'image/*',
    };

    // Add authorization header if available
    if (authHeader) {
      // Ensure the auth header has the Bearer prefix
      const formattedAuthHeader = authHeader.startsWith('Bearer ')
        ? authHeader
        : `Bearer ${authHeader}`;

      requestHeaders['Authorization'] = formattedAuthHeader;

      // Log a masked version of the token for debugging
      const maskedToken = formattedAuthHeader.length > 15
        ? `${formattedAuthHeader.substring(0, 15)}...${formattedAuthHeader.substring(formattedAuthHeader.length - 5)}`
        : '***';
      console.log(`[Secure Image] Added Authorization header: ${maskedToken}`);
    } else {
      console.warn('[Secure Image] No authorization token found');

      // Return a 401 Unauthorized response with a clear error message
      return new NextResponse(JSON.stringify({
        error: 'Authentication required to access this image',
        message: 'Please log in to view this content'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Make the request to the backend with a direct GET request (not OPTIONS)
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(imageUrl, {
        method: 'GET', // Explicitly use GET method, not OPTIONS
        headers: requestHeaders,
        cache: 'no-store',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Check if the response is successful
      if (!response.ok) {
        console.error(`[Secure Image] Backend returned error: ${response.status} for URL: ${imageUrl}`);
        // Return the actual error from the backend
        return new NextResponse(`Backend error: ${response.status}`, {
          status: response.status
        });
      }

      // Get the response body as an array buffer
      const buffer = await response.arrayBuffer();

      // Get the content type from the response
      const contentType = response.headers.get('content-type') || 'application/octet-stream';

      // Return the response with the correct content type
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (fetchError) {
      console.error(`[Secure Image] Error fetching image: ${fetchError}`);
      clearTimeout(timeoutId);

      // Return the actual error
      return new NextResponse(`Error fetching image: ${fetchError.message}`, {
        status: 500
      });
    }
  } catch (error) {
    console.error('[Secure Image] Error processing request:', error);
    return new NextResponse(`Server error: ${error.message}`, { status: 500 });
  }
}
