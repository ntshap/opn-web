/**
 * API route for a specific event
 * Handles GET, PUT, and DELETE requests for a specific event
 */
import type { NextRequest } from 'next/server';
import { handleApiRoute } from '../../_helpers/api-route-handler';

// GET /api/v1/events/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`[API Route] Processing GET request for event ID: ${id}`);

    // Forward the request to the backend API without trailing slash
    try {
      console.log(`[API Route] Fetching event ${id} without trailing slash`);
      const response = await handleApiRoute(request, `/events/${id}`, {
        timeout: 15000, // Increase timeout for event details
        requireAuth: true
      });

      // If the event is not found, return a 404 response
      if (response.status === 404) {
        console.log(`[API Route] Event ${id} not found`);
        return new Response(
          JSON.stringify({ error: 'Event not found', message: 'The requested event does not exist' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return response;
    } catch (apiError) {
      console.error(`[API Route] API error fetching event ${id}:`, apiError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch event details', message: 'There was an error connecting to the server' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    // Get the ID safely
    const id = await Promise.resolve(params).then(p => p.id).catch(() => 'unknown');
    console.error(`[API Route] Error in GET /events/${id}:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch event details', message: 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PUT /api/v1/events/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`[API Route] Processing PUT request for event ID: ${id}`);

    // Forward the request to the backend API without trailing slash
    return await handleApiRoute(request, `/events/${id}`, {
      timeout: 20000, // Increase timeout for updates
      requireAuth: true
    });
  } catch (error) {
    // Get the ID safely
    const id = await Promise.resolve(params).then(p => p.id).catch(() => 'unknown');
    console.error(`[API Route] Error in PUT /events/${id}:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to update event', message: 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE /api/v1/events/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`[API Route] Processing DELETE request for event ID: ${id}`);

    // Forward the request to the backend API without trailing slash
    return await handleApiRoute(request, `/events/${id}`, {
      timeout: 15000, // Increase timeout for deletes
      requireAuth: true
    });
  } catch (error) {
    // Get the ID safely
    const id = await Promise.resolve(params).then(p => p.id).catch(() => 'unknown');
    console.error(`[API Route] Error in DELETE /events/${id}:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete event', message: 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
