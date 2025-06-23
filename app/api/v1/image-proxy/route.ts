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

    // Use the URL directly, but ensure it has the correct format with double slashes after domain
    let fullUrl = url;

    // Ensure the URL has the correct format with double slashes after domain
    if (fullUrl.includes('beopn.penaku.site/') && !fullUrl.includes('beopn.penaku.site//')) {
      // Fix the URL to have double slashes
      fullUrl = fullUrl.replace('beopn.penaku.site/', 'beopn.penaku.site//');
      console.log(`[Image Proxy] Fixed URL to have double slashes: ${fullUrl}`);
    }

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
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for faster response

    try {
      // Add a timestamp to the URL to prevent caching
      const urlWithTimestamp = `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`;

      // Add priority header for faster loading
      requestHeaders['Priority'] = 'high';

      const response = await fetch(urlWithTimestamp, {
        method: 'GET', // Explicitly use GET method, not OPTIONS
        headers: requestHeaders,
        cache: 'no-store', // Don't use cache to ensure fresh content
        signal: controller.signal,
        // Set mode to 'no-cors' to prevent OPTIONS preflight requests
        // This ensures we always use GET method
        next: { revalidate: 0 } // Disable Next.js caching
      });

      clearTimeout(timeoutId);

      // Check if the response is successful
      if (!response.ok) {
        console.error(`[Image Proxy] Backend returned error: ${response.status} ${response.statusText}`);

        // Return a transparent 1x1 pixel GIF as fallback instead of an error
        // This helps prevent the UI from breaking when images fail to load
        const transparentPixel = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        const buffer = Buffer.from(transparentPixel, 'base64');

        return new NextResponse(buffer, {
          status: 200, // Return 200 to prevent error in the UI
          headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-cache',
            'X-Error': `Backend error: ${response.status}`,
          },
        });
      }

      // Get the response body as an array buffer
      const buffer = await response.arrayBuffer();

      // Get the content type from the response
      const contentType = response.headers.get('content-type') || 'application/octet-stream';

      // Return the response with the correct content type
      // Use no-cache to ensure fresh images
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });
    } catch (fetchError) {
      console.error(`[Image Proxy] Error fetching image: ${fetchError}`);
      clearTimeout(timeoutId);

      // Return a transparent 1x1 pixel GIF as fallback instead of an error
      // This helps prevent the UI from breaking when images fail to load
      const transparentPixel = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      const buffer = Buffer.from(transparentPixel, 'base64');

      return new NextResponse(buffer, {
        status: 200, // Return 200 to prevent error in the UI
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache',
          'X-Error': `Error fetching image: ${fetchError.message}`,
        },
      });
    }
  } catch (error) {
    console.error('[Image Proxy] Error:', error);

    // Return a transparent 1x1 pixel GIF as fallback instead of an error
    // This helps prevent the UI from breaking when images fail to load
    const transparentPixel = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    const buffer = Buffer.from(transparentPixel, 'base64');

    return new NextResponse(buffer, {
      status: 200, // Return 200 to prevent error in the UI
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache',
        'X-Error': `Internal Server Error: ${error.message}`,
      },
    });
  }
}
