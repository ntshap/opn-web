import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';

/**
 * Server-side API route to proxy an image request to the backend
 * GET /api/v1/proxy-image?url=...
 */
export async function GET(request: NextRequest) {
  try {
    // Get the URL from the query parameters
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    // Validate that we have a URL
    if (!url) {
      console.error('[Proxy Image] No URL provided');
      return new NextResponse('URL parameter is required', { status: 400 });
    }

    // Check if the URL contains localhost
    if (url.includes('localhost')) {
      console.error('[Proxy Image] URL contains localhost:', url);
      return new NextResponse('URLs containing localhost are not allowed', { status: 400 });
    }

    console.log(`[Proxy Image] Proxying request to: ${url}`);

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
        console.log('[Proxy Image] Using token from cookies');
      }
    } else {
      console.log('[Proxy Image] Using authorization from headers');
    }

    // Create headers for the backend request
    const requestHeaders: HeadersInit = {
      'Accept': 'image/*',
    };

    // Add authorization header if available
    if (authHeader) {
      requestHeaders['Authorization'] = authHeader;
      // Log a masked version of the token for debugging
      const maskedToken = authHeader.length > 15
        ? `${authHeader.substring(0, 10)}...${authHeader.substring(authHeader.length - 5)}`
        : '***';
      console.log(`[Proxy Image] Added Authorization header: ${maskedToken}`);
    } else {
      console.warn('[Proxy Image] No authorization token found');
    }

    // Log the request details
    console.log(`[Proxy Image] Making request to: ${url}`);
    console.log(`[Proxy Image] Request headers:`, requestHeaders);

    // Make the request to the backend
    const response = await fetch(url, {
      method: 'GET',
      headers: requestHeaders,
      cache: 'no-store'
    });

    // Log the response details
    console.log(`[Proxy Image] Response status: ${response.status} ${response.statusText}`);
    console.log(`[Proxy Image] Response headers:`, Object.fromEntries([...response.headers.entries()]));

    // Check if the response is successful
    if (!response.ok) {
      // Try to get the response body for more information
      let errorText = '';
      try {
        errorText = await response.text();
        console.error(`[Proxy Image] Error response body:`, errorText);
      } catch (textError) {
        console.error(`[Proxy Image] Could not read error response body:`, textError);
      }

      console.error(`[Proxy Image] Backend returned error: ${response.status} ${response.statusText}`);
      return new NextResponse(`Backend error: ${response.status} ${response.statusText}\n${errorText}`, { status: response.status });
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
    console.error('[Proxy Image] Error:', error);
    return new NextResponse(`Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
}
