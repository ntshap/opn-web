import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { API_CONFIG } from '@/lib/config';

/**
 * Direct proxy route for uploads
 * This route directly proxies requests to the backend without any URL manipulation
 * GET /uploads/events/2025-04-21/2025-04/24_1745227510164.png
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Get the path from the URL parameters
    const path = params.path.join('/');
    
    if (!path) {
      console.error('[Uploads Proxy] No path provided');
      return new NextResponse('Path parameter is required', { status: 400 });
    }

    // Construct the full URL to the backend
    const backendUrl = API_CONFIG.BACKEND_URL.endsWith('/')
      ? API_CONFIG.BACKEND_URL.slice(0, -1)
      : API_CONFIG.BACKEND_URL;

    // Construct the full URL
    const fullUrl = `${backendUrl}/uploads/${path}`;

    console.log(`[Uploads Proxy] Proxying request to: ${fullUrl}`);

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
        console.log('[Uploads Proxy] Using token from cookies');
      }
    } else {
      console.log('[Uploads Proxy] Using authorization from headers');
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
      console.log(`[Uploads Proxy] Added Authorization header: ${maskedToken}`);
    } else {
      console.warn('[Uploads Proxy] No authorization token found');
    }

    // Make the request to the backend
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: requestHeaders,
      cache: 'no-store'
    });

    // Check if the response is successful
    if (!response.ok) {
      console.error(`[Uploads Proxy] Backend returned error: ${response.status}`);
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
    console.error('[Uploads Proxy] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
