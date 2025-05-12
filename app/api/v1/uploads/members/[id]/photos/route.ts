/**
 * API route for member photos
 * Handles POST requests for uploading member photos
 */
import type { NextRequest } from 'next/server';
import { handleApiRoute } from '../../../../_helpers/api-route-handler';

// POST /api/v1/uploads/members/[id]/photos
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from params - use Promise.resolve to handle async params
    const { id } = await Promise.resolve(params);
    console.log(`Processing POST request for uploading photos to member ${id}`);

    // Forward the request to the backend API using the correct uploads endpoint
    // The backend expects the URL to be /uploads/members/{id}/photos (without trailing slash)
    console.log(`[API Route] Forwarding to backend endpoint: /uploads/members/${id}/photos`);
    const response = await handleApiRoute(request, `/uploads/members/${id}/photos`, {
      timeout: 30000, // Increase timeout for uploads
      requireAuth: true
    });

    // Return the response from the backend
    return response;
  } catch (error) {
    console.error(`Error uploading photos for member ${params.id}:`, error);
    return new Response(
      JSON.stringify({ error: 'Failed to upload photos', message: 'There was an error connecting to the server' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
