import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';

// Check if a URL is a localhost URL
function isLocalhostUrl(url: string): boolean {
  return url.includes('localhost') || url.includes('127.0.0.1');
}

/**
 * Helper function to construct a proper URL with the backend domain and path
 * Ensures there are no double slashes between the domain and path
 */
function constructFullBackendUrl(backendUrl: string, path: string): string {
  // Remove trailing slash from backend URL if present
  const baseUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;

  // Ensure path starts with a slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Combine them to form the full URL
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Server-side API route to proxy image requests with authentication
 * GET /api/v1/direct-image?path=...
 */
export async function GET(request: NextRequest) {
  try {
    // Check if the request URL is a localhost URL
    if (isLocalhostUrl(request.url)) {
      console.error('[Direct Image] Error: Request URL contains localhost:', request.url);
      return new NextResponse('Direct localhost requests are not allowed', { status: 400 });
    }
    // Get the path from the query parameters
    const { searchParams } = new URL(request.url);
    const imagePath = searchParams.get('path');

    // Validate that we have a path
    if (!imagePath) {
      console.error('[Direct Image] No path provided');
      return new NextResponse('Path parameter is required', { status: 400 });
    }

    // Normalize the path
    let normalizedPath = imagePath;

    // If it's a full URL, extract the path part
    if (normalizedPath.startsWith('http')) {
      try {
        console.log(`[Direct Image] Parsing full URL: ${normalizedPath}`);
        const url = new URL(normalizedPath);

        // Check if this is a URL to our backend
        if (url.hostname === 'beopn.mysesa.site') {
          console.log(`[Direct Image] Detected backend URL, extracting path: ${url.pathname}`);
          normalizedPath = url.pathname;
        } else {
          // If it's not our backend, we should use the full URL
          console.log(`[Direct Image] Using external URL directly: ${normalizedPath}`);
          // We'll handle this case below by setting fullUrl directly
        }
      } catch (e) {
        console.error(`[Direct Image] Failed to parse URL: ${normalizedPath}`, e);
      }
    }

    // Ensure it starts with a slash
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = `/${normalizedPath}`;
    }

    // If the path doesn't start with /uploads/ but contains 'uploads', fix it
    if (!normalizedPath.startsWith('/uploads/') && normalizedPath.includes('uploads')) {
      const uploadsPart = normalizedPath.split('uploads/');
      if (uploadsPart.length > 1) {
        normalizedPath = `/uploads/${uploadsPart[1]}`;
      }
    }

    // Initialize fullUrl variable
    let fullUrl: string;

    // If the original path was a full URL, use it directly
    if (imagePath.startsWith('http')) {
      try {
        const url = new URL(imagePath);

        // Check if this is a localhost URL
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          console.error(`[Direct Image] Error: URL contains localhost: ${imagePath}`);
          return new NextResponse('Localhost URLs are not allowed', { status: 400 });
        }

        // If it's our backend URL or any other valid URL, use it directly
        fullUrl = imagePath;
        console.log(`[Direct Image] Using URL directly: ${fullUrl}`);

        // Check if the URL contains the backend URL twice (a common error)
        if (fullUrl.includes('beopn.mysesa.site/beopn.mysesa.site')) {
          console.warn(`[Direct Image] Warning: URL contains backend URL twice: ${fullUrl}`);
          // Fix the URL by removing the duplicate backend URL
          fullUrl = fullUrl.replace('beopn.mysesa.site/beopn.mysesa.site', 'beopn.mysesa.site');
          console.log(`[Direct Image] Fixed URL: ${fullUrl}`);
        }
      } catch (e) {
        // If there's an error parsing the URL or it's a localhost URL, use the backend URL
        // IMPORTANT: Always use the backend URL directly, never localhost
        // Get the backend URL from config
        const backendUrl = API_CONFIG.BACKEND_URL;

        // Make sure we have the correct backend URL
        if (!backendUrl || backendUrl.includes('localhost')) {
          console.error('[Direct Image] Invalid backend URL:', backendUrl);
          return new NextResponse('Invalid backend configuration', { status: 500 });
        }

        // Remove /api/v1 from the backend URL if present
        const baseUrlWithoutApiPath = backendUrl.replace(/\/api\/v1$/, '');

        // Construct the full URL properly to avoid double slashes
        fullUrl = constructFullBackendUrl(baseUrlWithoutApiPath, normalizedPath);
        console.log(`[Direct Image] Constructed backend URL: ${fullUrl}`);
      }
    } else {
      // This is a relative path, construct the full URL using the backend URL
      // Get the backend URL from config
      const backendUrl = API_CONFIG.BACKEND_URL;

      // Make sure we have the correct backend URL
      if (!backendUrl || backendUrl.includes('localhost')) {
        console.error('[Direct Image] Invalid backend URL:', backendUrl);
        return new NextResponse('Invalid backend configuration', { status: 500 });
      }

      // Remove /api/v1 from the backend URL if present
      const baseUrlWithoutApiPath = backendUrl.replace(/\/api\/v1$/, '');

      // Construct the full URL properly to avoid double slashes
      fullUrl = constructFullBackendUrl(baseUrlWithoutApiPath, normalizedPath);
      console.log(`[Direct Image] Constructed backend URL from relative path: ${fullUrl}`);
    }

    console.log(`[Direct Image] Using full backend URL: ${fullUrl}`);

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
        console.log('[Direct Image] Using token from cookies');
      }
    } else {
      console.log('[Direct Image] Using authorization from headers');
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
      console.log(`[Direct Image] Added Authorization header: ${maskedToken}`);
    } else {
      console.warn('[Direct Image] No authorization token found');
    }

    // Make the request to the backend with a direct GET request
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: requestHeaders,
      cache: 'no-store'
    });

    // Check if the response is successful
    if (!response.ok) {
      console.error(`[Direct Image] Backend returned error: ${response.status}`);
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
    console.error('[Direct Image] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
