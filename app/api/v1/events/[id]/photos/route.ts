/**
 * API route for event photos
 * Handles GET and POST requests for event photos
 */
import type { NextRequest } from 'next/server';
import { handleApiRoute } from '../../../_helpers/api-route-handler';

// GET /api/v1/events/[id]/photos
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`Processing GET request for event ${id} photos`);

    // Forward the request to the backend API using the correct endpoint
    const response = await handleApiRoute(request, `/uploads/events/${id}/photos`, {
      timeout: 15000, // Increase timeout for photos
      requireAuth: true
    });

    // Check if response is HTML (indicates wrong endpoint/404)
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/html')) {
      console.error(`Received HTML response instead of JSON for event ${id} photos`);
      return new Response(
        JSON.stringify({
          error: 'Invalid API endpoint or server error',
          data: []
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if response is ok
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Error fetching photos for event ${id}:`, errorData);
      return new Response(
        JSON.stringify({
          error: errorData.error || 'Failed to fetch event photos',
          status: response.status,
          data: []
        }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse and validate response
    const data = await response.json();
    if (!Array.isArray(data)) {
      console.error(`Invalid response format for event ${id} photos:`, data);
      return new Response(
        JSON.stringify({
          error: 'Invalid response format from server',
          data: []
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ data }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    // Get the ID safely
    const id = await Promise.resolve(params).then(p => p.id).catch(() => 'unknown');
    console.error(`Error in GET /events/${id}/photos:`, error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to fetch event photos',
        data: []
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// POST /api/v1/events/[id]/photos
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`Processing POST request for event ${id} photos`);

    // Forward the request to the backend API using the correct uploads endpoint
    const response = await handleApiRoute(request, `/uploads/events/${id}/photos`, {
      timeout: 30000, // Increase timeout for uploads
      requireAuth: true
    });

    // Check if response is HTML (indicates wrong endpoint/404)
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/html')) {
      console.error(`Received HTML response instead of JSON for event ${id} photos upload`);
      return new Response(
        JSON.stringify({
          error: 'Invalid API endpoint or server error'
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return new Response(
        JSON.stringify({
          error: errorData.error || 'Failed to upload event photos',
          status: response.status
        }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return response;
  } catch (error) {
    // Get the ID safely
    const id = await Promise.resolve(params).then(p => p.id).catch(() => 'unknown');
    console.error(`Error in POST /events/${id}/photos:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to upload event photos' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
