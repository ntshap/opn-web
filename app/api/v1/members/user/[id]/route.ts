/**
 * API route for deleting a user
 * Handles DELETE requests for a specific user
 */
import type { NextRequest } from 'next/server';
import { handleApiRoute } from '../../../_helpers/api-route-handler';

// DELETE /api/v1/members/user/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`[API Route] Processing DELETE request for user ID: ${id}`);

    // Forward the request to the backend API
    return await handleApiRoute(request, `/members/user/${id}`, {
      timeout: 15000, // Increase timeout for deletes
      requireAuth: true
    });
  } catch (error) {
    // Get the ID safely
    const id = await Promise.resolve(params).then(p => p.id).catch(() => 'unknown');
    console.error(`[API Route] Error in DELETE /members/user/${id}:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete user', message: 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
