import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';
import { headers } from 'next/headers';
import { cookies } from 'next/headers';

/**
 * Image proxy endpoint to avoid CORS issues with direct image requests
 * GET /api/v1/image-proxy?path=/uploads/...
 */
export async function GET(request: NextRequest) {
  try {
    // Get the path from the query parameters
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    // Validate the path
    if (!path) {
      console.error('[Image Proxy] No path provided');
      return new NextResponse('Path parameter is required', { status: 400 });
    }

    // Ensure the path starts with a slash
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    // Only allow paths that start with /uploads/ for security
    if (!normalizedPath.includes('/uploads/')) {
      console.error('[Image Proxy] Invalid path, must include /uploads/:', normalizedPath);
      return new NextResponse('Invalid path', { status: 400 });
    }

    // Construct the full URL
    const backendBaseUrl = API_CONFIG.BACKEND_URL.endsWith('/')
      ? API_CONFIG.BACKEND_URL.slice(0, -1)
      : API_CONFIG.BACKEND_URL;

    const fullUrl = `${backendBaseUrl}${normalizedPath}`;
    console.log(`[Image Proxy] Proxying request to: ${fullUrl}`);

    // Get the authorization header from the incoming request
    const headersList = headers();
    const authorization = headersList.get('authorization');

    // Create headers for the backend request
    const requestHeaders: HeadersInit = {
      'Accept': 'image/*',
      'Cache-Control': 'no-cache',
    };

    // Add authorization header if present
    if (authorization) {
      // Ensure the authorization header has the Bearer prefix
      if (!authorization.startsWith('Bearer ')) {
        requestHeaders['Authorization'] = `Bearer ${authorization}`;
        console.log('[Image Proxy] Added Bearer prefix to authorization header');
      } else {
        requestHeaders['Authorization'] = authorization;
        console.log('[Image Proxy] Authorization header already has Bearer prefix');
      }

      // Log a redacted version of the token for debugging
      const authHeader = requestHeaders['Authorization'];
      if (authHeader && authHeader.length > 20) {
        console.log(`[Image Proxy] Using authorization header: ${authHeader.substring(0, 20)}...`);
      } else {
        console.log('[Image Proxy] Using authorization header (short format)');
      }
    } else {
      console.warn('[Image Proxy] No authorization header in request, checking cookies');

      // Try to get token from cookies as fallback
      const cookieStore = cookies();
      const tokenCookie = cookieStore.get('token') || cookieStore.get('auth_token');

      if (tokenCookie && tokenCookie.value) {
        const tokenValue = tokenCookie.value;
        requestHeaders['Authorization'] = tokenValue.startsWith('Bearer ')
          ? tokenValue
          : `Bearer ${tokenValue}`;
        console.log('[Image Proxy] Using token from cookies');
      } else {
        console.warn('[Image Proxy] No token found in cookies either');
      }
    }

    // Make the request to the backend
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: requestHeaders,
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    // Check if the response is successful
    if (!response.ok) {
      console.error(`[Image Proxy] Backend returned error: ${response.status} ${response.statusText}`);
      return new NextResponse(`Backend error: ${response.status} ${response.statusText}`, {
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
  } catch (error) {
    console.error('[Image Proxy] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
