/**
 * API route for individual meeting minutes
 * Handles GET, PUT, and DELETE requests for individual meeting minutes
 */
import type { NextRequest } from 'next/server';
import { handleApiRoute } from '../../_helpers/api-route-handler';

// GET /api/v1/meeting-minutes/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`Processing GET request for meeting minutes ID: ${id}`);

    // Forward the request to the backend API
    return await handleApiRoute(request, `/meeting-minutes/${id}/`, {
      timeout: 15000, // Increase timeout for meeting minutes details
      requireAuth: true
    });
  } catch (error) {
    console.error(`Error in GET /meeting-minutes/${params.id}:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch meeting minutes details' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PUT /api/v1/meeting-minutes/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`Processing PUT request for meeting minutes ID: ${id}`);

    // Forward the request to the backend API
    return await handleApiRoute(request, `/meeting-minutes/${id}/`, {
      timeout: 15000, // Increase timeout for meeting minutes updates
      requireAuth: true
    });
  } catch (error) {
    console.error(`Error in PUT /meeting-minutes/${params.id}:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to update meeting minutes' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE /api/v1/meeting-minutes/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`Processing DELETE request for meeting minutes ID: ${id}`);

    // Forward the request to the backend API
    return await handleApiRoute(request, `/meeting-minutes/${id}/`, {
      timeout: 15000, // Increase timeout for meeting minutes deletion
      requireAuth: true
    });
  } catch (error) {
    console.error(`Error in DELETE /meeting-minutes/${params.id}:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete meeting minutes' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
