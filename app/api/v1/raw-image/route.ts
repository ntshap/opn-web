import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { getAuthToken } from '@/lib/auth-utils';

/**
 * Server-side API route to proxy image requests with authentication
 * GET /api/v1/raw-image?url=...
 */
export async function GET(request: NextRequest) {
  try {
    // Get the URL from the query parameters
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    // Validate that we have a URL
    if (!imageUrl) {
      console.error('[Raw Image] No URL provided');
      return new NextResponse('URL parameter is required', { status: 400 });
    }

    console.log(`[Raw Image] Proxying image request for: ${imageUrl}`);

    // Get authorization from request headers first
    const headersList = headers();
    let authHeader = headersList.get('authorization');

    // If no auth in headers, try to get it from the client-side auth utils
    // This won't work directly in a server component, but we can try cookies
    if (!authHeader) {
      // Try to get from cookies
      const cookieStore = cookies();
      const tokenCookie = cookieStore.get('token') || cookieStore.get('auth_token');

      if (tokenCookie && tokenCookie.value) {
        authHeader = tokenCookie.value.startsWith('Bearer ')
          ? tokenCookie.value
          : `Bearer ${tokenCookie.value}`;
        console.log('[Raw Image] Using token from cookies');
      } else {
        // If we still don't have a token, log a warning
        console.warn('[Raw Image] No authorization token found in cookies');
      }
    } else {
      console.log('[Raw Image] Using authorization from headers');
    }

    // Create headers for the backend request
    const requestHeaders: HeadersInit = {
      'Accept': 'image/*',
    };

    // Add authorization header if available
    if (authHeader) {
      // Make sure the token has the Bearer prefix
      const formattedAuthHeader = authHeader.startsWith('Bearer ')
        ? authHeader
        : `Bearer ${authHeader}`;

      requestHeaders['Authorization'] = formattedAuthHeader;

      // Log a masked version of the token for debugging
      const maskedToken = formattedAuthHeader.length > 15
        ? `${formattedAuthHeader.substring(0, 15)}...${formattedAuthHeader.substring(formattedAuthHeader.length - 5)}`
        : '***';
      console.log(`[Raw Image] Added Authorization header: ${maskedToken}`);
    } else {
      console.warn('[Raw Image] No authorization token found');

      // Return a 401 Unauthorized response with a clear error message
      return new NextResponse(JSON.stringify({
        error: 'Authentication required to access this image',
        message: 'Please log in to view this content'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Make the request to the backend with a direct GET request
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: requestHeaders,
      cache: 'no-store'
    });

    // Check if the response is successful
    if (!response.ok) {
      console.error(`[Raw Image] Backend returned error: ${response.status}`);
      return new NextResponse(`Backend error: ${response.status}`, { status: response.status });
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
  } catch (error) {
    console.error('[Raw Image] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
