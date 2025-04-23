/**
 * API route for individual feedback
 * Handles GET, PUT, and DELETE requests for individual feedback
 */
import type { NextRequest } from 'next/server';
import { handleApiRoute } from '../../../_helpers/api-route-handler';

// GET /api/v1/feedback/feedback/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`Processing GET request for feedback ID: ${id}`);

    // Forward the request to the backend API
    return await handleApiRoute(request, `/feedback/feedback/${id}`, {
      timeout: 15000, // Increase timeout for feedback details
      requireAuth: true
    });
  } catch (error) {
    console.error(`Error in GET /feedback/feedback/${params.id}:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch feedback details' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PUT /api/v1/feedback/feedback/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`Processing PUT request for feedback ID: ${id}`);

    // Forward the request to the backend API
    return await handleApiRoute(request, `/feedback/feedback/${id}`, {
      timeout: 15000, // Increase timeout for feedback updates
      requireAuth: true
    });
  } catch (error) {
    console.error(`Error in PUT /feedback/feedback/${params.id}:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to update feedback' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE /api/v1/feedback/feedback/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`Processing DELETE request for feedback ID: ${id}`);

    // Forward the request to the backend API
    return await handleApiRoute(request, `/feedback/feedback/${id}`, {
      timeout: 15000, // Increase timeout for feedback deletion
      requireAuth: true
    });
  } catch (error) {
    console.error(`Error in DELETE /feedback/feedback/${params.id}:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete feedback' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
