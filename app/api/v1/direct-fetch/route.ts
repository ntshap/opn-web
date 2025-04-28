import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';

/**
 * Server-side API route to fetch a resource with authentication
 * GET /api/v1/direct-fetch?url=...
 */
export async function GET(request: NextRequest) {
  // Check if the request URL is a localhost URL
  if (request.url.includes('localhost') || request.url.includes('127.0.0.1')) {
    console.error('[Direct Fetch] Error: Request URL contains localhost:', request.url);
    return new NextResponse('Direct localhost requests are not allowed', { status: 400 });
  }
  try {
    // Get the URL from the query parameters
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    // Validate that we have a URL
    if (!url) {
      console.error('[Direct Fetch] No URL provided');
      return new NextResponse('URL parameter is required', { status: 400 });
    }

    console.log(`[Direct Fetch] Fetching URL: ${url}`);

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
        console.log('[Direct Fetch] Using token from cookies');
      }
    } else {
      console.log('[Direct Fetch] Using authorization from headers');
    }

    // Create headers for the backend request
    const requestHeaders: HeadersInit = {};

    // Add authorization header if available
    if (authHeader) {
      requestHeaders['Authorization'] = authHeader;
      // Log a masked version of the token for debugging
      const maskedToken = authHeader.length > 15
        ? `${authHeader.substring(0, 10)}...${authHeader.substring(authHeader.length - 5)}`
        : '***';
      console.log(`[Direct Fetch] Added Authorization header: ${maskedToken}`);
    } else {
      console.warn('[Direct Fetch] No authorization token found');
    }

    // Make the request to the backend with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: requestHeaders,
        cache: 'no-store',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Check if the response is successful
      if (!response.ok) {
        console.error(`[Direct Fetch] Backend returned error: ${response.status} for URL: ${url}`);
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
      console.error(`[Direct Fetch] Error fetching image: ${fetchError}`);
      clearTimeout(timeoutId);

      // Return the actual error
      return new NextResponse(`Error fetching image: ${fetchError.message}`, {
        status: 500
      });
    }
  } catch (error) {
    console.error('[Direct Fetch] Error:', error);
    // Return the actual error
    return new NextResponse(`Internal Server Error: ${error.message}`, {
      status: 500
    });
  }
}
