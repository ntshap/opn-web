/**
 * API route for a specific member
 * Handles GET, PUT, and DELETE requests for a specific member
 */
import type { NextRequest } from 'next/server';
import { handleApiRoute } from '../../_helpers/api-route-handler';

// GET /api/v1/members/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`[API Route] Processing GET request for member ID: ${id}`);

    // Forward the request to the backend API with trailing slash
    try {
      const response = await handleApiRoute(request, `/members/${id}/`, {
        timeout: 15000, // Increase timeout for member details
        requireAuth: true
      });

      // If the response is not OK, try without trailing slash
      if (!response.ok && response.status === 404) {
        console.log(`[API Route] Member ${id} not found with trailing slash, trying without slash`);
        try {
          const fallbackResponse = await handleApiRoute(request, `/members/${id}`, {
            timeout: 15000,
            requireAuth: true
          });

          if (fallbackResponse.ok) {
            console.log(`[API Route] Successfully fetched member ${id} without trailing slash`);
            return fallbackResponse;
          }

          // If both attempts fail with 404, return a friendly error
          if (fallbackResponse.status === 404) {
            console.log(`[API Route] Member ${id} not found with or without trailing slash`);
            return new Response(
              JSON.stringify({ error: 'Member not found', message: 'The requested member does not exist' }),
              { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
          }

          return fallbackResponse;
        } catch (fallbackError) {
          console.error(`[API Route] Error in fallback request for member ${id}:`, fallbackError);
          // Continue with the original response
        }
      }

      return response;
    } catch (apiError) {
      console.error(`[API Route] API error fetching member ${id}:`, apiError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch member details', message: 'There was an error connecting to the server' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    // Get the ID safely
    const id = await Promise.resolve(params).then(p => p.id).catch(() => 'unknown');
    console.error(`[API Route] Error in GET /members/${id}:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch member details', message: 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// PUT /api/v1/members/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`[API Route] Processing PUT request for member ID: ${id}`);

    // Forward the request to the backend API with trailing slash
    return await handleApiRoute(request, `/members/${id}/`, {
      timeout: 20000, // Increase timeout for updates
      requireAuth: true
    });
  } catch (error) {
    // Get the ID safely
    const id = await Promise.resolve(params).then(p => p.id).catch(() => 'unknown');
    console.error(`[API Route] Error in PUT /members/${id}:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to update member', message: 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// DELETE /api/v1/members/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`[API Route] Processing DELETE request for member ID: ${id}`);

    // Forward the request to the backend API with trailing slash
    return await handleApiRoute(request, `/members/${id}/`, {
      timeout: 15000, // Increase timeout for deletes
      requireAuth: true
    });
  } catch (error) {
    // Get the ID safely
    const id = await Promise.resolve(params).then(p => p.id).catch(() => 'unknown');
    console.error(`[API Route] Error in DELETE /members/${id}:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete member', message: 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
