/**
 * API route for event feedback
 * Handles GET and POST requests for event feedback
 */
import type { NextRequest } from 'next/server';
import { handleApiRoute } from '../../../../_helpers/api-route-handler';

// GET /api/v1/feedback/event/[id]/feedback
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`Processing GET request for event ${id} feedback`);

    // Forward the request to the backend API
    return await handleApiRoute(request, `/feedback/event/${id}/feedback`, {
      timeout: 15000, // Increase timeout for feedback
      requireAuth: true
    });
  } catch (error) {
    console.error(`Error in GET /feedback/event/${params.id}/feedback:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch event feedback' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST /api/v1/feedback/event/[id]/feedback
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`Processing POST request for creating feedback for event ${id}`);

    // Forward the request to the backend API
    return await handleApiRoute(request, `/feedback/event/${id}/feedback`, {
      timeout: 15000, // Increase timeout for feedback creation
      requireAuth: true
    });
  } catch (error) {
    console.error(`Error in POST /feedback/event/${params.id}/feedback:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to create feedback' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
