import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { getAuthToken } from '@/lib/auth-utils';

/**
 * Server-side API route to proxy image requests with authentication
 * GET /api/v1/raw-image?url=...
 */

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
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
        // If we still don't have a token, try to get it from localStorage via a cookie
        // This is a workaround since we can't access localStorage directly in a server component
        const authCookie = cookieStore.get('auth_token_for_server');
        if (authCookie && authCookie.value) {
          authHeader = authCookie.value.startsWith('Bearer ')
            ? authCookie.value
            : `Bearer ${authCookie.value}`;
          console.log('[Raw Image] Using token from auth_token_for_server cookie');
        } else {
          // If we still don't have a token, log a warning
          console.warn('[Raw Image] No authorization token found in any cookie');
        }
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
      // Even if we don't have a token, we'll still try to fetch the image
      // Some images might be publicly accessible
      console.warn('[Raw Image] No authorization token found, but proceeding anyway');
    }

    // Make the request to the backend with a direct GET request (not OPTIONS)
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      console.log(`[Raw Image] Making request to: ${imageUrl}`);
      console.log(`[Raw Image] With headers:`, requestHeaders);

      // Add a referrer policy to avoid CORS issues
      requestHeaders['Referrer-Policy'] = 'no-referrer';

      // Log the full request details
      console.log(`[Raw Image] Making request to: ${imageUrl}`);
      console.log(`[Raw Image] With headers:`, JSON.stringify(requestHeaders, null, 2));

      const response = await fetch(imageUrl, {
        method: 'GET', // Explicitly use GET method, not OPTIONS
        headers: requestHeaders,
        cache: 'no-store',
        signal: controller.signal,
        referrerPolicy: 'no-referrer',
        mode: 'cors',
        credentials: 'same-origin'
      });

      console.log(`[Raw Image] Response status: ${response.status} ${response.statusText}`);
      console.log(`[Raw Image] Response headers:`, Object.fromEntries([...response.headers.entries()]));

      clearTimeout(timeoutId);

      // Check if the response is successful
      if (!response.ok) {
        console.error(`[Raw Image] Backend returned error: ${response.status} for URL: ${imageUrl}`);

        // Try to get more information about the error
        let errorText = '';
        try {
          // Try to parse the response as text
          errorText = await response.text();
          console.error(`[Raw Image] Error response body:`, errorText);
        } catch (textError) {
          console.error(`[Raw Image] Could not read error response body:`, textError);
        }

        // For image requests, return a fallback image instead of an error
        // This helps prevent the UI from breaking when images fail to load
        console.log('[Raw Image] Returning fallback image');

        // Return a transparent 1x1 pixel GIF as fallback
        const transparentPixel = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        const buffer = Buffer.from(transparentPixel, 'base64');

        return new NextResponse(buffer, {
          status: 200,
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
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    } catch (fetchError) {
      console.error(`[Raw Image] Error fetching image: ${fetchError}`);
      clearTimeout(timeoutId);

      // For image requests, return a fallback image instead of an error
      // This helps prevent the UI from breaking when images fail to load
      console.log('[Raw Image] Returning fallback image due to fetch error');

      // Return a transparent 1x1 pixel GIF as fallback
      const transparentPixel = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      const buffer = Buffer.from(transparentPixel, 'base64');

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache',
          'X-Error': `Error fetching image: ${fetchError.message}`,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
  } catch (error) {
    console.error('[Raw Image] Error:', error);

    // For image requests, return a fallback image instead of an error
    // This helps prevent the UI from breaking when images fail to load
    console.log('[Raw Image] Returning fallback image due to server error');

    // Return a transparent 1x1 pixel GIF as fallback
    const transparentPixel = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    const buffer = Buffer.from(transparentPixel, 'base64');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache',
        'X-Error': `Internal Server Error: ${error.message}`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
}
