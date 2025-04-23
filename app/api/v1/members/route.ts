/**
 * API route for members
 * Handles GET and POST requests for members
 */
import type { NextRequest } from 'next/server';
import { handleApiRoute } from '../_helpers/api-route-handler';

// GET /api/v1/members
export async function GET(request: NextRequest) {
  try {
    console.log('[API Route] Processing GET request for members');

    // Extract query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    console.log('[API Route] Query parameters:', Object.fromEntries(searchParams.entries()));

    // Forward the request to the backend API WITH trailing slash
    console.log('[API Route] Attempting to fetch members with trailing slash');
    try {
      // Log the request headers for debugging
      const authHeader = request.headers.get('Authorization');
      console.log('[API Route] Authorization header:', authHeader ? `${authHeader.substring(0, 20)}...` : 'Missing');

      const response = await handleApiRoute(request, '/members/', {
        timeout: 30000, // Increase timeout for fetching members
        requireAuth: true
      });

      console.log('[API Route] Members response status:', response.status);

      // Try to read the response body for debugging
      try {
        const responseClone = response.clone();
        const contentType = responseClone.headers.get('Content-Type');
        console.log('[API Route] Response Content-Type:', contentType);

        if (contentType?.includes('application/json')) {
          const responseData = await responseClone.json();
          console.log('[API Route] Response data (first 100 chars):',
            JSON.stringify(responseData).substring(0, 100) + '...');
        } else {
          const responseText = await responseClone.text();
          console.log('[API Route] Response text (first 100 chars):',
            responseText.substring(0, 100) + '...');
        }
      } catch (readError) {
        console.error('[API Route] Error reading response body:', readError);
      }

      // Return the response regardless of status
      return response;
    } catch (error) {
      console.error('[API Route] Error fetching members:', error);
      // Log more details about the error
      if (error instanceof Error) {
        console.error('[API Route] Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      } else {
        console.error('[API Route] Unknown error type:', typeof error);
      }
      // If the request fails, throw to be caught by the outer catch block
      throw error;
    }
  } catch (error) {
    console.error('[API Route] Error in GET /members:', error);

    // Return a more detailed error response
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch members',
        message: 'There was an error connecting to the server',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST /api/v1/members
export async function POST(request: NextRequest) {
  try {
    console.log('[API Route] Processing POST request for creating a member');

    // Forward the request to the backend API WITH trailing slash
    const response = await handleApiRoute(request, '/members/', {
      timeout: 30000, // Increase timeout for creating members
      requireAuth: true
    });

    console.log('[API Route] Member creation response status:', response.status);
    return response;
  } catch (error) {
    console.error('[API Route] Error in POST /members:', error);

    // Return a detailed error response
    return new Response(
      JSON.stringify({
        error: 'Failed to create member',
        message: 'There was an error connecting to the server',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}