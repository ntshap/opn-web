import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';

/**
 * Server-side API route to proxy file requests with authentication
 * GET /api/v1/proxy-file?url=...
 * 
 * This route is a fallback for any existing code that might be using it.
 * New code should use the direct backend URL instead.
 */
export async function GET(request: NextRequest) {
  try {
    // Get the URL from the query parameters
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');

    // Validate that we have a URL
    if (!fileUrl) {
      console.error('[Proxy File] No URL provided');
      return new NextResponse('URL parameter is required', { status: 400 });
    }

    // Check if the URL is a localhost URL
    if (fileUrl.includes('localhost') || fileUrl.includes('127.0.0.1')) {
      console.error('[Proxy File] Error: URL contains localhost:', fileUrl);
      return new NextResponse('Localhost URLs are not allowed', { status: 400 });
    }

    console.log(`[Proxy File] Proxying request to: ${fileUrl}`);

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
        console.log('[Proxy File] Using token from cookies');
      }
    } else {
      console.log('[Proxy File] Using authorization from headers');
    }

    // Create headers for the backend request
    const requestHeaders: HeadersInit = {
      'Accept': '*/*',
    };

    // Add authorization header if available
    if (authHeader) {
      requestHeaders['Authorization'] = authHeader;
      // Log a masked version of the token for debugging
      const maskedToken = authHeader.length > 15
        ? `${authHeader.substring(0, 10)}...${authHeader.substring(authHeader.length - 5)}`
        : '***';
      console.log(`[Proxy File] Added Authorization header: ${maskedToken}`);
    } else {
      console.warn('[Proxy File] No authorization token found');
    }

    // Make the request to the backend with a direct GET request
    const response = await fetch(fileUrl, {
      method: 'GET',
      headers: requestHeaders,
      cache: 'no-store'
    });

    // Check if the response is successful
    if (!response.ok) {
      console.error(`[Proxy File] Backend returned error: ${response.status}`);
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
    console.error('[Proxy File] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
