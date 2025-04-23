import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { API_CONFIG } from '@/lib/config';

/**
 * Server-side API route to fetch an image directly from the backend
 * GET /api/v1/image/uploads/events/...
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Check if the request URL is a localhost URL
    if (request.url.includes('localhost') || request.url.includes('127.0.0.1')) {
      console.error('[Image Route] Error: Request URL contains localhost:', request.url);
      return new NextResponse('Direct localhost requests are not allowed', { status: 400 });
    }

    // Get the path from the URL parameters
    const path = params.path.join('/');
    
    if (!path) {
      console.error('[Image Route] No path provided');
      return new NextResponse('Path parameter is required', { status: 400 });
    }

    // Construct the full URL to the backend
    const backendUrl = API_CONFIG.BACKEND_URL.endsWith('/')
      ? API_CONFIG.BACKEND_URL.slice(0, -1)
      : API_CONFIG.BACKEND_URL;

    // Construct the full URL
    const fullUrl = `${backendUrl}/uploads/${path}`;

    console.log(`[Image Route] Fetching image from: ${fullUrl}`);

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
        console.log('[Image Route] Using token from cookies');
      }
    } else {
      console.log('[Image Route] Using authorization from headers');
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
      console.log(`[Image Route] Added Authorization header: ${maskedToken}`);
    } else {
      console.warn('[Image Route] No authorization token found');
    }

    // Make the request to the backend
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: requestHeaders,
      cache: 'no-store'
    });

    // Check if the response is successful
    if (!response.ok) {
      console.error(`[Image Route] Backend returned error: ${response.status}`);
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
    console.error('[Image Route] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
