import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';

// No mock responses - always use real backend data

// Helper function to get backend URL
export function getBackendUrl() {
  const backendUrl = API_CONFIG.BACKEND_URL;
  return backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
}

// Generic API route handler
export async function handleApiRoute(
  request: NextRequest,
  endpoint: string,
  options: {
    requireAuth?: boolean;
    timeout?: number;
  } = {}
) {
  const { requireAuth = true, timeout = 30000 } = options;

  try {
    // Get method and URL
    const method = request.method;

    // Always use real backend data, even in development mode
    // No mock responses in development mode
    const backendUrl = getBackendUrl();
    const fullUrl = `${backendUrl}/api/v1${endpoint}`;

    console.log(`Forwarding ${method} request to: ${fullUrl}`);

    // Get headers
    const headers: HeadersInit = {
      'Content-Type': request.headers.get('content-type') || 'application/json',
    };

    // Add authorization header if required
    if (requireAuth) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader) {
        // Always return 401 if no auth header is present
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        headers['Authorization'] = authHeader;
      }
    }

    // Create request options
    const requestOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(timeout),
    };

    // Add body for non-GET requests
    if (method !== 'GET' && method !== 'HEAD') {
      if (request.headers.get('content-type')?.includes('multipart/form-data')) {
        // Handle form data
        const formData = await request.formData();
        requestOptions.body = formData;
        // Remove content-type to let the browser set it with the boundary
        delete headers['Content-Type'];
      } else {
        // Handle JSON or URL-encoded data
        const body = await request.text();
        requestOptions.body = body;
      }
    }

    // Forward request to backend API
    console.log(`[handleApiRoute] Sending ${method} request to backend: ${fullUrl}`);
    console.log(`[handleApiRoute] Request headers:`, headers);

    const response = await fetch(fullUrl, requestOptions);

    // Log detailed response information
    console.log(`[handleApiRoute] Backend response status for ${fullUrl}: ${response.status}`);
    const backendContentType = response.headers.get('content-type');
    console.log(`[handleApiRoute] Backend response Content-Type: ${backendContentType}`);

    // Clone the response to read the body as text first for logging
    const responseClone = response.clone();
    const backendBodyText = await responseClone.text();
    console.log(`[handleApiRoute] Backend response body text (first 500 chars): ${backendBodyText.substring(0, 500)}${backendBodyText.length > 500 ? '...' : ''}`);

    // Get response data
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      try {
        // Try to parse as JSON
        const data = JSON.parse(backendBodyText);
        console.log(`[handleApiRoute] Successfully parsed response as JSON`);
        return NextResponse.json(data, { status: response.status });
      } catch (jsonError) {
        console.error(`[handleApiRoute] Error parsing JSON response:`, jsonError);
        console.log(`[handleApiRoute] Returning raw text response with status ${response.status}`);
        return new Response(backendBodyText, {
          status: response.status,
          headers: {
            'Content-Type': contentType || 'text/plain',
          }
        });
      }
    } else {
      console.log(`[handleApiRoute] Returning non-JSON response with status ${response.status}`);
      return new Response(backendBodyText, {
        status: response.status,
        headers: {
          'Content-Type': contentType || 'text/plain',
        }
      });
    }
  } catch (error) {
    console.error(`Error in API route handler:`, error);

    // Even in development mode, we should return a proper error
    console.error(`Error forwarding request to ${endpoint}:`, error);

    // Return appropriate error response
    return new Response(
      JSON.stringify({
        error: 'API request failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
