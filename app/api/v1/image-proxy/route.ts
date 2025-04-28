import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';
import { headers } from 'next/headers';
import { cookies } from 'next/headers';

/**
 * Image proxy endpoint to avoid CORS issues with direct image requests
 * GET /api/v1/image-proxy?url=https://backend-url.com//uploads/...&token=your_auth_token
 *
 * This endpoint ensures:
 * 1. We use GET method (not OPTIONS)
 * 2. We include the Bearer token in the Authorization header
 * 3. We handle errors properly
 */
export async function GET(request: NextRequest) {
  try {
    // Get the URL and token from the query parameters
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const token = searchParams.get('token');

    // Validate the URL
    if (!url) {
      console.error('[Image Proxy] No URL provided');
      return new NextResponse('URL parameter is required', { status: 400 });
    }

    // Validate the token
    if (!token) {
      console.error('[Image Proxy] No token provided');
      // Try to get token from cookies or headers as fallback
      const headersList = headers();
      const authorization = headersList.get('authorization');

      if (!authorization) {
        const cookieStore = cookies();
        const tokenCookie = cookieStore.get('token') || cookieStore.get('auth_token');

        if (!tokenCookie || !tokenCookie.value) {
          console.error('[Image Proxy] No token found in request, cookies, or headers');
          return new NextResponse('Authorization token is required', { status: 401 });
        }
      }
    }

    // Use the URL directly
    const fullUrl = url;
    console.log(`[Image Proxy] Proxying request to: ${fullUrl}`);

    // Create headers for the backend request
    const requestHeaders: HeadersInit = {
      'Accept': 'image/*',
      'Cache-Control': 'no-cache',
    };

    // Use the token from query parameter if available
    if (token) {
      // Ensure the token has the Bearer prefix
      requestHeaders['Authorization'] = token.startsWith('Bearer ')
        ? token
        : `Bearer ${token}`;

      // Log a redacted version of the token for debugging
      const maskedToken = token.length > 15
        ? `${token.substring(0, 10)}...${token.substring(token.length - 5)}`
        : '***';
      console.log(`[Image Proxy] Using token from query parameter: ${maskedToken}`);
    }
    // Otherwise try to get from authorization header
    else {
      const headersList = headers();
      const authorization = headersList.get('authorization');

      if (authorization) {
        // Ensure the authorization header has the Bearer prefix
        requestHeaders['Authorization'] = authorization.startsWith('Bearer ')
          ? authorization
          : `Bearer ${authorization}`;
        console.log('[Image Proxy] Using authorization from request header');
      }
      // Finally try cookies as last resort
      else {
        const cookieStore = cookies();
        const tokenCookie = cookieStore.get('token') || cookieStore.get('auth_token');

        if (tokenCookie && tokenCookie.value) {
          const tokenValue = tokenCookie.value;
          requestHeaders['Authorization'] = tokenValue.startsWith('Bearer ')
            ? tokenValue
            : `Bearer ${tokenValue}`;
          console.log('[Image Proxy] Using token from cookies');
        } else {
          console.warn('[Image Proxy] No token found anywhere - request will likely fail');
        }
      }
    }

    // Make the request to the backend with explicit GET method
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(fullUrl, {
        method: 'GET', // Explicitly use GET method, not OPTIONS
        headers: requestHeaders,
        cache: 'no-store', // Don't use cache to ensure fresh content
        signal: controller.signal
      });

      clearTimeout(timeoutId);

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
    } catch (fetchError) {
      console.error(`[Image Proxy] Error fetching image: ${fetchError}`);
      clearTimeout(timeoutId);

      // Return the actual error
      return new NextResponse(`Error fetching image: ${fetchError.message}`, {
        status: 500
      });
    }
  } catch (error) {
    console.error('[Image Proxy] Error:', error);
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
  }
}
