import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth-utils';

/**
 * API route to proxy authenticated image requests
 * This version explicitly uses the GET method, not OPTIONS
 */
export async function GET(request: NextRequest) {
  try {
    // Get the URL from the query string
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    // Validate the URL
    if (!imageUrl) {
      console.error('[Auth Image] No URL provided');
      return new NextResponse(JSON.stringify({ error: 'No URL provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if the URL contains localhost
    if (imageUrl.includes('localhost')) {
      console.error('[Auth Image] URL contains localhost:', imageUrl);
      return new NextResponse(JSON.stringify({ error: 'Direct localhost requests are not allowed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the auth token
    const authToken = getAuthToken();
    if (!authToken) {
      console.warn('[Auth Image] No authorization token found');

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
      method: 'GET', // Explicitly use GET method, not OPTIONS
      headers: {
        'Authorization': authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`,
        'Accept': 'image/*',
      },
      cache: 'no-store'
    });

    // Check if the response is successful
    if (!response.ok) {
      console.error(`[Auth Image] Backend returned error: ${response.status}`);
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
    console.error('[Auth Image] Error:', error);

    // Return a 500 error response
    return new NextResponse(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
