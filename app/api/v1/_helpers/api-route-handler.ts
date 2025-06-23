import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';

// No mock responses - always use real backend data

// Helper function to get backend URL
export function getBackendUrl() {
  const backendUrl = API_CONFIG.BACKEND_URL;
  return backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
}

// Add CORS headers to response
export function addCorsHeaders(response: Response | NextResponse) {
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE,PATCH');
  response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  return response;
}

// Handle OPTIONS requests for CORS preflight
export function handleOptionsRequest() {
  console.log('Handling OPTIONS request for CORS preflight');

  // Create a new response with 200 status
  const response = new NextResponse(null, {
    status: 200,
  });

  // Add CORS headers
  return addCorsHeaders(response);
}

// Generic API route handler
export async function handleApiRoute(
  request: NextRequest,
  endpoint: string,
  options: {
    requireAuth?: boolean;
    timeout?: number;
    overrideContentType?: string;
  } = {}
) {
  const { requireAuth = true, timeout = 30000, overrideContentType } = options;

  // Handle OPTIONS requests for CORS preflight
  if (request.method === 'OPTIONS') {
    return handleOptionsRequest();
  }

  try {
    // Get method and URL
    const method = request.method;

    // Always use real backend data, even in development mode
    // No mock responses in development mode
    const backendUrl = getBackendUrl();

    // All endpoints, including uploads, should use the standard format
    // Format should be: https://beopn.penaku.site/api/v1/uploads/finances/10/document
    const fullUrl = `${backendUrl}/api/v1${endpoint}`;

    // Log the URL for debugging
    console.log(`[handleApiRoute] Using standard URL format: ${fullUrl}`);

    console.log(`Forwarding ${method} request to: ${fullUrl}`);

    // Get headers
    const headers: HeadersInit = {
      'Content-Type': overrideContentType || request.headers.get('content-type') || 'application/json',
    };

    // Add authorization header if required
    if (requireAuth) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader) {
        // Always return 401 if no auth header is present
        const errorResponse = new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
        return addCorsHeaders(errorResponse);
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
        const jsonResponse = NextResponse.json(data, { status: response.status });
        return addCorsHeaders(jsonResponse);
      } catch (jsonError) {
        console.error(`[handleApiRoute] Error parsing JSON response:`, jsonError);
        console.log(`[handleApiRoute] Returning raw text response with status ${response.status}`);
        const textResponse = new Response(backendBodyText, {
          status: response.status,
          headers: {
            'Content-Type': contentType || 'text/plain',
          }
        });
        return addCorsHeaders(textResponse);
      }
    } else {
      console.log(`[handleApiRoute] Returning non-JSON response with status ${response.status}`);
      const nonJsonResponse = new Response(backendBodyText, {
        status: response.status,
        headers: {
          'Content-Type': contentType || 'text/plain',
        }
      });
      return addCorsHeaders(nonJsonResponse);
    }
  } catch (error) {
    console.error(`Error in API route handler:`, error);

    // Even in development mode, we should return a proper error
    console.error(`Error forwarding request to ${endpoint}:`, error);

    // Return appropriate error response
    const errorResponse = new Response(
      JSON.stringify({
        error: 'API request failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    return addCorsHeaders(errorResponse);
  }
}
