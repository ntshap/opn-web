/**
 * API route for a specific event
 * Handles GET, PUT, and DELETE requests for a specific event
 */
import type { NextRequest } from 'next/server';
import { handleApiRoute } from '../../_helpers/api-route-handler';

// GET /api/v1/event/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`Processing GET request for event ID: ${id}`);

    // Forward the request to the backend API
    return await handleApiRoute(request, `/events/${id}`, {
      timeout: 15000, // Increase timeout for event details
    });
  } catch (error) {
    console.error(`Error in GET /event/${params.id}:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch event details' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PUT /api/v1/event/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Extract the ID from params - use Promise.resolve to handle async params
  const { id } = await Promise.resolve(params);
  return handleApiRoute(request, `/events/${id}`);
}

// DELETE /api/v1/event/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Extract the ID from params - use Promise.resolve to handle async params
  const { id } = await Promise.resolve(params);
  return handleApiRoute(request, `/events/${id}`);
}
